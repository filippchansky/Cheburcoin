'use client';
import { Button, Drawer, Menu } from 'antd';
import Link from 'next/link';
import React from 'react';
import Account from './Account/Account';
import { useDarkTheme } from '@/store/darkTheme';
import { usePathname } from 'next/navigation';
import { MenuOutlined } from '@ant-design/icons';
import { getPalette } from '@/theme/palette';
import style from './style.module.scss';

const navItems = [
    { key: '/moex', label: 'MOEX' },
    { key: '/cryptocurrency', label: 'Крипта' },
    { key: '/news', label: 'Новости' }
];

const Header = () => {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const { darkTheme } = useDarkTheme();
    const pathname = usePathname();
    const palette = getPalette(darkTheme);

    const selectedKey = navItems.find((item) => pathname?.startsWith(item.key))?.key;

    const brand = (
        <Link href='/' className='flex items-center font-bold' onClick={() => setMobileOpen(false)}>
            <span style={{ fontSize: 20, letterSpacing: '-0.02em' }}>
                CHEBUR<span style={{ color: palette.primary }}>COIN</span>
            </span>
        </Link>
    );

    const menu = (mode: 'horizontal' | 'inline') => (
        <Menu
            mode={mode}
            selectedKeys={selectedKey ? [selectedKey] : []}
            style={{ background: 'transparent', borderBottom: 'none', minWidth: 320 }}
            items={navItems.map((item) => ({
                key: item.key,
                label: (
                    <Link href={item.key} onClick={() => setMobileOpen(false)}>
                        {item.label}
                    </Link>
                )
            }))}
        />
    );

    return (
        <div className='flex h-full w-full items-center justify-between gap-6'>
            <div className='flex items-center gap-6'>
                {brand}
                <nav className={style.desktopNav}>{menu('horizontal')}</nav>
            </div>
            <div className='flex items-center gap-3'>
                <Account />
                <span className={style.mobileBtn}>
                    <Button
                        type='text'
                        aria-label='open menu'
                        onClick={() => setMobileOpen(true)}
                        icon={<MenuOutlined style={{ fontSize: 18 }} />}
                    />
                </span>
            </div>
            <Drawer
                open={mobileOpen}
                onClose={() => setMobileOpen(false)}
                placement='right'
                width={260}
                title={brand}
            >
                {menu('inline')}
            </Drawer>
        </div>
    );
};
export default Header;
