import React from 'react';
import style from '../style.module.scss';
import { Skeleton } from 'antd';

interface PrecentValueProps {
    title: string;
    average: number | null;
}

const PrecentValue: React.FC<PrecentValueProps> = ({ average, title }) => {
    return (
        <div>
            <h2 className={style.title}>{title}</h2>
            {average !== null ? (
                <p
                    className={
                        average !== null && average > 0
                            ? style.price
                            : [style.price, style.red].join(' ')
                    }
                >
                    {average > 0 && '+'}
                    {average?.toFixed(2)}%
                </p>
            ) : (
                <Skeleton.Button active size='small' />
            )}
        </div>
    );
};
export default PrecentValue;
