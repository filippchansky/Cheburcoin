import axios from "axios";


export const apiMoex = axios.create({
    baseURL: process.env.NEXT_PUBLIC_MOEX_API,
    headers: {
        accept: 'application/json'
    }
})