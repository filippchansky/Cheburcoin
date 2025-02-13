import { Avatar, Popover, Skeleton, Switch } from 'antd';
import SkeletonAvatar from 'antd/es/skeleton/Avatar';
import Image from 'next/image';
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BarsOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import SwitchTeme from './SwitchTeme/SwitchTeme';
import Account from './Account/Account';
import Navigation from './Navigation/Navigation';
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
import cheburIcon from '@public/Icon/defaultAvatar.jpg';
import { useDarkTheme } from '@/store/darkTheme';

interface HeaderProps {}

const Header = ({}) => {
    const [mobileOpen, setMobileOpen] = React.useState(false);
    const { darkTheme } = useDarkTheme();

    const handleDrawerToggle = () => {
        setMobileOpen((prevState) => !prevState);
    };

    const pages = [
        {
            id: 0,
            key: '/',
            label: 'Home',
            path: '#'
        },
        {
            id: 1,
            key: '/favorite',
            label: 'Favorite',
            path: '#'
        },
        {
            id: 2,
            key: '/news',
            label: 'News',
            path: '#'
        }
    ];

    const drawer = (
        <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
            <Typography variant='h6' sx={{ my: 2 }}>
                CHEBURCOIN
            </Typography>
            <Divider />
            <List>
                {pages.map((item) => (
                    <Link href={item.key} key={item.label}>
                        <ListItem key={item.label} disablePadding>
                            <ListItemButton sx={{ textAlign: 'center' }}>
                                <ListItemText primary={item.label} />
                            </ListItemButton>
                        </ListItem>
                    </Link>
                ))}
            </List>
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
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <BarsOutlined />
                    </IconButton>
                    <Typography
                        className='max-w-28'
                        variant='h6'
                        component='div'
                        sx={{ flexGrow: 1, display: { xs: 'none', sm: 'block' } }}
                    >
                        CHEBURCOIN
                    </Typography>
                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        {pages.map((item) => (
                            <Link href={item.key} key={item.label}>
                                <Button key={item.label} sx={{ color: '#fff' }}>
                                    {item.label}
                                </Button>
                            </Link>
                        ))}
                    </Box>
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
                    display: { xs: 'block', sm: 'none' },
                    '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 }
                }}
            >
                {drawer}
            </Drawer>
        </>
    );
};
export default Header;
