import { NextResponse } from 'next/server';
import type { IFngIndex } from '@models/crypto';

/**
 * Индекс страха и жадности крипторынка (alternative.me/fng). Публичный, без ключа
 * и без CORS-заголовков — поэтому дёргаем на сервере. Кэш 1ч (обновляется раз в день).
 */
export async function GET() {
    try {
        const res = await fetch('https://api.alternative.me/fng/?limit=1', {
            next: { revalidate: 3600 }
        });
        if (!res.ok) {
            return NextResponse.json({ error: `fng ${res.status}` }, { status: 502 });
        }

        const json = await res.json();
        const entry = json.data?.[0];
        if (!entry) {
            return NextResponse.json({ error: 'no fng data' }, { status: 502 });
        }

        const result: IFngIndex = {
            value: Number(entry.value),
            classification: entry.value_classification ?? ''
        };
        return NextResponse.json(result);
    } catch {
        return NextResponse.json({ error: 'failed to fetch fng' }, { status: 502 });
    }
}
