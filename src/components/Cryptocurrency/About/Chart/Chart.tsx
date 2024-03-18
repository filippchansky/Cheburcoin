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
        const date = new Date(item[0]); // Convert to milliseconds
        const formattedDate = date.toLocaleString();
        updatedDataChart.date.push(item[0]);
        updatedDataChart.value.push(item[1]);
      });
      setDataChart(updatedDataChart);
      console.log(updatedDataChart);
    }
  }, [charts]);

  return (
    <LineChart
      className="text-white"
      xAxis={[
        {
          labelStyle: { color: "white" },
          data: dataChart.date,
          label: "qweewq",
          valueFormatter: (value) => new Date(value * 1000).toLocaleString(),
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
