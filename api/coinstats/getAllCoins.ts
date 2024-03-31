import axios from "axios";
import { config } from "./config";

export const fetchCoin = async (
  page: number,
  limit: number,
  setTotalPage: Function
) => {
  const { data } = await axios.get(
    `https://openapiv1.coinstats.app/coins?page=${page}&limit=${limit}`,
    config
  );
  setTotalPage(data?.meta.pageCount);
  return data;
};
