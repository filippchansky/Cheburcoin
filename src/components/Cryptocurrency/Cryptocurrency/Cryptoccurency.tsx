"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ICoinData } from "../../../../models/coinData";
import {
  Avatar,
  Card,
  Pagination,
  PaginationProps,
  Select,
  Skeleton,
} from "antd";
import style from "./style.module.scss";
import CardContent from "../CardContent/CardContent";
import Meta from "antd/es/card/Meta";
import { RedditOutlined, TwitterOutlined } from "@ant-design/icons";
import Link from "next/link";

interface CryptoccurencyProps {
  TOKEN: string;
}

const Cryptoccurency: React.FC<CryptoccurencyProps> = ({ TOKEN }) => {
  const fetchCoin = async (page: number, limit: number) => {
    const { data } = await axios.get(
      `https://openapiv1.coinstats.app/coins?page=${page}&limit=${limit}`,
      {
        headers: {
          "X-API-KEY": TOKEN,
        },
      }
    );
    setTotalPage(data?.meta.pageCount);
    return data;
  };
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);
  const [limit, setLimit] = useState(12);
  const { data, isError, isLoading } = useQuery<ICoinData>({
    queryKey: ["coin", page, limit],
    queryFn: () => fetchCoin(page, limit),
    refetchInterval: 300000,
  });
  console.log(isLoading);
  const onChangePage: PaginationProps["onChange"] = (page) => {
    setPage(page);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const onShowSizeChange: PaginationProps["onShowSizeChange"] = (
    current,
    pageSize
  ) => {
    setPage(current);
    setLimit(pageSize);
  };

  return (
    <div className="flex flex-col gap-5 max-[650px]:flex-col-reverse">
      <div className={style.paginationContainer}>
        {totalPage === 0 ? (
          <Skeleton.Input
            size="large"
            className={style.skeletonPagination}
            style={{ maxWidth: "400px" }}
            active
          />
        ) : (
          <Pagination
            total={totalPage}
            current={page}
            onChange={onChangePage}
            onShowSizeChange={onShowSizeChange}
          />
        )}
      </div>
      <div className={style.cardContainer}>
        {isLoading
          ? Array.from({ length: 12 }).map((_, index) => (
              <Card
                key={index}
                title={
                  <div className="flex items-center gap-3">
                    <Skeleton.Avatar active />
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: "10px" }}
                    />
                  </div>
                }
                actions={[
                  <Skeleton.Avatar active key={"twitter"} />,
                  <Skeleton.Avatar active key={"reddit"} />,
                ]}
                extra={
                  <Skeleton.Button
                    size="small"
                    active
                    style={{ width: "10px" }}
                  />
                }
                style={{ width: 300, height: "182px" }}
              >
                <div className="flex justify-center h-[18px]">
                  <Skeleton loading paragraph={{ rows: 0 }} active />
                  <Skeleton.Button
                    size="small"
                    active
                    style={{ width: "10px" }}
                  />
                </div>
              </Card>
            ))
          : data?.result.map((item) => (
              <Card
                loading={isLoading}
                key={item.id}
                title={
                  <div className="flex items-center gap-3">
                    <Avatar src={item.icon} />
                    <p>{item.name}</p>
                  </div>
                }
                extra={<Link href={`cryptocurrency/${item.id}`}>More</Link>}
                actions={[
                  <a target="_blank" href={item.twitterUrl} key="twitter">
                    <TwitterOutlined style={{ fontSize: "25px" }} />
                  </a>,
                  <a target="_blank" href={item.redditUrl} key="reddit">
                    <RedditOutlined style={{ fontSize: "25px" }} />
                  </a>,
                ]}
                style={{ width: 300 }}
              >
                <CardContent item={item} />
              </Card>
            ))}
      </div>
    </div>
  );
};
export default Cryptoccurency;
