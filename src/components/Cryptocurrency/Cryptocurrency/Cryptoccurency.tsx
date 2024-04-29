"use client";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { ICoinData } from "../../../../models/coinData";
import {
  Affix,
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
import {fetchCoin} from "@api/coinstats/getAllCoins"
import CoinCard from "@/UI/CoinCard/CoinCard";

interface CryptoccurencyProps {
}

const Cryptoccurency: React.FC<CryptoccurencyProps> = ({}) => {
  
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);
  const [limit, setLimit] = useState(12);
  const { data, isError, isLoading, isFetching } = useQuery<ICoinData>({
    queryKey: ["coin", page, limit],
    queryFn: () => fetchCoin(page, limit, setTotalPage),
    refetchInterval: 300000,
  });
  
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
    <Affix offsetTop={60}>
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
              <CoinCard item={item} key={item.id}/>
            ))}
      </div>
    </div>
    </Affix>
  );
};
export default Cryptoccurency;
