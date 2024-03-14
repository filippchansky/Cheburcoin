"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ICoinData } from "../../../models";
import {
  Avatar,
  Card,
  Pagination,
  PaginationProps,
  Select,
  Skeleton,
} from "antd";
import style from "./style.module.scss";
import CardContent from "./CardContent/CardContent";

interface CryptoccurencyProps {}

const Cryptoccurency: React.FC<CryptoccurencyProps> = ({}) => {
  const fetchCoin = async (page: number, limit: number) => {
    const { data } = await axios.get(
      `https://openapiv1.coinstats.app/coins?page=${page}&limit=${limit}`,
      {
        headers: {
          "X-API-KEY": process.env.NEXT_PUBLIC_AUTH_COIN,
        },
      }
    );
    setTotalPage(data?.meta.pageCount);
    return data;
  };
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const { data, isError, isLoading } = useQuery<ICoinData>({
    queryKey: ["coin", page, limit],
    queryFn: () => fetchCoin(page, limit),
  });
  console.log(isLoading);
  const onChangePage: PaginationProps["onChange"] = (page) => {
    setPage(page);
  };
  const onShowSizeChange: PaginationProps["onShowSizeChange"] = (
    current,
    pageSize
  ) => {
    setPage(current);
    setLimit(pageSize);
  };

  return (
    <div className="flex justify-center gap-10">
      <div className="w-[400px]"></div>
      <div className="text-start flex flex-col items-center gap-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, index) => (
              <Card
                key={index}
                loading={isLoading}
                title={
                  <div className="flex items-center gap-3">
                    <Avatar />
                    <p></p>
                  </div>
                }
                style={{ width: 300 }}
              >
                <p>qwe</p>
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
                extra={<a href="#">More</a>}
                style={{ width: 300 }}
              >
                <CardContent item={item} />
              </Card>
            ))}
        {}
      </div>
      <div className="w-[400px]">
        {totalPage === 0 ? (
          <Skeleton.Input size="large" style={{ width: "300px" }} active />
        ) : (
          <Pagination
            total={totalPage}
            current={page}
            onChange={onChangePage}
            onShowSizeChange={onShowSizeChange}
          />
        )}
      </div>
    </div>
  );
};
export default Cryptoccurency;
