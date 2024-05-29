"use client";
import { useFavoriteCoins } from "@/store/FavoriteCoins";
import React from "react";
import FavoriteItem from "./FavoriteItem.tsx/FavoriteItem";
import style from "./style.module.scss"

interface FavoritePageProps {}

const FavoritePage: React.FC<FavoritePageProps> = ({}) => {
  const { coins } = useFavoriteCoins();

  return (
    <div className={style.wrapper}>
      {coins?.map((item) => (
        <FavoriteItem key={item} item={item}/>
      ))}
    </div>
  );
};
export default FavoritePage;
