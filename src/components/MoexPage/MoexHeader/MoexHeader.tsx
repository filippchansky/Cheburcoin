'use client';
import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import React from 'react';
import style from './style.module.scss';

interface MoexHeaderProps {
    count: number;
    search: string;
    onSearch: (value: string) => void;
}

const MoexHeader: React.FC<MoexHeaderProps> = ({ count, search, onSearch }) => {
    return (
        <div className={style.header}>
            <div className={style.titleBlock}>
                <h1 className={style.title}>Акции MOEX</h1>
                <p className={style.subtitle}>
                    {count > 0 ? `${count} бумаг Московской биржи` : 'Московская биржа'}
                </p>
            </div>
            <Input
                className={style.search}
                allowClear
                size='large'
                prefix={<SearchOutlined />}
                placeholder='Поиск по тикеру или названию'
                value={search}
                onChange={(e) => onSearch(e.target.value)}
            />
        </div>
    );
};
export default MoexHeader;
