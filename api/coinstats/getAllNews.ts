import axios from "axios";
import { config } from "./config";
import { api } from "./instance";

export const fetchNews = async (
  type: string,
  page: number,
  limit: number,
  setNews: Function,
  setFetching: Function
) => {
  const { data } = await api.get(
    `news/type/${type}?page=${page}&limit=${limit}`,
    config
  );
  // TODO придумать как сделать без setNews и setFetching
  setNews(data);
  setFetching(false);
  return data;
};
