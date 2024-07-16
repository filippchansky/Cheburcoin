import { ICoin } from '../../models/coinData';
import { config } from './config/index';
import { api } from './instance';

export const getCoinById = async (id: string): Promise<ICoin> => {
  const { data } = await api.get(`coins/${id}`, config);
  return data;
};
