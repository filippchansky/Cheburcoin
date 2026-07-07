import { Button, Drawer, Tree } from 'antd';
import Link from 'next/link';
import React from 'react';
import Account from './Account/Account';
import { useDarkTheme } from '@/store/darkTheme';
import { usePathname, useRouter } from 'next/navigation';
import { MenuOutlined } from '@ant-design/icons';

const Header = () => {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const { darkTheme } = useDarkTheme();
    const pathname = usePathname();
    const router = useRouter();

    const handleDrawerToggle = () => {
        setMobileOpen((prevState) => !prevState);
    };

    const handleRoute = (value: string) => {
        router.push(value);
        handleDrawerToggle();
    };

    const pathnameValue = (pathname: string) => {
        const [, firstSegment] = pathname.split('/');

        switch (firstSegment) {
            case 'moex':
                return { label: 'Portfolio', key: '/moex/portfolio' };
            case 'cryptocurrency':
                return { label: 'Favorite', key: '/favorite' };
            default:
                return { label: '', key: '' };
        }
    };

    const pages = (pathname: string) => {
        const { label, key } = pathnameValue(pathname);

        return [
            {
                id: 0,
                path: '#',
                key: 'home',
                label: 'Home',
                children: [
                    {
                        id: 3,
                        key: '/moex',
                        label: 'Moex',
                        path: '#'
                    },
                    {
                        id: 4,
                        key: '/cryptocurrency',
                        label: 'Cryptocurrency',
                        path: '#'
                    }
                ]
            },
            {
                id: 1,
                key,
                label,
                path: '#'
            },
            {
                id: 2,
                key: '/news',
                label: 'News',
                path: '#'
            }
        ];
    };

    const treeData = pages(pathname)
        .filter((item) => item.key.length > 0)
        .map((item) => ({
            key: item.key,
            title: item.label,
            selectable: !item.children,
            children: item.children?.map((child) => ({
                key: child.key,
                title: child.label,
                selectable: true
            }))
        }));

    return (
        <>
            <div
                className='fixed left-0 right-0 top-0 z-[1100] flex items-center justify-between px-6'
                style={{
                    height: 64,
                    background: darkTheme ? '#212327' : 'rgb(25, 118, 210)'
                }}
            >
                <Button
                    type='text'
                    aria-label='open drawer'
                    onClick={handleDrawerToggle}
                    icon={<MenuOutlined style={{ color: '#fff', fontSize: 20 }} />}
                />
                <Account />
            </div>
            <Drawer
                open={mobileOpen}
                onClose={handleDrawerToggle}
                placement='left'
                width={240}
                title={
                    <Link href={'/'} onClick={handleDrawerToggle}>
                        CHEBURCOIN
                    </Link>
                }
            >
                <Tree
                    treeData={treeData}
                    defaultExpandAll
                    blockNode
                    onSelect={(selectedKeys) => {
                        const key = selectedKeys[0] as string;
                        if (key && key.startsWith('/')) handleRoute(key);
                    }}
                />
            </Drawer>
        </>
    );
};
export default Header;
