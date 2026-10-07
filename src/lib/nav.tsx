import {
    AccountBookOutlined,
    AppstoreOutlined,
    BankOutlined,
    DollarCircleOutlined,
    FundOutlined,
    HomeOutlined,
    LineChartOutlined,
    PieChartOutlined,
    ReadOutlined,
    StockOutlined,
    WalletOutlined
} from '@ant-design/icons';
import type { ComponentType } from 'react';

export interface NavItem {
    /** Путь и одновременно ключ для подсветки активного раздела. */
    key: string;
    label: string;
    Icon: ComponentType<{ style?: React.CSSProperties }>;
    /** Короткое пояснение — показывается в мега-меню «Рынки». */
    desc?: string;
}

/** Секция внутри мега-меню «Рынки». */
export interface NavGroup {
    label: string;
    items: NavItem[];
}

/**
 * Разделы, спрятанные под триггер «Рынки» в десктопной шапке.
 * Биржевые инструменты MOEX и крипта лежат в разных секциях панели.
 */
export const marketMenu: NavGroup[] = [
    {
        label: 'Фондовый рынок',
        items: [
            { key: '/moex', label: 'Акции', Icon: LineChartOutlined, desc: 'Котировки TQBR' },
            { key: '/bonds', label: 'Облигации', Icon: BankOutlined, desc: 'Купоны и доходность' },
            { key: '/funds', label: 'Фонды', Icon: PieChartOutlined, desc: 'БПИФ и ETF' },
            { key: '/indices', label: 'Индексы', Icon: StockOutlined, desc: 'MOEX и мировые' },
            { key: '/futures', label: 'Фьючерсы', Icon: FundOutlined, desc: 'Срочный рынок FORTS' }
        ]
    },
    {
        label: 'Криптовалюты',
        items: [
            {
                key: '/cryptocurrency',
                label: 'Крипта',
                Icon: DollarCircleOutlined,
                desc: 'BTC, ETH, SOL и рынок в ₽ / $'
            }
        ]
    }
];

/** Плоский список всех разделов под «Рынки» (для подсветки активного триггера). */
export const marketItems: NavItem[] = marketMenu.flatMap((group) => group.items);

/** Прямые ссылки верхнего ряда справа от «Рынки». */
export const topNav: NavItem[] = [
    { key: '/moex/portfolio', label: 'Портфель', Icon: WalletOutlined },
    { key: '/budget', label: 'Бюджет', Icon: AccountBookOutlined },
    { key: '/news', label: 'Новости', Icon: ReadOutlined }
];

/** Все разделы десктопной навигации (для вычисления активного ключа). */
export const navItems: NavItem[] = [...marketItems, ...topNav];

/** Основные вкладки нижней панели на мобилке (по порядку слева направо). */
export const primaryNav: NavItem[] = [
    { key: '/bonds', label: 'Облигации', Icon: BankOutlined },
    { key: '/moex', label: 'Акции', Icon: LineChartOutlined },
    { key: '/moex/portfolio', label: 'Портфель', Icon: WalletOutlined },
    { key: '/funds', label: 'Фонды', Icon: PieChartOutlined }
];

/** Вторичные разделы, спрятанные под вкладку «Ещё». */
export const moreNav: NavItem[] = [
    { key: '/', label: 'Главная', Icon: HomeOutlined },
    { key: '/budget', label: 'Бюджет', Icon: AccountBookOutlined },
    { key: '/indices', label: 'Индексы', Icon: StockOutlined },
    { key: '/futures', label: 'Фьючерсы', Icon: FundOutlined },
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
