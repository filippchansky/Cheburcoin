import { Avatar, Popover, Skeleton, Switch } from 'antd';
import SkeletonAvatar from 'antd/es/skeleton/Avatar';
import Image from 'next/image';
import React, { Suspense } from 'react';
import style from './style.module.scss';
import Account from './Account/Account';
import {
    AppBar,
    Box,
    Button,
    Divider,
    Drawer,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Toolbar,
    Typography
} from '@mui/material';
import Link from 'next/link';
import { useDarkTheme } from '@/store/darkTheme';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { BarsOutlined, MenuOutlined } from '@ant-design/icons';

interface HeaderProps {}

const Header = ({}) => {
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

    const drawer = (
        <Box onClick={() => console.log('click')} sx={{ textAlign: 'center' }}>
            <Link href={'/'} onClick={handleDrawerToggle}>
                <Typography variant='h6' sx={{ my: 2 }}>
                    CHEBURCOIN
                </Typography>
            </Link>
            <Divider />
            <Box sx={{ minHeight: 352, minWidth: 230 }}>
                <SimpleTreeView>
                    {pages(pathname)
                        .filter((item) => item.key.length > 0)
                        .map((item) => (
                            <TreeItem
                                key={item.id}
                                itemId={item.id.toString()}
                                label={item.label}
                                onClick={!item.children ? () => handleRoute(item.key) : undefined}
                            >
                                {item.children && (
                                    <div className={style.childrenWrapper}>
                                        {item.children?.map((child) => (
                                            <div key={`${item.id}-${child.id}`}>
                                                <TreeItem
                                                    itemId={child.id.toString()}
                                                    label={child.label}
                                                    onClick={() => handleRoute(child.key)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </TreeItem>
                        ))}
                </SimpleTreeView>
            </Box>
        </Box>
    );

    return (
        <>
            {/* <Navigation />
      <Account /> */}
            <AppBar
                component='nav'
                style={{ background: darkTheme ? '#212327' : 'rgb(25, 118, 210)' }}
            >
                <Toolbar className='justify-between'>
                    <IconButton
                        color='inherit'
                        aria-label='open drawer'
                        edge='start'
                        onClick={handleDrawerToggle}
                        sx={{ ml: 2, display: { sm: 'flex' } }}
                    >
                        <MenuOutlined width={40} height={40} />
                    </IconButton>
                    <Account />
                </Toolbar>
            </AppBar>
            <Drawer
                //   container={container}
                variant='temporary'
                open={mobileOpen}
                onClose={handleDrawerToggle}
                ModalProps={{
                    keepMounted: true // Better open performance on mobile.
                }}
                sx={{
                    display: { xs: 'block', sm: 'block' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 }
                }}
            >
                {drawer}
            </Drawer>
        </>
    );
};
export default Header;
