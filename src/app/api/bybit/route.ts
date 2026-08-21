import { NextRequest, NextResponse } from 'next/server';
import { getWalletBalance, BybitError } from '@/lib/bybit/client';

/**
 * Прокси к приватному Bybit API v5 (только чтение).
 *
 * Почему сервер: подпись HMAC требует secret'а, который нельзя отдавать в браузер;
 * плюс серверный IP обходит гео/CORS-ограничения биржи (см. bybit-integration-plan).
 * POST + вайтлист операций (`op`) — чтобы наружу торчал ровно тот набор чтений,
 * что нам нужен, и ничего лишнего. Секреты — только в env (BYBIT_API_KEY/SECRET).
 */

// HMAC-подпись использует Node crypto — Edge-рантайм его не даёт, форсим Node.
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const { op, apiKey, apiSecret } = (await req.json()) as {
            op?: string;
            apiKey?: string;
            apiSecret?: string;
        };
        // Пер-юзер ключи из тела (Firestore). Если пусто — client возьмёт env-fallback.
        const creds = apiKey && apiSecret ? { apiKey, apiSecret } : undefined;

        switch (op) {
            case 'wallet-balance': {
                const balances = await getWalletBalance(creds);
                return NextResponse.json({ balances });
            }
            default:
                return NextResponse.json({ error: 'unsupported op' }, { status: 400 });
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'bybit proxy failed';
        // Ошибка биржи/подписи → 502 (upstream), прочее (битый body) → 400.
        const status = error instanceof BybitError ? 502 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}
