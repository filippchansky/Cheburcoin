'use client';
import { getAllShares } from '../../../apiFn/moex/shares/getAllShares';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { IShares } from '@models/allSharesData';
import SharesTable from '../SharesTable/SharesTable';
import { IFilteredShares } from '@models/filteredShares';
import Item from 'antd/es/list/Item';

interface MoexPageProps {}

const MoexPage: React.FC<MoexPageProps> = ({}) => {
    const [shares, setShares] = useState<IFilteredShares[]>();
    const { data } = useQuery<IShares>({
        queryKey: ['shares'],
        queryFn: () => getAllShares()
    });

    useEffect(() => {
        if (data) {
            const filter = data.marketdata.data
                .map((row) => ({
                    id: row[0],
                    ticker: row[0],
                    capitalization: row[50],
                    price: row[12],
                    title: data.securities.data.find((item) => item[0] === row[0])?.at(2),
                    icon: data.securities.data.find((item) => item[0] === row[0])?.at(19),
                    lowPrice: row[10],
                    openPrice: row[9],
                    highPrice: row[11]
                }))
                .filter((stock) => stock.capitalization > 0)
                .sort((a, b) => b.capitalization - a.capitalization);
            setShares(filter as IFilteredShares[]);
        }
    }, [data]);

    return (
        <>
            <div>
                <SharesTable data={shares ?? []} />
            </div>
        </>
    );
};
export default MoexPage;
