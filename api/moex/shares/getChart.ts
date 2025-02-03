import { apiMoex } from '../instance';

export const getChart = async (ticker: string, from: string | null, interval: string) => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяцы начинаются с 0
    const day = String(date.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;
    const { data } = await apiMoex.get(
        `iss/engines/stock/markets/shares/securities/${ticker}/candles.json?from=${from}&till=${formattedDate}&interval=${interval}&iss.meta=off`
    );
    return data;
};
