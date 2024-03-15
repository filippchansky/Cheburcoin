"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useState } from "react";
import { INews } from "../../../../models/newsData";
import { Collapse } from "antd";
import NewsDescription from "./NewsDescription/NewsDescription";
import NewsTitle from "./NewsTitle/NewsTitle";

interface NewsProps {
  TOKEN: string;
}

const News: React.FC<NewsProps> = ({ TOKEN }) => {
  const fetchNews = async (type: string) => {
    const { data } = await axios.get(
      `https://openapiv1.coinstats.app/news/type/${type}`,
      {
        headers: {
          "X-API-KEY": TOKEN,
        },
      }
    );
    return data;
  };

  const [newsType, setNewsType] = useState("latest");
  const { data, isLoading, isError } = useQuery<INews>({
    queryKey: ["news", newsType],
    queryFn: () => fetchNews(newsType),
  });

  console.log(data);

  return (
    <div className="w-full text-start flex flex-col gap-5">
      {data?.map((item) => (
        <Collapse
          key={item.id}
          items={[
            {
              key: item.id,
              label: <NewsTitle item={item}/>,
              children: <NewsDescription item={item} />,
            },
          ]}
        />
      ))}
    </div>
  );
};
export default News;
