import axios from 'axios';
import { NextResponse } from 'next/server';

const API_URL = 'https://invest-public-api.tinkoff.ru/rest/tinkoff.public.invest.api.contract.v1';
const TOKEN =
    't.vGwOj1VkDFPMk3qQAs24tB5GcR9MJelion8XA8lg5SfQARIrlu-uRgJoVNsqnSRmW-eE73ty1ghIXLQI90Iotw'; // Храни в .env

export async function GET() {
    try {
        console.log('Запрашиваем портфель у Тинькофф API...');

        const response = await axios.post(`${API_URL}.UsersService/GetAccounts`, {}, {
            headers: {Authorization: `Bearer ${TOKEN}`}
        });

        return NextResponse.json(response.data)

        // return NextResponse.json(JSON.parse(text));
    } catch (error) {
        console.error('Ошибка запроса:', error);
        return NextResponse.json({ error: 'Серверная ошибка' }, { status: 500 });
    }
}
