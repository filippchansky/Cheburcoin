import axios from "axios";

export const fetchCoin = async (page: number, limit: number, setTotalPage: Function) => {
    const { data } = await axios.get(
      `https://openapiv1.coinstats.app/coins?page=${page}&limit=${limit}`,
      {
        headers: {
          "X-API-KEY": process.env.NEXT_PUBLIC_COIN,
        },
      }
    );
    setTotalPage(data?.meta.pageCount);
    return data;
  };