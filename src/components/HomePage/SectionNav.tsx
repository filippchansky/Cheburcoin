'use client';
import React from 'react';
import Link from 'next/link';
import * as motion from 'motion/react-client';
import {
    LineChartOutlined,
    SafetyCertificateOutlined,
    PieChartOutlined,
    WalletOutlined,
    GoldOutlined
} from '@ant-design/icons';
import style from './style.module.scss';

const SECTIONS: Array<{
    href: string;
    title: string;
    desc: string;
    icon: React.ReactNode;
}> = [
    { href: '/moex', title: 'Акции', desc: 'Котировки MOEX', icon: <LineChartOutlined /> },
    {
        href: '/bonds',
        title: 'Облигации',
        desc: 'Купоны и рейтинги',
        icon: <SafetyCertificateOutlined />
    },
    { href: '/funds', title: 'Фонды', desc: 'БПИФ и ETF', icon: <PieChartOutlined /> },
    { href: '/moex/portfolio', title: 'Портфель', desc: 'Т-Банк', icon: <WalletOutlined /> },
    { href: '/cryptocurrency', title: 'Крипта', desc: 'Курсы монет', icon: <GoldOutlined /> }
];

const SectionNav: React.FC = () => (
    <div className={style.nav}>
        {SECTIONS.map((section, index) => (
            <motion.div
                key={section.href}
                className={style.navCell}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
            >
                <Link href={section.href} className={style.navCard}>
                    <span className={style.navIcon}>{section.icon}</span>
                    <span className={style.navText}>
                        <span className={style.navTitle}>{section.title}</span>
                        <span className={style.navDesc}>{section.desc}</span>
                    </span>
                </Link>
            </motion.div>
        ))}
    </div>
);

export default SectionNav;
