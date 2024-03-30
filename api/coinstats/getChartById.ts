import axios from "axios";

export const fetchChart = async (coin_id: string, period: string) => {
    const { data } = await axios.get(
      `https://openapiv1.coinstats.app/coins/${coin_id}/charts?period=${period}`,
      {
        headers: {
          "X-API-KEY": process.env.NEXT_PUBLIC_COIN,
        },
      }
    );
    return data;
  };