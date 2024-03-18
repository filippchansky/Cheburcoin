"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import Chart from "./Chart/Chart";
import style from "./style.module.scss";

interface AboutCurrencyProps {
  TOKEN: string;
}

const AboutCurrency: React.FC<AboutCurrencyProps> = ({ TOKEN }) => {
  const fetchChart = async (coin_id: string, period: string) => {
    const { data } = await axios.get(
      `https://openapiv1.coinstats.app/coins/${coin_id}/charts?period=${period}`,
      {
        headers: {
          "X-API-KEY": TOKEN,
        },
      }
    );
    return data;
  };
  const { slug } = useParams();
  const coin_id = slug[0];
  const [period, setPeriod] = useState("1w");
  const { data, isError, isLoading } = useQuery({
    queryKey: ["chart", coin_id, period],
    queryFn: () => fetchChart(coin_id, period),
  });

  //   console.log(data);

  return (
    <div className={style.chartContainer}>
      <Chart charts={data} />
    </div>
  );
};
export default AboutCurrency;
