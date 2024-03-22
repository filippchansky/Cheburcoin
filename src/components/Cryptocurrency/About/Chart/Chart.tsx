"use client";
import React, { useEffect, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { graphData } from "../../../../../configs/graph";
import style from "./style.module.scss";

interface ChartProps {
  charts: number[][];
}

interface IDataChart {
  date: number[];
  value: number[];
}

const Chart: React.FC<ChartProps> = ({ charts }) => {
  const [dataChart, setDataChart] = useState<IDataChart>({
    date: [],
    value: [],
  });

  useEffect(() => {
    if (charts) {
      const newDataChart: IDataChart = {
        date: [],
        value: [],
      };
      charts.forEach((item) => {
        newDataChart.date.push(item[0]);
        newDataChart.value.push(item[1]);
      });
      setDataChart(newDataChart);
    }
  }, [charts]);

  return (
    <LineChart
      xAxis={[
        {
          labelStyle: { color: "red" },
          data: dataChart.date,
          valueFormatter: (value) =>
            new Date(value * 1000).toLocaleDateString(),
        },
      ]}
      series={[
        {
          data: dataChart.value,
          showMark: false,
        },
      ]}
    />
  );
};
export default Chart;
