'use client';
import React from 'react';
import { Layout } from 'antd';
import Header from '../Header/Header';
import style from './style.module.scss';
import NavStepper from '../NavStepper/NavStepper';

const { Header: HeaderLayout, Content } = Layout;

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <Layout className='min-h-screen'>
            <HeaderLayout className={style.header}>
                <Header />
            </HeaderLayout>
            <Content className={style.content}>
                <div className='mx-auto w-full max-w-[1280px] px-4'>
                    <NavStepper />
                    {children}
                </div>
            </Content>
        </Layout>
    );
};
export default MainLayout;
