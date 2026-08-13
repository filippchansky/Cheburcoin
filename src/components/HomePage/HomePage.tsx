'use client';
import React from 'react';
import * as motion from 'motion/react-client';
import style from './style.module.scss';
import IndicatorRibbon from './IndicatorRibbon';
import LiveBadge from './LiveBadge';
import MarketMap from './MarketMap';
import HomeMovers from './HomeMovers';
import HomeCalendar from './HomeCalendar';
import SectionNav from './SectionNav';

const HomePage: React.FC = () => {
    return (
        <motion.section
            className={style.wrapper}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            <div className={style.pageHead}>
                <div>
                    <h1 className={style.pageTitle}>Рынок сегодня</h1>
                    <p className={style.pageMeta}>Московская биржа</p>
                </div>
                <LiveBadge />
            </div>

            <IndicatorRibbon />

            <section className={style.section}>
                <div className={style.sectionHead}>
                    <h2 className={style.sectionTitle}>Карта рынка</h2>
                    <span className={style.sectionHint}>
                        состав IMOEX · размер = вес · цвет = % за день
                    </span>
                </div>
                <MarketMap />
            </section>

            <div className={style.widgets}>
                <HomeMovers />
                <HomeCalendar />
            </div>

            <section className={style.section}>
                <div className={style.sectionHead}>
                    <h2 className={style.sectionTitle}>Разделы</h2>
                </div>
                <SectionNav />
            </section>
        </motion.section>
    );
};

export default HomePage;
