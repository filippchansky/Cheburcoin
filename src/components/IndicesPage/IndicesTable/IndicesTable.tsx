'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Empty, Grid, Table, TableProps, Tag } from 'antd';
import { IIndex } from '@models/marketIndex';
import { formatPercent, intToRubCompact } from '@/utils/formatCurrency';
import { INDEX_GROUP_COLOR, INDEX_GROUP_LABEL } from '@api/moex/indices/indexGroup';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import style from './style.module.scss';

interface IndicesTableProps {
    data: IIndex[];
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

/** Значение индекса — в пунктах, с числом знаков из справочника (DECIMALS). */
const formatValue = (index: IIndex) =>
    index.value === null
        ? '—'
        : index.value.toLocaleString('ru-RU', {
              minimumFractionDigits: index.decimals,
              maximumFractionDigits: index.decimals
          });

/** Тег группы индекса — общий для таблицы и карточек. */
const GroupTag: React.FC<{ index: IIndex }> = ({ index }) => (
    <Tag color={INDEX_GROUP_COLOR[index.group]} bordered={false}>
        {INDEX_GROUP_LABEL[index.group]}
    </Tag>
);

const changeColumn = (
    title: string,
    key: 'dayChangePercent' | 'monthChangePercent' | 'yearChangePercent'
): NonNullable<TableProps<IIndex>['columns']>[number] => ({
    title,
    dataIndex: key,
    key,
    align: 'right',
    width: 110,
    render: (_, index) => (
        <span className={`${style.mono} ${changeClass(index[key])}`}>
            {formatPercent(index[key])}
        </span>
    ),
    sorter: (a, b) => a[key] - b[key]
});

const columns: TableProps<IIndex>['columns'] = [
    {
        title: 'Индекс',
        dataIndex: 'shortName',
        key: 'shortName',
        fixed: 'left',
        width: 260,
        render: (_, index) => (
            <div className={style.name}>
                <span className={style.nameTitle}>{index.shortName}</span>
                <span className={style.sub}>{index.secid}</span>
                <GroupTag index={index} />
            </div>
        )
    },
    {
        title: 'Значение',
        dataIndex: 'value',
        key: 'value',
        align: 'right',
        width: 130,
        render: (_, index) => <span className={style.mono}>{formatValue(index)}</span>,
        sorter: (a, b) => (a.value ?? 0) - (b.value ?? 0)
    },
    changeColumn('За день', 'dayChangePercent'),
    changeColumn('За месяц', 'monthChangePercent'),
    changeColumn('За год', 'yearChangePercent'),
    {
        title: 'Оборот за день',
        dataIndex: 'valToday',
        key: 'valToday',
        align: 'right',
        width: 150,
        render: (_, index) => <span className={style.mono}>{intToRubCompact(index.valToday)}</span>,
        sorter: (a, b) => a.valToday - b.valToday
    }
];

const IndicesTable: React.FC<IndicesTableProps> = ({
    data,
    loading,
    error,
    page,
    onPageChange
}) => {
    const router = useRouter();
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const screens = Grid.useBreakpoint();
    const isMobile = screens.md === false;

    if (error) {
        return <Empty description='Не удалось загрузить индексы. Попробуйте обновить страницу.' />;
    }

    if (isMobile) {
        // На мобиле page работает как «сколько порций по MOBILE_PAGE подгружено».
        const visible = page * MOBILE_PAGE;
        const shown = data.slice(0, visible);
        return (
            <div className={style.wrapper}>
                <div className={style.mList} style={{ ['--rowBorder' as string]: palette.border }}>
                    {shown.map((index) => {
                        const cls = changeClass(index.dayChangePercent);
                        return (
                            <div
                                key={index.id}
                                className={style.mRow}
                                onClick={() => router.push(`/indices/${index.secid}`)}
                            >
                                <div className={style.mMain}>
                                    <span className={style.mName}>{index.shortName}</span>
                                    <span className={style.mSub}>{index.secid}</span>
                                    <GroupTag index={index} />
                                </div>
                                <div className={style.mRight}>
                                    <span className={style.mValue}>{formatValue(index)}</span>
                                    <span className={`${style.mSub} ${cls}`}>
                                        {formatPercent(index.dayChangePercent)}
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
            <Table<IIndex>
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
                    onClick: () => router.push(`/indices/${record.secid}`)
                })}
                rowClassName={style.row}
            />
        </div>
    );
};
export default IndicesTable;
