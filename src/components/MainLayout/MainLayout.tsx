'use client';
import React, { useEffect, useState } from 'react';
import { Layout, Flex } from 'antd';
import Header from '../Header/Header';
import { useDarkTheme } from '@/store/darkTheme';
import style from './style.module.scss';
import NavStepper from '../NavStepper/NavStepper';

const { Header: HeaderLayout, Footer, Sider, Content } = Layout;

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    const headerStyle: React.CSSProperties = {
        textAlign: 'center',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        justifyContent: 'space-between',
        // color: colors.text,
        height: '100px',
        paddingInline: 48,
        lineHeight: '64px',
        transition: 'background ease-out .2s, color ease-out .2s'
    };

    const contentStyle: React.CSSProperties = {
        textAlign: 'center',
        minHeight: 'calc(100vh - 100px)',
        lineHeight: '120px',
        padding: '20px'
        // color: colors.text,
        // backgroundColor: colors.bgContent,
        // transition: 'background ease-out .5s, color ease-out .5s',
    };

    const layoutStyle = {
        overflow: 'hidden',
        width: '100vw',
        maxWidth: '100vw'
    };

    return (
        <Flex gap='middle' wrap='wrap' className='dark-theme'>
            <Layout style={layoutStyle}>
                <HeaderLayout className={style.header}>
                    <Header />
                </HeaderLayout>
                <Content className={style.content}>
                    <NavStepper />
                    {children}
                </Content>
            </Layout>
        </Flex>
    );
};
export default MainLayout;
