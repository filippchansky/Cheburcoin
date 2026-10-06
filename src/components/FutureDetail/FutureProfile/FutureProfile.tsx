'use client';
import React from 'react';
import { IFuture } from '@models/marketFuture';
import { FUTURE_GROUP_LABEL } from '@api/moex/futures/futureGroup';
import { intToGrouped, intToRubCompact } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/dateUtils';
import style from './style.module.scss';

interface FutureProfileProps {
    future: IFuture;
}

const FutureProfile: React.FC<FutureProfileProps> = ({ future }) => {
    const rows: { label: string; value: React.ReactNode }[] = [
        { label: 'Код (SECID)', value: future.secid },
        { label: 'Базовый актив', value: future.assetCode },
        { label: 'Группа', value: FUTURE_GROUP_LABEL[future.group] },
        { label: 'Тип', value: future.isPerpetual ? 'Вечный' : 'Серийный' },
        {
            label: 'Экспирация',
            value: future.isPerpetual ? 'нет (вечный)' : formatDate(future.expiry)
        },
        { label: 'Лот', value: intToGrouped(future.lot) },
        { label: 'Минимальный шаг цены', value: String(future.minStep) },
        {
            label: 'Стоимость шага',
            value: `${future.stepPrice.toLocaleString('ru-RU')} ₽`
        }
    ];
    if (future.initialMargin > 0) {
        rows.push({ label: 'Гарантийное обеспечение', value: intToRubCompact(future.initialMargin) });
    }

    return (
        <section className={style.wrapper}>
            {future.name && future.name !== future.shortName && (
                <p className={style.fullName}>{future.name}</p>
            )}
            <p className={style.hint}>
                Фьючерс — контракт на покупку или продажу базового актива в будущем по
                заранее оговорённой цене. Торгуется с плечом: для сделки нужно лишь
                гарантийное обеспечение, а не полная стоимость актива.
            </p>
            <dl className={style.grid}>
                {rows.map((row) => (
                    <div key={row.label} className={style.item}>
                        <dt className={style.term}>{row.label}</dt>
                        <dd className={style.value}>{row.value}</dd>
                    </div>
                ))}
            </dl>
        </section>
    );
};
export default FutureProfile;
