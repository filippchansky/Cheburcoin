'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as motion from 'motion/react-client';
import { Drawer } from 'antd';
import { getPalette } from '@/theme/palette';
import { useDarkTheme } from '@/store/darkTheme';
import { MoreIcon, getActiveKey, moreNav, primaryNav } from '@/lib/nav';
import type { ComponentType } from 'react';
import style from './style.module.scss';

const pillTransition = { type: 'spring' as const, stiffness: 420, damping: 34 };

interface TabInnerProps {
    Icon: ComponentType<{ style?: React.CSSProperties }>;
    label: string;
    active: boolean;
    activeColor: string;
    idleColor: string;
}

/** Внутренности вкладки: анимированная «пилюля», «поп» иконки и подпись. */
const TabInner: React.FC<TabInnerProps> = ({ Icon, label, active, activeColor, idleColor }) => (
    <>
        <span className={style.iconWrap}>
            {active && (
                <motion.span
                    layoutId='bnav-pill'
                    className={style.pill}
                    style={{ background: `${activeColor}22` }}
                    transition={pillTransition}
                />
            )}
            <motion.span
                className={style.icon}
                style={{ color: active ? activeColor : idleColor }}
                animate={{ scale: active ? 1.12 : 1, y: active ? -1 : 0 }}
                transition={pillTransition}
            >
                <Icon style={{ fontSize: 20 }} />
            </motion.span>
        </span>
        <span className={style.label} style={{ color: active ? activeColor : idleColor }}>
            {label}
        </span>
    </>
);

const BottomNav: React.FC = () => {
    const pathname = usePathname();
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const [moreOpen, setMoreOpen] = React.useState(false);

    // Активный основной раздел (по всем разделам, чтобы префиксы не конфликтовали).
    const activeKey = getActiveKey(pathname, [...primaryNav, ...moreNav]);
    // «Ещё» подсвечиваем, когда открыт один из вторичных разделов.
    const moreActive = moreNav.some((item) => item.key !== '/' && item.key === activeKey);

    const active = palette.primary;
    const idle = palette.textMuted;

    return (
        <>
            <nav
                className={style.bar}
                style={{ background: palette.headerBg, borderTopColor: palette.border }}
            >
                {primaryNav.map(({ key, label, Icon }) => (
                    <motion.div key={key} className={style.item} whileTap={{ scale: 0.88 }}>
                        <Link href={key} className={style.link} aria-current={key === activeKey ? 'page' : undefined}>
                            <TabInner
                                Icon={Icon}
                                label={label}
                                active={key === activeKey}
                                activeColor={active}
                                idleColor={idle}
                            />
                        </Link>
                    </motion.div>
                ))}
                <motion.button
                    type='button'
                    className={style.item}
                    aria-label='Ещё'
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setMoreOpen(true)}
                >
                    <span className={style.link}>
                        <TabInner
                            Icon={MoreIcon}
                            label='Ещё'
                            active={moreActive}
                            activeColor={active}
                            idleColor={idle}
                        />
                    </span>
                </motion.button>
            </nav>

            <Drawer
                open={moreOpen}
                onClose={() => setMoreOpen(false)}
                placement='bottom'
                height='auto'
                title='Ещё'
                styles={{ body: { padding: 8 } }}
            >
                <div className={style.moreGrid}>
                    {moreNav.map(({ key, label, Icon }) => {
                        const isActive = key === activeKey || (key === '/' && pathname === '/');
                        return (
                            <Link
                                key={key}
                                href={key}
                                className={style.moreItem}
                                style={{ color: isActive ? palette.primary : undefined }}
                                onClick={() => setMoreOpen(false)}
                            >
                                <Icon style={{ fontSize: 22 }} />
                                <span>{label}</span>
                            </Link>
                        );
                    })}
                </div>
            </Drawer>
        </>
    );
};

export default BottomNav;
