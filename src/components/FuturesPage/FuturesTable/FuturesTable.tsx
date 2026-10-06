'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Empty, Grid, Table, TableProps, Tag } from 'antd';
import { IFuture } from '@models/marketFuture';
import { formatPercent, intToRubCompact, intToGrouped } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/dateUtils';
import { FUTURE_GROUP_COLOR, FUTURE_GROUP_LABEL } from '@api/moex/futures/futureGroup';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import style from './style.module.scss';

interface FuturesTableProps {
    data: IFuture[];
    loading?: boolean;
    error?: boolean;
    /** Текущая страница (1-based), поднята в URL — чтобы «Назад» вернул то же место. */
    page: number;
    /** Смена страницы (десктоп-пагинация и мобильный «Показать ещё» пишут сюда). */
    onPageChange: (page: number) => void;
}

/** Сколько карточек показываем на мобильных до нажатия «Показать ещё». */
const MOBILE_PAGE = 25;

const changeClass = (percent: number) => {
    if (percent > 0) return style.up;
    if (percent < 0) return style.down;
    return style.flat;
};

/** Цена контракта — с числом знаков из справочника (DECIMALS). */
const formatPrice = (future: IFuture) =>
    future.last === null
        ? '—'
        : future.last.toLocaleString('ru-RU', {
              minimumFractionDigits: future.decimals,
              maximumFractionDigits: future.decimals
          });

/** Тег группы фьючерса — общий для таблицы и карточек. */
const GroupTag: React.FC<{ future: IFuture }> = ({ future }) => (
    <Tag color={FUTURE_GROUP_COLOR[future.group]} bordered={false}>
        {FUTURE_GROUP_LABEL[future.group]}
    </Tag>
);

const columns: TableProps<IFuture>['columns'] = [
    {
        title: 'Контракт',
        dataIndex: 'shortName',
        key: 'shortName',
        fixed: 'left',
        width: 240,
        render: (_, future) => (
            <div className={style.name}>
                <span className={style.nameTitle}>{future.shortName}</span>
                <span className={style.sub}>{future.secid}</span>
                <GroupTag future={future} />
            </div>
        )
    },
    {
        title: 'Цена',
        dataIndex: 'last',
        key: 'last',
        align: 'right',
        width: 130,
        render: (_, future) => <span className={style.mono}>{formatPrice(future)}</span>,
        sorter: (a, b) => (a.last ?? 0) - (b.last ?? 0)
    },
    {
        title: 'За день',
        dataIndex: 'dayChangePercent',
        key: 'dayChangePercent',
        align: 'right',
        width: 110,
        render: (_, future) => (
            <span className={`${style.mono} ${changeClass(future.dayChangePercent)}`}>
                {formatPercent(future.dayChangePercent)}
            </span>
        ),
        sorter: (a, b) => a.dayChangePercent - b.dayChangePercent
    },
    {
        title: 'Откр. интерес',
        dataIndex: 'openPosition',
        key: 'openPosition',
        align: 'right',
        width: 130,
        render: (_, future) => <span className={style.mono}>{intToGrouped(future.openPosition)}</span>,
        sorter: (a, b) => a.openPosition - b.openPosition
    },
    {
        title: 'Оборот за день',
        dataIndex: 'valToday',
        key: 'valToday',
        align: 'right',
        width: 150,
        render: (_, future) => <span className={style.mono}>{intToRubCompact(future.valToday)}</span>,
        sorter: (a, b) => a.valToday - b.valToday
    },
    {
        title: 'Экспирация',
        dataIndex: 'expiry',
        key: 'expiry',
        align: 'right',
        width: 130,
        render: (_, future) => (
            <span className={style.mono}>
                {future.isPerpetual ? 'вечный' : formatDate(future.expiry)}
            </span>
        ),
        sorter: (a, b) => a.expiry.localeCompare(b.expiry)
    }
];

const FuturesTable: React.FC<FuturesTableProps> = ({ data, loading, error, page, onPageChange }) => {
    const router = useRouter();
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const screens = Grid.useBreakpoint();
    const isMobile = screens.md === false;

    if (error) {
        return <Empty description='Не удалось загрузить фьючерсы. Попробуйте обновить страницу.' />;
    }

    if (isMobile) {
        // На мобиле page работает как «сколько порций по MOBILE_PAGE подгружено».
        const visible = page * MOBILE_PAGE;
        const shown = data.slice(0, visible);
        return (
            <div className={style.wrapper}>
                <div className={style.mList} style={{ ['--rowBorder' as string]: palette.border }}>
                    {shown.map((future) => {
                        const cls = changeClass(future.dayChangePercent);
                        return (
                            <div
                                key={future.id}
                                className={style.mRow}
                                onClick={() => router.push(`/futures/${future.secid}`)}
                            >
                                <div className={style.mMain}>
                                    <span className={style.mName}>{future.shortName}</span>
                                    <span className={style.mSub}>{future.secid}</span>
                                    <GroupTag future={future} />
                                </div>
                                <div className={style.mRight}>
                                    <span className={style.mValue}>{formatPrice(future)}</span>
                                    <span className={`${style.mSub} ${cls}`}>
                                        {formatPercent(future.dayChangePercent)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {visible < data.length ? (
                        <Button
                            className={style.showMore}
                            block
                            onClick={() => onPageChange(page + 1)}
                        >
                            Показать ещё
                        </Button>
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div className={style.wrapper}>
            <Table<IFuture>
                columns={columns}
                dataSource={data}
                rowKey='id'
                loading={loading}
                sticky
                scroll={{ x: 'max-content' }}
                pagination={{
                    current: page,
                    pageSize: 25,
                    showSizeChanger: false,
                    hideOnSinglePage: true,
                    onChange: (next) => onPageChange(next)
                }}
                onRow={(record) => ({
                    onClick: () => router.push(`/futures/${record.secid}`)
                })}
                rowClassName={style.row}
            />
        </div>
    );
};
export default FuturesTable;
