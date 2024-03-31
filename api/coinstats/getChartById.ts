import axios from "axios";
import { config } from "./config";

export const fetchChart = async (coin_id: string, period: string) => {
    const { data } = await axios.get(
      `https://openapiv1.coinstats.app/coins/${coin_id}/charts?period=${period}`,
      config
    );
    return data;
  };