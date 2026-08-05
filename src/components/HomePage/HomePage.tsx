'use client';
import { Card } from 'antd';
import * as motion from 'motion/react-client';
import React from 'react';
import style from './style.module.scss';
import Link from 'next/link';
import Image from 'next/image';

const options = [
    {
        href: '/moex',
        title: 'MOEX',
        desc: 'Акции Московской биржи: котировки, графики и дивиденды',
        img: '/Icon/moex.png',
        unoptimized: false
    },
    {
        href: '/cryptocurrency',
        title: 'Криптовалюты',
        desc: 'Курсы монет, интерактивные графики и лента новостей',
        img: '/Icon/crypto_icon.png',
        unoptimized: false
    }
];

const HomePage: React.FC = () => {
    return (
        <section className={style.wrapper}>
            <motion.div
                className={style.hero}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <h1 className={style.title}>
                    Крипта и акции МосБиржи
                    <br />в одном месте
                </h1>
                <p className={style.subtitle}>
                    Отслеживайте курсы, стройте графики, собирайте избранное и следите за
                    портфелем Т-Банка.
                </p>
            </motion.div>

            <div className={style.container}>
                {options.map((opt, index) => (
                    <motion.div
                        key={opt.href}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
                        whileHover={{ y: -6 }}
                    >
                        <Link href={opt.href}>
                            <Card hoverable className={style.card}>
                                <div className={style.cardImage}>
                                    <Image
                                        src={opt.img}
                                        alt={opt.title}
                                        width={120}
                                        height={120}
                                        unoptimized={opt.unoptimized}
                                        style={{ objectFit: 'contain' }}
                                    />
                                </div>
                                <h3 className={style.cardTitle}>{opt.title}</h3>
                                <p className={style.cardDesc}>{opt.desc}</p>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};
export default HomePage;
