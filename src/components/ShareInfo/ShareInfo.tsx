'use client';
import React, { useEffect, useState } from 'react';
import style from './style.module.scss';
import { Avatar, Card, CardContent, CardHeader, Paper, Skeleton, Typography } from '@mui/material';
import { red } from '@mui/material/colors';
import { useQuery } from '@tanstack/react-query';
import { getShare } from '@api/moex/shares/getShares';
import { IFilteredShares } from '@models/filteredShares';
import Image from 'next/image';
import { getShareIcon } from '@api/moex/shares/getShareIcon';
import defIcon from '@public/Icon/russian.jpg';
import { intToRub } from '@/utils/formatCurrency';

interface ShareInfoProps {
    ticker: string;
}

const ShareInfo: React.FC<ShareInfoProps> = ({ ticker }) => {
    const [shareInfo, setShareInfo] = useState<IFilteredShares>();
    const { data, isLoading, isError } = useQuery({
        queryKey: ['share', ticker],
        queryFn: () => getShare(ticker)
    });

    useEffect(() => {
        if (data?.marketdata) {
            const filtered = data.marketdata.data.map<IFilteredShares>((row) => ({
                id: row[0],
                ticker: row[0],
                capitalization: row[50],
                price: row[2],
                title: data.securities.data.find((item) => item[0] === row[0])?.at(2),
                icon: data.securities.data.find((item) => item[0] === row[0])?.at(19),
                lowPrice: row[10],
                openPrice: row[9],
                highPrice: row[11]
            }));
            setShareInfo(filtered.at(0));
        }
    }, [data]);

    return (
        <>
            {shareInfo ? (
                <div className={style.wrapper}>
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
                </div>
            ) : (
                <Skeleton width={500} height={260} />
            )}
        </>
    );
};
export default ShareInfo;
