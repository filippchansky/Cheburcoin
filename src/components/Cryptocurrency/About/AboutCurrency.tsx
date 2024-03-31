"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "next/navigation";
import React, { useState } from "react";
import Chart from "./Chart/Chart";
import style from "./style.module.scss";
import { Radio, Select } from "antd";
import { fetchChart } from "@api/coinstats/getChartById";
import CoinCard from "@/UI/CoinCard/CoinCard";
import { getCoinById } from "@api/coinstats/getCoinById";

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
        <Radio.Group value={period} onChange={(e) => setPeriod(e.target.value)}>
          <Radio.Button className={style.periodBtn} value="all">
            All
          </Radio.Button>
          <Radio.Button className={style.periodBtn} value="24h">
            24h
          </Radio.Button>
          <Radio.Button className={style.periodBtn} value="1w">
            1W
          </Radio.Button>
          <Radio.Button className={style.periodBtn} value="1m">
            1M
          </Radio.Button>
          <Radio.Button className={style.periodBtn} value="3m">
            3M
          </Radio.Button>
          <Radio.Button className={style.periodBtn} value="6m">
            6M
          </Radio.Button>
          <Radio.Button className={style.periodBtn} value="1y">
            1Y
          </Radio.Button>
        </Radio.Group>
        {coin_data? <CoinCard item={coin_data} /> : <>loading</>}
      </div>
      <Chart charts={data} />
    </div>
  );
};
export default AboutCurrency;
