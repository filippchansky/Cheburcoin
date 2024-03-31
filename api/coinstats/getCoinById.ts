import axios from "axios";
import { config } from "./config/index";

export const getCoinById = async (id: string) => {
  const {data} = await axios.get(
    `https://openapiv1.coinstats.app/coins/${id}`,
    config
  );
  return data;
};
