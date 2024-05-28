import axios from "axios";
import { config } from "./config/index";
import { api } from "./instance";
import { ICoin, ICoinData } from "../../models/coinData";

export const getCoinById = async (id: string): Promise<ICoin> => {
  const {data} = await api.get(
    `coins/${id}`,
    config
  );
  return data;
};
