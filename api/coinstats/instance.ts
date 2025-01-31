import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_COIN_API,
  headers: {
    accept: 'application/json',
    'X-API-KEY': process.env.NEXT_PUBLIC_COIN
  }
});
