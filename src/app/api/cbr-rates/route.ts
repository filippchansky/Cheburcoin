import { NextResponse } from 'next/server';

const CBR_URL = 'https://www.cbr.ru/scripts/XML_daily.asp';

/**
 * Разбирает весь дневной XML ЦБ в карту «код валюты → рублёвый курс за 1 ед.»
 * (значение делим на номинал, т.к. для части валют номинал > 1). Кириллицу из
 * <Name> не читаем — regex её пропускает, поэтому кодировка windows-1251 не
 * мешает: коды валют и числа это ASCII.
 */
const parseRates = (xml: string): Record<string, number> => {
    const rates: Record<string, number> = {};
    const re =
        /<CharCode>([A-Z]{3})<\/CharCode>[\s\S]*?<Nominal>(\d+)<\/Nominal>[\s\S]*?<Value>([\d,]+)<\/Value>/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(xml)) !== null) {
        const nominal = Number(match[2]);
        const value = Number(match[3].replace(',', '.'));
        if (Number.isFinite(value) && nominal) rates[match[1]] = value / nominal;
    }
    return rates;
};

export async function GET() {
    try {
        const response = await fetch(CBR_URL, { next: { revalidate: 3600 } });
        if (!response.ok) {
            return NextResponse.json({ error: 'cbr unavailable' }, { status: 502 });
        }

        const xml = await response.text();
        const date = xml.match(/Date="([^"]+)"/)?.[1] ?? null;
        const rates = parseRates(xml);

        return NextResponse.json({
            // Плоские поля — для обратной совместимости с потребителями ленты.
            usd: rates.USD ?? null,
            eur: rates.EUR ?? null,
            cny: rates.CNY ?? null,
            // Полная карта «код → курс за 1 ед.» — для пересчёта любых валют.
            rates,
            date
        });
    } catch {
        return NextResponse.json({ error: 'failed to fetch cbr rates' }, { status: 502 });
    }
}
