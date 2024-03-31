import { AxiosRequestConfig } from "axios";

export const config: AxiosRequestConfig = {
  headers: {
    accept: "application/json",
    "X-API-KEY": process.env.NEXT_PUBLIC_COIN,
  },
};
