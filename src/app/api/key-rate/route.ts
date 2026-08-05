import { NextResponse } from 'next/server';

const CBR_URL = 'https://www.cbr.ru/DailyInfoWebServ/DailyInfo.asmx';

const buildEnvelope = (from: string, to: string) =>
    `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <KeyRate xmlns="http://web.cbr.ru/">
      <fromDate>${from}</fromDate>
      <ToDate>${to}</ToDate>
    </KeyRate>
  </soap:Body>
</soap:Envelope>`;

const daysAgo = (n: number) => new Date(Date.now() - n * 864e5).toISOString().split('T')[0];

/**
 * Ключевая ставка ЦБ РФ. CBR отдаёт только SOAP без CORS, поэтому дёргаем его
 * на серверной стороне и возвращаем клиенту простой JSON { rate, date }.
 * Берём самую свежую запись (первый блок <KR> = последняя дата).
 */
export async function GET() {
    try {
        const today = daysAgo(0);
        const response = await fetch(CBR_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                SOAPAction: 'http://web.cbr.ru/KeyRate'
            },
            body: buildEnvelope(daysAgo(14), today),
            next: { revalidate: 3600 }
        });

        const xml = await response.text();
        const match = xml.match(/<KR[^>]*>[\s\S]*?<DT>([^<]+)<\/DT>[\s\S]*?<Rate>([^<]+)<\/Rate>/);
        if (!match) {
            return NextResponse.json({ error: 'no key rate' }, { status: 502 });
        }

        return NextResponse.json({
            rate: Number(match[2]),
            date: match[1].split('T')[0]
        });
    } catch {
        return NextResponse.json({ error: 'failed to fetch key rate' }, { status: 502 });
    }
}
