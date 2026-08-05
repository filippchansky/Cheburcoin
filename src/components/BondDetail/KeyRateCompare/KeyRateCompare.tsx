'use client';
import React from 'react';
import { Skeleton, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { useKeyRate } from '@/hooks/useBonds';
import { formatDate } from '@/utils/dateUtils';
import style from './style.module.scss';

interface KeyRateCompareProps {
    bondYield: number | null;
}

const KeyRateCompare: React.FC<KeyRateCompareProps> = ({ bondYield }) => {
    const { data: keyRate, isLoading, isError } = useKeyRate();

    if (bondYield === null || isError) return null;
    if (isLoading || !keyRate) {
        return <Skeleton.Button active block style={{ height: 72 }} />;
    }

    const spread = bondYield - keyRate.rate;
    const spreadClass = spread > 0 ? style.up : spread < 0 ? style.down : style.flat;

    return (
        <section className={style.bar}>
            <div className={style.item}>
                <span className={style.label}>Доходность облигации</span>
                <span className={style.value}>{bondYield.toFixed(2)}%</span>
            </div>
            <div className={style.item}>
                <span className={style.label}>
                    Ключевая ставка ЦБ{' '}
                    <Tooltip title={`на ${formatDate(keyRate.date)}`}>
                        <InfoCircleOutlined className={style.info} />
                    </Tooltip>
                </span>
                <span className={style.value}>{keyRate.rate.toFixed(2)}%</span>
            </div>
            <div className={style.item}>
                <span className={style.label}>Спред к ставке</span>
                <span className={`${style.value} ${spreadClass}`}>
                    {spread > 0 ? '+' : ''}
                    {spread.toFixed(2)} п.п.
                </span>
            </div>
        </section>
    );
};
export default KeyRateCompare;
