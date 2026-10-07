'use client';
import { Dropdown, theme } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import Link from 'next/link';
import React from 'react';
import Account from './Account/Account';
import { useDarkTheme } from '@/store/darkTheme';
import { usePathname } from 'next/navigation';
import { getPalette } from '@/theme/palette';
import { getActiveKey, marketItems, marketMenu, navItems, topNav } from '@/lib/nav';
import style from './style.module.scss';

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(' ');

const Header = () => {
    const { darkTheme } = useDarkTheme();
    const pathname = usePathname();
    const palette = getPalette(darkTheme);
    const { token } = theme.useToken();

    const [marketsOpen, setMarketsOpen] = React.useState(false);

    const selectedKey = getActiveKey(pathname, navItems);
    const marketActive = marketItems.some((item) => item.key === selectedKey);

    // Цвета верхнего ряда и мега-меню прокидываем CSS-переменными: панель antd
    // рендерится в портал (body), где `inherit` даёт чёрный текст мимо тёмной темы.
    const navVars = {
        '--nav-idle': token.colorTextSecondary,
        '--nav-text': token.colorText,
        '--nav-hover': token.colorFillTertiary,
        '--nav-primary': palette.primary,
        '--nav-primary-bg': `${palette.primary}1f`
    } as React.CSSProperties;

    const menuVars = {
        '--mm-bg': token.colorBgElevated,
        '--mm-border': token.colorBorderSecondary,
        '--mm-text': token.colorText,
        '--mm-muted': token.colorTextTertiary,
        '--mm-hover': token.colorFillTertiary,
        '--mm-primary': palette.primary
    } as React.CSSProperties;

    const brand = (
        <Link href='/' className='flex items-center font-bold'>
            <span style={{ fontSize: 20, letterSpacing: '-0.02em' }}>
                CHEBUR<span style={{ color: palette.primary }}>COIN</span>
            </span>
        </Link>
    );

    const marketPanel = (
        <div className={style.megaPanel} style={menuVars}>
            {marketMenu.map((group, index) => (
                <React.Fragment key={group.label}>
                    {index > 0 && <div className={style.mmDivider} />}
                    <div className={style.mmGroupLabel}>{group.label}</div>
                    <div className={cx(style.mmGrid, group.items.length === 1 && style.single)}>
                        {group.items.map(({ key, label, Icon, desc }) => (
                            <Link
                                key={key}
                                href={key}
                                className={cx(style.mmItem, key === selectedKey && style.mmItemActive)}
                                onClick={() => setMarketsOpen(false)}
                            >
                                <span className={style.mmIcon}>
                                    <Icon style={{ fontSize: 20 }} />
                                </span>
                                <div>
                                    <div className={style.mmTitle}>{label}</div>
                                    {desc && <div className={style.mmDesc}>{desc}</div>}
                                </div>
                            </Link>
                        ))}
                    </div>
                </React.Fragment>
            ))}
        </div>
    );

    return (
        <div className='flex h-full w-full items-center justify-between gap-6'>
            <div className='flex items-center gap-6'>
                {brand}
                <nav className={style.desktopNav}>
                    <div className={style.topRow} style={navVars}>
                        <Dropdown
                            open={marketsOpen}
                            onOpenChange={setMarketsOpen}
                            trigger={['hover']}
                            placement='bottomLeft'
                            dropdownRender={() => marketPanel}
                        >
                            <span
                                className={cx(
                                    style.navLink,
                                    marketActive && style.navLinkActive,
                                    marketsOpen && style.triggerOpen
                                )}
                            >
                                Рынки <DownOutlined className={style.triggerIcon} />
                            </span>
                        </Dropdown>
                        {topNav.map(({ key, label, Icon }) => {
                            const isPortfolio = key === '/moex/portfolio';
                            return (
                                <Link
                                    key={key}
                                    href={key}
                                    className={cx(style.navLink, key === selectedKey && style.navLinkActive)}
                                >
                                    {isPortfolio && <Icon style={{ fontSize: 16 }} />}
                                    {label}
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
            <div className='flex items-center gap-3'>
                <Account />
            </div>
        </div>
    );
};
export default Header;
