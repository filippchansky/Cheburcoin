import axios from "axios";

export const fetchNews = async (type: string, page: number, limit: number, setNews: Function, setFetching: Function ) => {
  const { data } = await axios.get(
    `https://openapiv1.coinstats.app/news/type/${type}?page=${page}&limit=${limit}`,
    {
      headers: {
        "X-API-KEY": process.env.NEXT_PUBLIC_COIN,
      },
    }
  );
  // TODO придумать как сделать без setNews и setFetching
  setNews(data);
  setFetching(false);
  return data;
};
