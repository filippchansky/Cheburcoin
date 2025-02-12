'use client';
import { Card, CardActionArea, CardContent, CardMedia, Typography } from '@mui/material';
import * as motion from 'motion/react-client';
import React, { useEffect, useState } from 'react';
import style from './style.module.scss';
import Link from 'next/link';

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
                <p className='font-bold text-[22px]'>Выберите вариант</p>
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
                        <Card sx={{ maxWidth: 345 }} style={{ borderRadius: 20 }}>
                            <CardActionArea>
                                <CardMedia
                                    component='img'
                                    height='100'
                                    image='Icon/moex.gif'
                                    alt='green iguana'
                                    style={{ height: 140 }}
                                />
                                <CardContent>
                                    <Typography gutterBottom variant='h5' component='div'>
                                        MOEX
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
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
                        <Card sx={{ maxWidth: 345 }} style={{ borderRadius: 20 }}>
                            <CardActionArea>
                                <CardMedia
                                    component='img'
                                    height='140'
                                    image='Icon/crypto_icon.png'
                                    alt='crypto_icon'
                                    style={{ height: 140 }}
                                />
                                <CardContent>
                                    <Typography gutterBottom variant='h5' component='div'>
                                        Crypto
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                        </Card>
                    </Link>
                </motion.div>
            </div>
        </section>
    );
};
export default HomePage;
