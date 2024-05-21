"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import Chart from "./Chart/Chart";
import style from "./style.module.scss";
import { Card, Radio, Segmented, Select, Skeleton } from "antd";
import { fetchChart } from "@api/coinstats/getChartById";
import CoinCard from "@/UI/CoinCard/CoinCard";
import { getCoinById } from "@api/coinstats/getCoinById";
import { CardSkeleton } from "@/UI/Skeletons/CardSkeleton";

interface AboutCurrencyProps {}

const AboutCurrency: React.FC<AboutCurrencyProps> = ({}) => {
  const { slug } = useParams();
  const coin_id = slug[0];
  const [period, setPeriod] = useState("1w");
  const { data, isError, isLoading } = useQuery({
    queryKey: ["chart", coin_id, period],
    queryFn: () => fetchChart(coin_id, period),
    refetchOnWindowFocus: false,
    // refetchInterval: 10000
  });

  const { data: coin_data } = useQuery({
    queryKey: ["coin"],
    queryFn: () => getCoinById(coin_id),
    refetchOnWindowFocus: false,
  });

  return (
    <div className={style.chartContainer}>
      <div className="flex items-end justify-around">
        <Segmented<string>
          options={["All", "24h", "1W", "1M", "3M", "6M", "1Y"]}
          onChange={(value) => {
            console.log(value); // string
            setPeriod(value.toLowerCase());
          }}
        />
        {coin_data ? (
          <CoinCard item={coin_data} />
        ) : (
          <CardSkeleton/>
        )}
      </div>
      <Chart charts={data} />
    </div>
  );
};
export default AboutCurrency;
