'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, Empty, Grid, Table, TableProps, Tag } from 'antd';
import { IFund } from '@models/fund';
import { formatPercent, intToRub, intToRubCompact } from '@/utils/formatCurrency';
import { FUND_CATEGORY_COLOR, FUND_CATEGORY_LABEL } from '@api/moex/funds/fundCategory';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import ShareLogo from '../../ShareLogo/ShareLogo';
import style from './style.module.scss';

interface FundsTableProps {
    data: IFund[];
    loading?: boolean;
    error?: boolean;
}

/** Сколько карточек показываем на мобильных до нажатия «Показать ещё». */
const MOBILE_PAGE = 25;

const dayChangeClass = (percent: number) => {
    if (percent > 0) return style.up;
    if (percent < 0) return style.down;
    return style.flat;
};

/** Убираем служебный префикс «БПИФ » из описательного имени для компактности. */
const cleanName = (name: string) => name.replace(/^БПИФ\s+/i, '').trim();

/** Тег категории актива фонда — общий для таблицы и карточек. */
const CategoryTag: React.FC<{ fund: IFund }> = ({ fund }) => (
    <Tag color={FUND_CATEGORY_COLOR[fund.category]} bordered={false}>
        {FUND_CATEGORY_LABEL[fund.category]}
    </Tag>
);

const columns: TableProps<IFund>['columns'] = [
    {
        title: 'Фонд',
        dataIndex: 'shortName',
        key: 'shortName',
        fixed: 'left',
        width: 240,
        render: (_, fund) => (
            <div className={style.nameCell}>
                <ShareLogo icon={fund.isin} ticker={fund.ticker} size={36} />
                <div className={style.name}>
                    <span className={style.nameTitle}>{fund.ticker}</span>
                    <span className={style.sub}>{cleanName(fund.name)}</span>
                    <CategoryTag fund={fund} />
                </div>
            </div>
        )
    },
    {
        title: 'Цена пая',
        dataIndex: 'price',
        key: 'price',
        align: 'right',
        width: 120,
        render: (_, fund) => (
            <span className={style.mono}>{fund.price === null ? '—' : intToRub(fund.price)}</span>
        ),
        sorter: (a, b) => (a.price ?? 0) - (b.price ?? 0)
    },
    {
        title: 'За день',
        dataIndex: 'dayChangePercent',
        key: 'dayChangePercent',
        align: 'right',
        width: 110,
        render: (_, fund) => (
            <span className={`${style.mono} ${dayChangeClass(fund.dayChangePercent)}`}>
                {formatPercent(fund.dayChangePercent)}
            </span>
        ),
        sorter: (a, b) => a.dayChangePercent - b.dayChangePercent
    },
    {
        title: 'Оборот за день',
        dataIndex: 'valToday',
        key: 'valToday',
        align: 'right',
        width: 150,
        render: (_, fund) => <span className={style.mono}>{intToRubCompact(fund.valToday)}</span>,
        defaultSortOrder: 'descend',
        sorter: (a, b) => a.valToday - b.valToday
    },
    {
        title: 'Листинг',
        dataIndex: 'listLevel',
        key: 'listLevel',
        align: 'right',
        width: 100,
        render: (_, fund) => <span className={style.muted}>{fund.listLevel} ур.</span>,
        sorter: (a, b) => a.listLevel - b.listLevel
    }
];

const FundsTable: React.FC<FundsTableProps> = ({ data, loading, error }) => {
    const router = useRouter();
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const screens = Grid.useBreakpoint();
    const isMobile = screens.md === false;
    const [visible, setVisible] = React.useState(MOBILE_PAGE);

    if (error) {
        return <Empty description='Не удалось загрузить фонды. Попробуйте обновить страницу.' />;
    }

    if (isMobile) {
        const shown = data.slice(0, visible);
        return (
            <div className={style.wrapper}>
                <div className={style.mList} style={{ ['--rowBorder' as string]: palette.border }}>
                    {shown.map((fund) => {
                        const cls = dayChangeClass(fund.dayChangePercent);
                        return (
                            <div
                                key={fund.id}
                                className={style.mRow}
                                onClick={() => router.push(`/funds/${fund.ticker}`)}
                            >
                                <ShareLogo icon={fund.isin} ticker={fund.ticker} size={40} />
                                <div className={style.mMain}>
                                    <span className={style.mName}>{fund.ticker}</span>
                                    <span className={style.mSub}>{cleanName(fund.name)}</span>
                                    <CategoryTag fund={fund} />
                                </div>
                                <div className={style.mRight}>
                                    <span className={style.mValue}>
                                        {fund.price === null ? '—' : intToRub(fund.price)}
                                    </span>
                                    <span className={`${style.mSub} ${cls}`}>
                                        {formatPercent(fund.dayChangePercent)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {visible < data.length ? (
                        <Button
                            className={style.showMore}
                            block
                            onClick={() => setVisible((v) => v + MOBILE_PAGE)}
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
            <Table<IFund>
                columns={columns}
                dataSource={data}
                rowKey='id'
                loading={loading}
                sticky
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 25, showSizeChanger: false, hideOnSinglePage: true }}
                onRow={(record) => ({
                    onClick: () => router.push(`/funds/${record.ticker}`)
                })}
                rowClassName={style.row}
            />
        </div>
    );
};
export default FundsTable;
