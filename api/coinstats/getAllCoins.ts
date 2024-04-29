import axios from "axios";
import { config } from "./config";
import { api } from "./instance";

export const fetchCoin = async (
  page: number,
  limit: number,
  setTotalPage: Function
) => {
  const { data } = await api.get(
    `coins?page=${page}&limit=${limit}`,
    config
  );
  setTotalPage(data?.meta.pageCount);
  return data;
};
