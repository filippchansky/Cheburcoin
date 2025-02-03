import React from 'react';
import MoexChart from '../MoexChart/MoexChart';
import ShareInfo from '../ShareInfo/ShareInfo';
import style from './style.module.scss';

interface AboutSharesProps {
    ticker: string;
}

const AboutShares: React.FC<AboutSharesProps> = ({ ticker }) => {
    return (
        <section className={style.wrapper}>
            <MoexChart ticker={ticker} />
            <ShareInfo ticker={ticker} />
        </section>
    );
};
export default AboutShares;
