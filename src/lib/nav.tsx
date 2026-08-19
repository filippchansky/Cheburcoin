import {
    AppstoreOutlined,
    BankOutlined,
    DollarCircleOutlined,
    HomeOutlined,
    LineChartOutlined,
    PieChartOutlined,
    ReadOutlined,
    WalletOutlined
} from '@ant-design/icons';
import type { ComponentType } from 'react';

export interface NavItem {
    /** Путь и одновременно ключ для подсветки активного раздела. */
    key: string;
    label: string;
    Icon: ComponentType<{ style?: React.CSSProperties }>;
}

/** Разделы для десктопного меню в шапке (полный список). */
export const navItems: NavItem[] = [
    { key: '/moex', label: 'Акции', Icon: LineChartOutlined },
    { key: '/bonds', label: 'Облигации', Icon: BankOutlined },
    { key: '/funds', label: 'Фонды', Icon: PieChartOutlined },
    { key: '/moex/portfolio', label: 'Портфель', Icon: WalletOutlined },
    { key: '/cryptocurrency', label: 'Крипта', Icon: DollarCircleOutlined },
    { key: '/news', label: 'Новости', Icon: ReadOutlined }
];

/** Основные вкладки нижней панели на мобилке (по порядку слева направо). */
export const primaryNav: NavItem[] = [
    { key: '/moex/portfolio', label: 'Портфель', Icon: WalletOutlined },
    { key: '/moex', label: 'Акции', Icon: LineChartOutlined },
    { key: '/bonds', label: 'Облигации', Icon: BankOutlined },
    { key: '/funds', label: 'Фонды', Icon: PieChartOutlined }
];

/** Вторичные разделы, спрятанные под вкладку «Ещё». */
export const moreNav: NavItem[] = [
    { key: '/', label: 'Главная', Icon: HomeOutlined },
    { key: '/cryptocurrency', label: 'Крипта', Icon: DollarCircleOutlined },
    { key: '/news', label: 'Новости', Icon: ReadOutlined }
];

export const MoreIcon = AppstoreOutlined;

/**
 * Ключ активного раздела: самый длинный совпавший префикс пути,
 * иначе /moex/portfolio подсветит и «Акции» (оба начинаются с /moex).
 */
export const getActiveKey = (pathname: string | null, items: NavItem[]): string | undefined =>
    items
        .filter((item) => item.key !== '/' && pathname?.startsWith(item.key))
        .sort((a, b) => b.key.length - a.key.length)[0]?.key;
