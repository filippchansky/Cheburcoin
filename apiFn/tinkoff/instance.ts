import axios from 'axios';

export const apiTinkoff = axios.create({
    baseURL: process.env.NEXT_PUBLIC_TINKOFF_API,
    headers: {
        accept: 'application/json'
    }
});