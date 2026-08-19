'use client';
import { Menu } from 'antd';
import Link from 'next/link';
import React from 'react';
import Account from './Account/Account';
import { useDarkTheme } from '@/store/darkTheme';
import { usePathname } from 'next/navigation';
import { getPalette } from '@/theme/palette';
import { getActiveKey, navItems } from '@/lib/nav';
import style from './style.module.scss';

const Header = () => {
    const { darkTheme } = useDarkTheme();
    const pathname = usePathname();
    const palette = getPalette(darkTheme);

    const selectedKey = getActiveKey(pathname, navItems);

    const brand = (
        <Link href='/' className='flex items-center font-bold'>
            <span style={{ fontSize: 20, letterSpacing: '-0.02em' }}>
                CHEBUR<span style={{ color: palette.primary }}>COIN</span>
            </span>
        </Link>
    );

    return (
        <div className='flex h-full w-full items-center justify-between gap-6'>
            <div className='flex items-center gap-6'>
                {brand}
                <nav className={style.desktopNav}>
                    <Menu
                        mode='horizontal'
                        selectedKeys={selectedKey ? [selectedKey] : []}
                        style={{ background: 'transparent', borderBottom: 'none', minWidth: 320 }}
                        items={navItems.map((item) => ({
                            key: item.key,
                            label: <Link href={item.key}>{item.label}</Link>
                        }))}
                    />
                </nav>
            </div>
            <div className='flex items-center gap-3'>
                <Account />
            </div>
        </div>
    );
};
export default Header;
