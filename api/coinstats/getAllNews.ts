import axios from "axios";
import { config } from "./config";

export const fetchNews = async (
  type: string,
  page: number,
  limit: number,
  setNews: Function,
  setFetching: Function
) => {
  const { data } = await axios.get(
    `https://openapiv1.coinstats.app/news/type/${type}?page=${page}&limit=${limit}`,
    config
  );
  // TODO придумать как сделать без setNews и setFetching
  setNews(data);
  setFetching(false);
  return data;
};
