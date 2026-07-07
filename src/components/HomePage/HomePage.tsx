'use client';
import { Card } from 'antd';
import * as motion from 'motion/react-client';
import React from 'react';
import style from './style.module.scss';
import Link from 'next/link';
import Image from 'next/image';

interface HomePageProps {}

const ball = {
    width: 293,
    height: 214,
    borderRadius: '50%'
};

const HomePage: React.FC<HomePageProps> = ({}) => {
    return (
        <section className={style.wrapper}>
            <div>
                <p className='text-[22px] font-bold'>Выберите вариант</p>
            </div>
            <div className={style.container}>
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.4,
                        scale: { type: 'spring', visualDuration: 0.4, bounce: 0.5 }
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    style={ball}
                >
                    <Link href='/moex'>
                        <Card
                            hoverable
                            style={{ maxWidth: 345, borderRadius: 20 }}
                            cover={
                                <Image
                                    src='/Icon/moex.gif'
                                    alt='moex'
                                    width={345}
                                    height={140}
                                    unoptimized
                                    style={{ width: '100%', height: 140, objectFit: 'cover' }}
                                />
                            }
                        >
                            <div className='text-xl font-semibold'>MOEX</div>
                        </Card>
                    </Link>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.4,
                        scale: { type: 'spring', visualDuration: 0.4, bounce: 0.5 }
                    }}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.8 }}
                    style={ball}
                >
                    <Link href='/cryptocurrency'>
                        <Card
                            hoverable
                            style={{ maxWidth: 345, borderRadius: 20 }}
                            cover={
                                <Image
                                    src='/Icon/crypto_icon.png'
                                    alt='crypto_icon'
                                    width={345}
                                    height={140}
                                    style={{ width: '100%', height: 140, objectFit: 'cover' }}
                                />
                            }
                        >
                            <div className='text-xl font-semibold'>Crypto</div>
                        </Card>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};
export default HomePage;
