'use client';
import React from 'react';
import { Skeleton, Table, TableProps, Tag } from 'antd';
import { IBondOffer } from '@models/bondDetail';
import { useBondOffers } from '@/hooks/useBonds';
import { formatMoney } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/dateUtils';
import style from './style.module.scss';

interface OffersProps {
    isin: string;
    currency: string;
    /** Есть ли у бумаги оферта по данным MOEX — управляет показом заглушки без токена. */
    hasOffer: boolean;
}

const TYPE_META: Record<'PUT' | 'CALL', { label: string; color: string; hint: string }> = {
    PUT: { label: 'Пут', color: 'blue', hint: 'Держатель вправе предъявить бумагу к выкупу' },
    CALL: { label: 'Колл', color: 'orange', hint: 'Эмитент вправе досрочно выкупить бумагу' }
};

/** Безопасный доступ к метаданным типа (не падаем на неизвестном значении). */
const typeMeta = (type: IBondOffer['type']) => (type ? TYPE_META[type] : undefined);

const today = () => new Date().toISOString().slice(0, 10);

const Offers: React.FC<OffersProps> = ({ isin, currency, hasOffer }) => {
    const { offers, isLoading, noToken } = useBondOffers(isin);

    // Без токена: показываем подсказку только если у бумаги вообще есть оферта
    // (иначе не захламляем страницы ОФЗ и бумаг без оферт).
    if (noToken) {
        if (!hasOffer) return null;
        return (
            <section className={style.wrapper}>
                <div className={style.head}>
                    <h2 className={style.title}>Оферты</h2>
                </div>
                <p className={style.empty}>
                    У бумаги есть оферта. Подключите Т-Банк в разделе «Источники данных»,
                    чтобы видеть даты и цены оферт.
                </p>
            </section>
        );
    }

    if (isLoading) {
        // Скелет только там, где оферта ожидается — иначе блок не нужен.
        if (!hasOffer) return null;
        return <Skeleton.Button active block style={{ height: 140, marginTop: 20 }} />;
    }

    // Токен есть, но оферт нет — блок не показываем.
    if (offers.length === 0) return null;

    const nextOffer = offers.find((o) => o.date >= today());

    const columns: TableProps<IBondOffer>['columns'] = [
        {
            title: 'Дата',
            dataIndex: 'date',
            key: 'date',
            render: (_, offer) => formatDate(offer.date)
        },
        {
            title: 'Тип',
            dataIndex: 'type',
            key: 'type',
            render: (_, offer) => {
                const meta = typeMeta(offer.type);
                return meta ? (
                    <Tag color={meta.color} bordered={false} title={meta.hint}>
                        {meta.label}
                    </Tag>
                ) : (
                    '—'
                );
            }
        },
        {
            title: 'Цена выкупа',
            dataIndex: 'price',
            key: 'price',
            align: 'right',
            render: (_, offer) =>
                offer.price === null ? '—' : formatMoney(offer.price, offer.currency ?? currency)
        },
        {
            title: 'Фиксация',
            dataIndex: 'fixDate',
            key: 'fixDate',
            align: 'right',
            render: (_, offer) => (offer.fixDate ? formatDate(offer.fixDate) : '—')
        }
    ];

    return (
        <section className={style.wrapper}>
            <div className={style.head}>
                <h2 className={style.title}>Оферты</h2>
                {nextOffer && (
                    <span className={style.next}>
                        Ближайшая: {formatDate(nextOffer.date)}
                        {typeMeta(nextOffer.type) ? ` · ${typeMeta(nextOffer.type)!.label}` : ''}
                    </span>
                )}
            </div>

            <Table<IBondOffer>
                columns={columns}
                dataSource={offers}
                rowKey={(offer) => `${offer.date}-${offer.type}`}
                size='middle'
                scroll={{ x: 'max-content' }}
                pagination={false}
                rowClassName={(offer) =>
                    nextOffer && offer.date === nextOffer.date ? style.highlight : ''
                }
            />
        </section>
    );
};
export default Offers;
