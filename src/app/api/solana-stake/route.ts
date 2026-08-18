import { NextRequest, NextResponse } from 'next/server';

/**
 * Сумма нативного стейкинга Solana по адресу счёта.
 *
 * Стейк-аккаунты — отдельные аккаунты, принадлежащие Stake-программе; их не видно
 * в getBalance. Находим через `getProgramAccounts` по Stake-программе с фильтром
 * memcmp на адрес-авторитет счёта. Публичные ноды (publicnode) этот метод режут
 * (таймаут), а mainnet-beta отдаёт — но из браузера блокирует CORS/403. Поэтому
 * зовём его с сервера: здесь ни CORS, ни UA-блокировки нет.
 *
 * Trezor ставит и staker (offset 12), и withdrawer (offset 44) на адрес счёта —
 * опрашиваем оба и объединяем по pubkey (дубли не задваиваются).
 */

const STAKE_PROGRAM = 'Stake11111111111111111111111111111111111111';
const RPC = process.env.SOLANA_RPC_SERVER || 'https://api.mainnet-beta.solana.com';

/** Смещения авторитетов в аккаунте стейка: staker @12, withdrawer @44. */
const AUTH_OFFSETS = [12, 44];

const isBase58Address = (s: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s);

/** Стейк-аккаунты по одному авторитету → map pubkey→lamports. */
const fetchByAuthority = async (address: string, offset: number): Promise<Map<string, number>> => {
    const res = await fetch(RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'getProgramAccounts',
            params: [
                STAKE_PROGRAM,
                {
                    // Нужны только lamports (метаданные аккаунта) — данные аккаунта
                    // отрезаем, чтобы не тащить лишнее.
                    encoding: 'base64',
                    dataSlice: { offset: 0, length: 0 },
                    filters: [{ memcmp: { offset, bytes: address } }]
                }
            ]
        })
    });
    if (!res.ok) throw new Error(`rpc ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(json.error.message ?? 'rpc error');

    const map = new Map<string, number>();
    for (const acc of json.result ?? []) {
        map.set(acc.pubkey, acc.account?.lamports ?? 0);
    }
    return map;
};

export async function POST(req: NextRequest) {
    try {
        const { address } = (await req.json()) as { address?: string };
        if (!address || !isBase58Address(address)) {
            return NextResponse.json({ error: 'bad address' }, { status: 400 });
        }

        const merged = new Map<string, number>();
        for (const offset of AUTH_OFFSETS) {
            const part = await fetchByAuthority(address, offset);
            part.forEach((lamports, pubkey) => merged.set(pubkey, lamports));
        }

        let staked = 0;
        merged.forEach((lamports) => (staked += lamports));
        return NextResponse.json({ staked }); // в лампортах
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'solana stake failed' },
            { status: 502 }
        );
    }
}
