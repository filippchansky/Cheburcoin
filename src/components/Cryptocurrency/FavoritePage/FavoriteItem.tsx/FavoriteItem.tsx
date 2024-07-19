'use client';
import CoinCard from '@/UI/CoinCard/CoinCard';
import { CardSkeleton } from '@/UI/Skeletons/CardSkeleton';
import { useFavoriteCoins } from '@/store/FavoriteCoins';
import { getCoinById } from '@api/coinstats/Coins/getCoinById';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import style from './style.module.scss';

interface FavoriteItemProps {
  item: string;
}

const FavoriteItem: React.FC<FavoriteItemProps> = ({ item }) => {
  const { coins } = useFavoriteCoins();
  const { data, isLoading } = useQuery({
    queryKey: [item],
    queryFn: () => getCoinById(item)
  });

  return (
    <div className={style.wrapper}>
      {data ? <CoinCard favorite={coins?.includes(item)} item={data} /> : <CardSkeleton />}
    </div>
  );
};
export default FavoriteItem;
