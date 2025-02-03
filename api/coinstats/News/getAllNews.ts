import axios from 'axios';
import { config } from '../config';
import { api } from '../instance';

export const fetchNews = async (type: string, page: number, limit: number) => {
    const { data } = await api.get(`news/type/${type}?page=${page}&limit=${limit}`, config);
    return data;
};
