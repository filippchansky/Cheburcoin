import { NextResponse } from 'next/server';

const CBR_URL = 'https://www.cbr.ru/scripts/XML_daily.asp';

/**
 * Официальный курс валюты из дневного XML ЦБ. Значение делим на номинал
 * (для некоторых валют номинал > 1). Кириллицу из ответа не читаем, поэтому
 * кодировка windows-1251 не мешает — коды валют и числа это ASCII.
 */
const parseValute = (xml: string, code: string): number | null => {
    const match = xml.match(
        new RegExp(
            `<CharCode>${code}</CharCode>[\\s\\S]*?<Nominal>(\\d+)</Nominal>[\\s\\S]*?<Value>([\\d,]+)</Value>`
        )
    );
    if (!match) return null;
    const nominal = Number(match[1]);
    const value = Number(match[2].replace(',', '.'));
    if (!Number.isFinite(value)) return null;
    return nominal ? value / nominal : value;
};

export async function GET() {
    try {
        const response = await fetch(CBR_URL, { next: { revalidate: 3600 } });
        if (!response.ok) {
            return NextResponse.json({ error: 'cbr unavailable' }, { status: 502 });
        }

        const xml = await response.text();
        const date = xml.match(/Date="([^"]+)"/)?.[1] ?? null;

        return NextResponse.json({
            usd: parseValute(xml, 'USD'),
            cny: parseValute(xml, 'CNY'),
            date
        });
    } catch {
        return NextResponse.json({ error: 'failed to fetch cbr rates' }, { status: 502 });
    }
}
