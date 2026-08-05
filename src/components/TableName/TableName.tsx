import React from 'react';
import style from './style.module.scss';
import ShareLogo from '../ShareLogo/ShareLogo';

interface TableNameProps {
    title: string;
    ticker: string;
    icon: string;
}

const TableName: React.FC<TableNameProps> = ({ title, ticker, icon }) => {
    return (
        <div className='flex items-center gap-4'>
            <ShareLogo icon={icon} ticker={ticker} size={40} />
            <div className='flex flex-col gap-1'>
                <h3 className={style.title}>{title}</h3>
                <p className={style.ticker}>{ticker}</p>
            </div>
        </div>
    );
};
export default TableName;
