'use client';
import React, { useEffect, useState } from 'react';
import style from './style.module.scss';
import { Skeleton, Tabs } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getShare } from '../../../apiFn/moex/shares/getShares';
import { mapShares } from '@api/moex/shares/mapShares';
import { IFilteredShares } from '@models/filteredShares';
import Image from 'next/image';
import { getShareIcon } from '../../../apiFn/moex/shares/getShareIcon';
import { intToRub } from '@/utils/formatCurrency';
import MainInfo from './MainInfo/MainInfo';
import { useDarkTheme } from '@/store/darkTheme';

interface ShareInfoProps {
    ticker: string;
}

const ShareInfo: React.FC<ShareInfoProps> = ({ ticker }) => {
    const [shareInfo, setShareInfo] = useState<IFilteredShares>();
    const { data } = useQuery({
        queryKey: ['share', ticker],
        queryFn: () => getShare(ticker)
    });
    const { darkTheme } = useDarkTheme();

    useEffect(() => {
        if (data?.marketdata) {
            setShareInfo(mapShares(data).at(0));
        }
    }, [data]);

    return (
        <>
            {shareInfo ? (
                <div className={darkTheme ? style.wrapper : [style.wrapper, style.white].join(' ')}>
                    <div className={style.header}>
                        <div className={style.shareInfo}>
                            <div className='relative flex gap-3'>
                                <h1 className='text-[40px] font-bold'>{shareInfo?.title}</h1>
                                <span className='absolute right-[-50px] top-[0px] text-[20px] opacity-40'>
                                    {shareInfo?.ticker}
                                </span>
                            </div>
                            <div>
                                <h2 className='text-[30px]'>{intToRub(shareInfo?.price)}</h2>
                            </div>
                        </div>
                        <div className={style.shareIcon}>
                            <Image
                                src={getShareIcon(shareInfo?.icon!)}
                                width={100}
                                height={100}
                                alt=''
                            />
                        </div>
                    </div>
                    <div className='w-full'>
                        <Tabs
                            defaultActiveKey='0'
                            items={[
                                {
                                    key: '0',
                                    label: 'Обзор',
                                    children: <MainInfo ticker={ticker} />
                                }
                            ]}
                        />
                    </div>
                </div>
            ) : (
                <Skeleton active paragraph={{ rows: 6 }} />
            )}
        </>
    );
};
export default ShareInfo;
