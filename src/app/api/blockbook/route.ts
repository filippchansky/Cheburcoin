import { NextRequest, NextResponse } from 'next/server';
import { readEverstakeStaking } from '@/lib/trezor/ethStaking';

/**
 * Прокси к Blockbook (BTC по xpub, ETH по адресу) + стейкинг ETH.
 *
 * Зачем сервер, а не прямой fetch из браузера: Blockbook за Cloudflare — не отдаёт
 * CORS-заголовки и блокирует «не браузерный» User-Agent. Сервер обходит и то, и другое.
 *
 * Стейкинг ETH: Trezor-сборка Blockbook отдавала его в `stakingPools`, но провайдеры
 * (NOWNodes) — нет. Поэтому для ETH дочитываем стейкинг Everstake через eth_call к
 * контракту пула (см. ethStaking.ts) и кладём в `stakingPools` — клиент не меняется.
 *
 * SSRF-защита: chain из белого списка → фиксированный базовый URL, дескриптор
 * пропускаем только [A-Za-z0-9], длину ограничиваем. POST — чтобы xpub (чувствит.)
 * не попадал в URL и логи.
 */

const BACKENDS: Record<string, { base: string; path: 'address' | 'xpub' }> = {
    eth: { base: process.env.ETH_BLOCKBOOK || 'https://eth1.trezor.io', path: 'address' },
    btc: { base: process.env.BTC_BLOCKBOOK || 'https://btc1.trezor.io', path: 'xpub' }
};

// Публичный Blockbook Trezor (btc1/eth1.trezor.io) за Cloudflare режет облачные IP
// (403 → 502) — с Vercel не работает. Провайдеры (NOWNodes/GetBlock) отдают ТОТ ЖЕ
// Blockbook по api-key. Кладём base-URL в *_BLOCKBOOK, а ключ — в BLOCKBOOK_API_KEY
// (один на все сети). Если ключа нет — заголовок не шлём (дефолт на trezor.io для локалки).
const BLOCKBOOK_API_KEY = process.env.BLOCKBOOK_API_KEY;

// Публичный ETH-RPC для чтения стейкинга Everstake (eth_call, только чтение).
const ETH_RPC = process.env.ETH_RPC || 'https://ethereum-rpc.publicnode.com';

const BROWSER_UA =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';

export async function POST(req: NextRequest) {
    try {
        const { chain, descriptor } = (await req.json()) as {
            chain?: string;
            descriptor?: string;
        };

        const backend = chain ? BACKENDS[chain] : undefined;
        if (!backend) {
            return NextResponse.json({ error: 'unsupported chain' }, { status: 400 });
        }
        if (!descriptor || !/^[A-Za-z0-9]{1,140}$/.test(descriptor)) {
            return NextResponse.json({ error: 'bad descriptor' }, { status: 400 });
        }

        const url = `${backend.base}/api/v2/${backend.path}/${descriptor}?details=basic`;
        const res = await fetch(url, {
            headers: {
                accept: 'application/json',
                'User-Agent': BROWSER_UA,
                ...(BLOCKBOOK_API_KEY ? { 'api-key': BLOCKBOOK_API_KEY } : {})
            },
            cache: 'no-store'
        });
        if (!res.ok) {
            return NextResponse.json({ error: `blockbook ${res.status}` }, { status: 502 });
        }

        const data = await res.json();

        // Стейкинг ETH: если Blockbook его не дал (NOWNodes) — дочитываем из контракта
        // Everstake. Стейкинг не должен ронять ликвид: при сбое отдаём то, что есть.
        let stakingPools = data.stakingPools ?? [];
        if (chain === 'eth' && stakingPools.length === 0) {
            try {
                stakingPools = await readEverstakeStaking(descriptor, ETH_RPC);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.warn('[blockbook] стейкинг ETH не получен:', error);
            }
        }

        // Отдаём только нужное: баланс + пулы стейкинга (остальное — лишний вес/история).
        return NextResponse.json({ balance: data.balance ?? '0', stakingPools });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'blockbook proxy failed' },
            { status: 502 }
        );
    }
}
