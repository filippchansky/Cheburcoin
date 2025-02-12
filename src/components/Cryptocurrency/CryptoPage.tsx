'use client';
import React, { useEffect, useState } from 'react';
import style from './style.module.scss';
import News from './News/News';
import Cryptoccurency from './Cryptocurrency/Cryptoccurency';
import { Affix, Menu, MenuProps, Select } from 'antd';
import { DollarOutlined, ReadOutlined } from '@ant-design/icons';

interface CryptoPageProps {}

const items: MenuProps['items'] = [
    {
        label: 'News',
        key: 'news',
        icon: <ReadOutlined />
    },
    {
        label: 'Coins',
        key: 'coins',
        icon: <DollarOutlined />
    }
];
const CryptoPage: React.FC<CryptoPageProps> = ({}) => {
    const [type, setType] = useState('coins');

    const [width, setWidth] = useState(1920); // TODO window is not defined (window.innerWidth)

    useEffect(() => {
        setWidth(window.innerWidth);

        const handleResize = () => {
            setWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);

        // Clean up the event listener when the component unmounts
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);
    const onClick: MenuProps['onClick'] = (e) => {
        setType(e.key);
    };
    return (
        <>
            <div className={style.wrapper}>
                <Cryptoccurency />
            </div>
        </>
    );
};
export default CryptoPage;
