'use client';
import React from 'react';
import { Button, Empty, Grid, Table, TableProps, Tag, Tooltip } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { IBond } from '@models/bond';
import { formatMoney } from '@/utils/formatCurrency';
import { formatDate, yearsUntil } from '@/utils/dateUtils';
import { couponTag, isYieldOutlier } from '@/utils/bondLabels';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import style from './style.module.scss';
import Link from 'next/link';

interface BondsTableProps {
    data: IBond[];
    loading?: boolean;
    error?: boolean;
}

/** Сколько карточек показываем на мобильных до нажатия «Показать ещё». */
const MOBILE_PAGE = 25;

const num = (value: number | null, digits = 2) => (value === null ? '—' : value.toFixed(digits));

/** «2041-05-19» → «05.2041» для компактной строки метрик. */
const maturityShort = (dateString: string) => {
    if (!dateString || dateString === '0000-00-00') return '—';
    const [year, month] = dateString.split('-');
    return `${month}.${year}`;
};

/** Набор тегов выпуска (тип купона, аморт., оферта) — общий для таблицы и карточек. */
const BondTags: React.FC<{ bond: IBond }> = ({ bond }) => {
    return (
        <span className={style.tags}>
            <Tag color={couponTag[bond.couponType].color} bordered={false}>
                {couponTag[bond.couponType].label}
            </Tag>
            {bond.hasAmortization && (
                <Tag color='purple' bordered={false}>
                    Аморт.
                </Tag>
            )}
            {bond.hasOffer && (
                <Tag color='volcano' bordered={false}>
                    Оферта
                </Tag>
            )}
        </span>
    );
};

const columns: TableProps<IBond>['columns'] = [
    {
        title: 'Название',
        dataIndex: 'shortName',
        key: 'shortName',
        fixed: 'left',
        width: 150,
        render: (_, bond) => (
            <div className={style.name}>
                <Link target='_blank' href={`/bonds/${bond.secid}`} className={style.nameTitle}>{bond.shortName}</Link>
                {bond.sector && <span className={style.sector}>{bond.sector}</span>}
                <BondTags bond={bond} />
            </div>
        )
    },
    {
        title: 'Цена',
        dataIndex: 'pricePercent',
        key: 'pricePercent',
        align: 'right',
        width: 90,
        render: (_, bond) => (
            <div className={style.cell}>
                {bond.priceValue !== null && (
                    <span className={style.strong}>
                        {formatMoney(bond.priceValue, bond.currency)}
                    </span>
                )}
                <span className={style.muted}>{num(bond.pricePercent)}%</span>
            </div>
        ),
        sorter: (a, b) => (a.pricePercent ?? 0) - (b.pricePercent ?? 0)
    },
    {
        title: 'Доходность',
        dataIndex: 'yield',
        key: 'yield',
        align: 'right',
        width: 130,
        render: (_, bond) =>
            isYieldOutlier(bond) ? (
                <Tooltip title='Аномальная доходность: вероятен дефолт эмитента или ошибка данных биржи у бумаги близко к погашению. Проверяйте выпуск вручную.'>
                    <span className={style.outlierYield}>
                        {num(bond.yield)}% <WarningOutlined />
                    </span>
                </Tooltip>
            ) : (
                <span className={style.strong}>{num(bond.yield)}%</span>
            ),
        sorter: (a, b) => (a.yield ?? 0) - (b.yield ?? 0)
    },
    {
        title: 'Тек. доходность',
        dataIndex: 'couponYieldToPrice',
        key: 'couponYieldToPrice',
        align: 'right',
        width: 190,
        render: (_, bond) => (
            <div className={style.cell}>
                <span className={style.strong}>{num(bond.couponYieldToPrice)}%</span>
                {bond.couponYieldToNominal !== null && (
                    <span className={style.muted}>
                        {bond.couponYieldToNominal.toFixed(2)}% к номин.
                    </span>
                )}
            </div>
        ),
        sorter: (a, b) => (a.couponYieldToPrice ?? 0) - (b.couponYieldToPrice ?? 0)
    },
    {
        title: 'Купон',
        dataIndex: 'couponPercent',
        key: 'couponPercent',
        align: 'right',
        width: 95,
        render: (_, bond) =>
            bond.couponPercent === null ? (
                <span className={style.muted}>плавающий</span>
            ) : (
                <span>{bond.couponPercent.toFixed(2)}%</span>
            ),
        sorter: (a, b) => (a.couponPercent ?? 0) - (b.couponPercent ?? 0)
    },
    {
        title: 'Погашение',
        dataIndex: 'maturityDate',
        key: 'maturityDate',
        align: 'right',
        width: 128,
        render: (_, bond) => {
            const years = yearsUntil(bond.maturityDate);
            return (
                <div className={style.cell}>
                    <span>{formatDate(bond.maturityDate)}</span>
                    {years !== null && (
                        <span className={style.muted}>через {years.toFixed(1)} г.</span>
                    )}
                </div>
            );
        },
        sorter: (a, b) => a.maturityDate.localeCompare(b.maturityDate)
    },
    {
        title: 'Дюрация',
        dataIndex: 'duration',
        key: 'duration',
        align: 'right',
        width: 113,
        render: (_, bond) =>
            bond.duration === null ? '—' : <span>{(bond.duration / 365).toFixed(1)} г.</span>,
        sorter: (a, b) => (a.duration ?? 0) - (b.duration ?? 0)
    },
    {
        title: 'НКД',
        dataIndex: 'accruedInt',
        key: 'accruedInt',
        align: 'right',
        width: 82,
        render: (_, bond) => (
            <span className={style.muted}>{formatMoney(bond.accruedInt, bond.currency)}</span>
        )
    }
];

const BondsTable: React.FC<BondsTableProps> = ({ data, loading, error }) => {
    const router = useRouter();
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const screens = Grid.useBreakpoint();
    const isMobile = screens.md === false;
    const [visible, setVisible] = React.useState(MOBILE_PAGE);

    if (error) {
        return (
            <Empty description='Не удалось загрузить облигации. Попробуйте обновить страницу.' />
        );
    }

    if (isMobile) {
        const shown = data.slice(0, visible);
        return (
            <div className={style.wrapper}>
                <div
                    className={style.mList}
                    style={{ ['--rowBorder' as string]: palette.border }}
                >
                    {shown.map((bond) => {
                        const outlier = isYieldOutlier(bond);
                        const coupon =
                            bond.couponPercent === null
                                ? 'плав.'
                                : `${bond.couponPercent.toFixed(2)}%`;
                        return (
                            <div
                                key={bond.id}
                                className={style.mCard}
                                onClick={() => router.push(`/bonds/${bond.secid}`)}
                            >
                                <div className={style.mHead}>
                                    <span className={style.mName}>{bond.shortName}</span>
                                    {outlier ? (
                                        <span className={`${style.mYield} ${style.outlierYield}`}>
                                            {num(bond.yield)}% <WarningOutlined />
                                        </span>
                                    ) : (
                                        <span className={style.mYield}>{num(bond.yield)}%</span>
                                    )}
                                </div>
                                {bond.sector && <span className={style.sector}>{bond.sector}</span>}
                                <BondTags bond={bond} />
                                <div className={style.mMetrics}>
                                    Купон {coupon} · Погашение {maturityShort(bond.maturityDate)} ·
                                    Цена {num(bond.pricePercent, 1)}%
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
            <Table<IBond>
                columns={columns}
                dataSource={data}
                rowKey='id'
                loading={loading}
                sticky
                scroll={{ x: 'max-content' }}
                pagination={{ pageSize: 25, showSizeChanger: false, hideOnSinglePage: true }}
                // onRow={(bond) => ({ onClick: () => router.push(`/bonds/${bond.secid}`) })}
                rowClassName={style.row}
            />
        </div>
    );
};
export default BondsTable;
