import axios from 'axios';
import { config } from './config';
import { api } from './instance';

export const fetchChart = async (coin_id: string, period: string) => {
  const { data } = await api.get(`coins/${coin_id}/charts?period=${period}`, config);
  return data;
};
