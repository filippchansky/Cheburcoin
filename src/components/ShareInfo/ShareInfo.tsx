'use client';
import React, { useEffect, useState } from 'react';
import style from './style.module.scss';
import {
    Avatar,
    Box,
    Card,
    CardContent,
    CardHeader,
    Paper,
    Skeleton,
    Tab,
    Tabs,
    Typography
} from '@mui/material';
import { red } from '@mui/material/colors';
import { useQuery } from '@tanstack/react-query';
import { getShare } from '../../../apiFn/moex/shares/getShares';
import { IFilteredShares } from '@models/filteredShares';
import Image from 'next/image';
import { getShareIcon } from '../../../apiFn/moex/shares/getShareIcon';
import defIcon from '@public/Icon/russian.jpg';
import { intToRub } from '@/utils/formatCurrency';
import MainInfo from './MainInfo/MainInfo';
import { useDarkTheme } from '@/store/darkTheme';

interface ShareInfoProps {
    ticker: string;
}

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

const ShareInfo: React.FC<ShareInfoProps> = ({ ticker }) => {
    const [tabValue, setTabValue] = useState(0);
    const [shareInfo, setShareInfo] = useState<IFilteredShares>();
    const { data, isLoading, isError } = useQuery({
        queryKey: ['share', ticker],
        queryFn: () => getShare(ticker)
    });
    const { darkTheme } = useDarkTheme();

    useEffect(() => {
        if (data?.marketdata) {
            const filtered = data.marketdata.data.map<IFilteredShares>((row) => ({
                id: row[0],
                ticker: row[0],
                capitalization: row[50],
                price: row[12],
                title: data.securities.data.find((item) => item[0] === row[0])?.at(2),
                icon: data.securities.data.find((item) => item[0] === row[0])?.at(19),
                lowPrice: row[10],
                openPrice: row[9],
                highPrice: row[11]
            }));
            setShareInfo(filtered.at(0));
        }
    }, [data]);

    function CustomTabPanel(props: TabPanelProps) {
        const { children, value, index, ...other } = props;

        return (
            <div
                role='tabpanel'
                hidden={value !== index}
                id={`simple-tabpanel-${index}`}
                aria-labelledby={`simple-tab-${index}`}
                {...other}
            >
                {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
            </div>
        );
    }

    function a11yProps(index: number) {
        return {
            id: `simple-tab-${index}`,
            'aria-controls': `simple-tabpanel-${index}`
        };
    }

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

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
                    <Box sx={{ width: '100%' }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tabs
                                value={tabValue}
                                onChange={handleChange}
                                aria-label='basic tabs example'
                            >
                                <Tab label='Обзор' {...a11yProps(0)} />
                                {/* <Tab label='Дивиденды' {...a11yProps(1)} /> */}
                            </Tabs>
                        </Box>
                        <CustomTabPanel value={tabValue} index={0}>
                            <MainInfo ticker={ticker} />
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={1}></CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={2}>
                            Item Three
                        </CustomTabPanel>
                    </Box>
                </div>
            ) : (
                <Skeleton variant='rounded' width={500} height={300} />
            )}
        </>
    );
};
export default ShareInfo;
