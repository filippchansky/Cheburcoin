// 'use client'
import { Breadcrumbs, Typography } from '@mui/material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import style from "./style.module.scss"

interface NavStepperProps {}

const NavStepper: React.FC<NavStepperProps> = ({}) => {
    function handleClick(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        event.preventDefault();
        console.info('You clicked a breadcrumb.');
    }

    const pathname = usePathname();
    const pathArr = pathname.split('/').slice(1);

    return (
        <div role='presentation' onClick={handleClick} className='p-10'>
            <Breadcrumbs aria-label='breadcrumb'>
                <Link color='inherit' href='/'>
                    <p className={style.link}>Home</p>
                </Link>
                {pathArr.map((item, index) => {
                    const href = `/${pathArr.slice(0, index + 1).join('/')}`;
                    return (
                        <Link key={item} color='inherit' href={href}>
                            <p className={style.link}>{item}</p>
                        </Link>
                    );
                })}
                {/* {pathArr.map(item => (
                    <Link key={item} color='inherit' href={item}>
                        {item}
                    </Link>
                    ))} */}
            </Breadcrumbs>
        </div>
    );
};
export default NavStepper;
