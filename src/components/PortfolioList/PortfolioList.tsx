import React from 'react';
import style from './style.module.scss';
import { useQuery } from '@tanstack/react-query';
import { getPortfolio } from '@api/tinkoff/getPortfolio/getPortfolio';
import { useTbank } from '@/hooks/useTbank';
import PortfolioItem from './PortfolioItem/PortfolioItem';
import { Collapse, CollapseProps } from 'antd';

interface PortfolioListProps {}

const PortfolioList: React.FC<PortfolioListProps> = ({}) => {
    const { data } = useTbank();

    const items: CollapseProps['items'] = (data?.accounts ?? []).map((item) => ({
        key: item.id,
        label: item.name,
        children: <PortfolioItem account={item.id} />
    }));

    const onChange = (key: string | string[]) => {
        console.log(key);
    };

    return (
        <>
            <Collapse items={items} onChange={onChange} />
        </>
    );
};
export default PortfolioList;
