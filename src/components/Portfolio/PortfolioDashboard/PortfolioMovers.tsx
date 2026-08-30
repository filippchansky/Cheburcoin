'use client';
import React from 'react';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import { IPosition } from '@models/tinkoffData';
import MoversCard, { MoverItem } from '@/components/MoversCard/MoversCard';
import { formatAmount, formatPercent } from '@/utils/formatCurrency';
import { positionHref } from '@/utils/positionHref';

type Direction = 'up' | 'down';

interface PortfolioMoversProps {
    positions: IPosition[];
    loading?: boolean;
    /** Сторона дня: рост или падение. */
    direction?: Direction;
    /** Сколько бумаг показывать. */
    limit?: number;
    /** Убрать внешнюю рамку карточки. */
    borderless?: boolean;
    /** Порядковый номер — задержка появления в анимации. */
    index?: number;
}

/**
 * Изменение позиции за день в процентах: рублёвый дневной результат к стоимости
 * позиции на вчерашнем закрытии (текущая стоимость − результат за день). Та же
 * формула, что в блоке «В портфеле» на странице бумаги.
 */
const dayPercent = (position: IPosition): number | null => {
    const dayAbs = position.dailyYield ?? 0;
    const prevValue = (position.priceInPorfolio ?? 0) - dayAbs;
    return prevValue > 0 ? (dayAbs / prevValue) * 100 : null;
};

const CONFIG: Record<
    Direction,
    { title: string; icon: React.ReactNode; empty: string }
> = {
    up: {
        title: 'Лидеры роста в портфеле',
        icon: <RiseOutlined />,
        empty: 'Сегодня ни одна бумага портфеля не выросла'
    },
    down: {
        title: 'Лидеры падения в портфеле',
        icon: <FallOutlined />,
        empty: 'Сегодня ни одна бумага портфеля не упала'
    }
};

/**
 * Топ движения за день среди бумаг портфеля — тот же формат, что «Лидеры роста»
 * на странице акций, но только по своим эмитентам. Кэш (валютные позиции) не
 * считаем: у него нет дневной переоценки.
 */
const PortfolioMovers: React.FC<PortfolioMoversProps> = ({
    positions,
    loading,
    direction = 'up',
    limit = 5,
    borderless = false,
    index = 0
}) => {
    const items = React.useMemo<MoverItem[]>(
        () =>
            positions
                .filter((position) => position.instrumentType !== 'currency')
                .flatMap((position) => {
                    const percent = dayPercent(position);
                    if (percent === null) return [];
                    if (direction === 'up' ? percent <= 0 : percent >= 0) return [];
                    return [{ position, percent }];
                })
                .sort((a, b) => (direction === 'up' ? b.percent - a.percent : a.percent - b.percent))
                .slice(0, limit)
                .map(({ position, percent }) => ({
                    key: position.instrumentUid || position.figi,
                    ticker: position.ticker ?? '',
                    icon: position.isin ?? '',
                    logoSrc: position.logoUrl,
                    sub: formatAmount(position.dailyYield ?? 0, position.currency, { signed: true }),
                    metric: formatPercent(percent),
                    href: positionHref(position)
                })),
        [positions, direction, limit]
    );

    const cfg = CONFIG[direction];
    return (
        <MoversCard
            title={cfg.title}
            icon={cfg.icon}
            accent={direction}
            items={items}
            loading={loading}
            emptyText={cfg.empty}
            borderless={borderless}
            index={index}
        />
    );
};
export default PortfolioMovers;
