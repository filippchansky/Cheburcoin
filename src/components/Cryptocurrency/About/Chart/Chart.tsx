"use client";
import React, { useEffect, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import { graphData } from "../../../../../configs/graph";

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
      let updatedDataChart = { ...dataChart };
      charts?.forEach((item) => {
        updatedDataChart.date.push(item[0]);
        updatedDataChart.value.push(item[1]);
      });
      setDataChart(updatedDataChart);
      console.log(updatedDataChart);
    }
  }, [charts]);

  console.log(dataChart);

  return (
    <LineChart
      xAxis={[
        {
          data: dataChart.date,
        },
      ]}
      series={[
        {
          data: dataChart.value,
        },
      ]}
    />
  );
};
export default Chart;
