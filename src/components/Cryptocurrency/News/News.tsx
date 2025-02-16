'use client';
import { fetchNews } from '../../../../apiFn/coinstats/News/getAllNews';
import { useQuery } from '@tanstack/react-query';
import { Collapse, Skeleton, Spin } from 'antd';
import React, { useEffect, useState } from 'react';
import { INews } from '../../../../models/newsData';
import NewsDescription from './NewsDescription/NewsDescription';
import NewsTitle from './NewsTitle/NewsTitle';
import style from './style.module.scss';

interface NewsProps {}

const News: React.FC<NewsProps> = ({}) => {
    const [news, setNews] = useState<INews | undefined>();
    const [totalPage, setTotalPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [newsType, setNewsType] = useState('latest');
    const [fetching, setFetching] = useState(false);
    const { data, isLoading, isError, isSuccess } = useQuery<INews>({
        queryKey: ['news', newsType, currentPage, limit],
        queryFn: () => fetchNews(newsType, currentPage, limit)
    });
    useEffect(() => {
        if (fetching) {
            setLimit(limit + 20);
        }
    }, [fetching]);

    useEffect(() => {
        if (isSuccess) {
            setFetching(false);
            setNews(data);
        }
    }, [isSuccess]);

    useEffect(() => {
        document.addEventListener('scroll', scrollHandler);

        return () => {
            document.removeEventListener('scroll', scrollHandler);
        };
    }, []);

    const scrollHandler = (e: any) => {
        if (
            e.target.documentElement.scrollHeight -
                (e.target.documentElement.scrollTop + window.innerHeight) <
            100
        ) {
            setFetching(true);
        }
    };

    return (
        <div className={style.wrapper}>
            <div className={style.container}>
                {news
                    ? news?.map((item) => (
                          <Collapse
                              className={style.collapse}
                              key={item.id}
                              items={[
                                  {
                                      key: item.id,
                                      label: <NewsTitle item={item} />,
                                      children: <NewsDescription item={item} />
                                  }
                              ]}
                          />
                      ))
                    : Array.from({ length: 12 }).map((item, index) => (
                          <div key={index} className='flex max-h-[100px] w-full items-center'>
                              <Skeleton.Input
                                  active
                                  size='large'
                                  className={style.skeleton}
                                  style={{ height: '70px' }}
                              />
                          </div>
                      ))}
                {fetching && <Spin />}
            </div>
        </div>
    );
};
export default News;
