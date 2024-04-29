import axios from "axios";
import { config } from "./config/index";
import { api } from "./instance";

export const getCoinById = async (id: string) => {
  const {data} = await api.get(
    `coins/${id}`,
    config
  );
  return data;
};
