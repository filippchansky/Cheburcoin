import axios from "axios";
import { config } from "./config";
import { api } from "./instance";

export const fetchCoin = async (
  page: number,
  limit: number,
) => {
  const { data } = await api.get(
    `coins?page=${page}&limit=${limit}`,
    config
  );
  return data;
};
