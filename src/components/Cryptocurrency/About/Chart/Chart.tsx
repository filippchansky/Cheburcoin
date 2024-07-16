'use client';
import React, { useEffect, useState } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { graphData } from '../../../../../configs/graph';
import style from './style.module.scss';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts/core';
import { useDarkTheme } from '@/store/darkTheme';
import { ThemeD, ThemeL } from './theme';
import { ICoin } from '../../../../../models/coinData';

interface ChartProps {
  charts: number[][];
}

interface IDataChart {
  date: string[];
  value: number[];
}

const Chart: React.FC<ChartProps> = ({ charts }) => {
  const { darkTheme } = useDarkTheme();
  const [dataChart, setDataChart] = useState<IDataChart>({
    date: [],
    value: []
  });

  useEffect(() => {
    if (charts) {
      const newDataChart: IDataChart = {
        date: [],
        value: []
      };
      charts.forEach((item) => {
        newDataChart.date.push(new Date(item[0] * 1000).toLocaleDateString());
        newDataChart.value.push(item[1]);
      });
      setDataChart(newDataChart);
    }
  }, [charts]);

  const options = {
    tooltip: {
      trigger: 'axis',
      position: function (pt: any) {
        return [pt[0], '20%'];
      }
    },
    title: {},
    toolbox: {
      right: '150px',
      feature: {
        dataZoom: {
          yAxisIndex: 'none'
        },
        // restore: {},
        saveAsImage: {}
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dataChart.date
    },
    yAxis: {
      axisLabel: {
        overflow: 'truncate'
      },
      type: 'value',
      min: Math.min(...dataChart.value)
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 0
      }
    ],
    series: [
      {
        name: 'Price',
        type: 'line',
        sampling: 'lttb',
        itemStyle: {
          color: 'rgb(255, 70, 131)'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: 'rgb(255, 158, 68)'
            },
            {
              offset: 1,
              color: 'rgb(255, 70, 131)'
            }
          ])
        },
        data: dataChart.value
      }
    ],
    media: [
      {
        query: { maxWidth: 500 },
        option: {
          grid: {
            left: '2%',
            right: '2%'
          },
          yAxis: {
            axisLabel: {
              inside: true,
              verticalAlign: 'bottom'
            }
          },
          xAxis: {
            axisLabel: {
              alignMinLabel: 'left',
              alignMaxLabel: 'right',
              hideOverlap: true
            }
          }
        }
      }
    ]
  };

  return (
    // <LineChart
    //   xAxis={[
    //     {
    //       labelStyle: { color: "red" },
    //       data: dataChart.date,
    //       valueFormatter: (value) =>
    //         new Date(value * 1000).toLocaleDateString(),
    //     },
    //   ]}
    //   series={[
    //     {
    //       data: dataChart.value,
    //       showMark: false,
    //     },
    //   ]}
    // />
    <ReactECharts
      className={style.chart}
      lazyUpdate={true}
      theme={darkTheme ? ThemeD : ThemeL}
      option={options}
    />
  );
};
export default Chart;
