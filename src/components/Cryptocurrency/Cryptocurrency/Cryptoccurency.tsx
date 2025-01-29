'use client';
import { useFavoriteCoins } from '@/store/FavoriteCoins';
import * as motion from 'motion/react-client';
import CoinCard from '@/UI/CoinCard/CoinCard';
import { fetchCoin } from '@api/coinstats/Coins/getAllCoins';
import { useQuery } from '@tanstack/react-query';
import { Button, Card, Pagination, PaginationProps, Result, Skeleton } from 'antd';
import React, { useEffect, useState } from 'react';
import { ICoinData } from '../../../../models/coinData';
import style from './style.module.scss';

interface CryptoccurencyProps {}

const Cryptoccurency: React.FC<CryptoccurencyProps> = ({}) => {
  const { addCoins, coins } = useFavoriteCoins();
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);
  const [limit, setLimit] = useState(32);
  const { data, isError, isLoading, isFetching } = useQuery<ICoinData>({
    queryKey: ['coin', page, limit],
    queryFn: () => fetchCoin(page, limit),
    retry: 1,
    refetchInterval: 10000
  });

  useEffect(() => {
    if (data) {
      setTotalPage(data?.meta.pageCount);
    }
  }, [data]);

  // const fetchFavoriteCoins = async () => {
  //     await getDocs(collection(db, "users")).then((res) => {
  //       setFavoriteCoins(res.docs.find((item) => item.id === auth.currentUser?.uid)?.data().coinList)
  //     });
  // };

  // useEffect(() => {
  //   console.log(auth.currentUser?.uid)
  //   fetchFavoriteCoins();
  // }, []);

  const onChangePage: PaginationProps['onChange'] = (page) => {
    setPage(page);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const onShowSizeChange: PaginationProps['onShowSizeChange'] = (current, pageSize) => {
    setPage(current);
    setLimit(pageSize);
  };

  if (isError) {
    return (
      <Result
        status='error'
        title='Видимо что-то пошло не так, попробуйте позже :('
        extra={
          <Button type='primary' key='console'>
            Go Console
          </Button>
        }
      />
    );
  }

  return (
    <div className='flex flex-col-reverse gap-5'>
      <div className={style.paginationContainer}>
        {totalPage === 0 ? (
          <Skeleton.Input
            size='large'
            className={style.skeletonPagination}
            style={{ maxWidth: '400px' }}
            active
          />
        ) : (
          <Pagination
            defaultPageSize={13}
            pageSizeOptions={[13]}
            total={totalPage}
            current={page}
            onChange={onChangePage}
            onShowSizeChange={onShowSizeChange}
          />
        )}
      </div>
      <div className={style.cardContainer}>
        {isLoading
          ? Array.from({ length: 32 }).map((_, index) => (
              <Card
                key={index}
                title={
                  <div className='flex items-center gap-3'>
                    <Skeleton.Avatar active />
                    <Skeleton.Input active size='small' style={{ width: '10px' }} />
                  </div>
                }
                actions={[
                  <Skeleton.Avatar active key={'twitter'} />,
                  <Skeleton.Avatar active key={'reddit'} />
                ]}
                extra={<Skeleton.Button size='small' active style={{ width: '11px' }} />}
                style={{ width: 300, height: '182px' }}
              >
                <div className='flex h-[18px] justify-center'>
                  <Skeleton loading paragraph={{ rows: 0 }} active />
                  <Skeleton.Button size='small' active style={{ width: '10px' }} />
                </div>
              </Card>
            ))
          : data?.result.map((item) => (
              <motion.div key={item.id} initial={{ opacity: 0, scale: 0 }} whileInView={{ opacity: 1, scale: 1 }} >
                <CoinCard item={item} key={item.id} favorite={coins?.includes(item.id)} />
              </motion.div>
            ))}
      </div>
    </div>
  );
};
export default Cryptoccurency;
