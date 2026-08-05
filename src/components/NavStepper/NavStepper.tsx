'use client';
import { Breadcrumb } from 'antd';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import style from './style.module.scss';

interface NavStepperProps {}

const NavStepper: React.FC<NavStepperProps> = ({}) => {
    const pathname = usePathname();
    const pathArr = pathname.split('/').slice(1);

    const items = [
        {
            title: (
                <Link href='/'>
                    <span className={style.link}>Home</span>
                </Link>
            )
        },
        ...pathArr
            .filter((item) => item.length > 0)
            .map((item, index) => {
                const href = `/${pathArr.slice(0, index + 1).join('/')}`;
                return {
                    title: (
                        <Link href={href}>
                            <span className={style.link}>{item}</span>
                        </Link>
                    )
                };
            })
    ];

    return (
        <div className='py-4'>
            <Breadcrumb items={items} />
        </div>
    );
};
export default NavStepper;
