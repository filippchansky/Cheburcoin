'use client';
import React from 'react';
import { IIndex } from '@models/marketIndex';
import { INDEX_GROUP_LABEL } from '@api/moex/indices/indexGroup';
import style from './style.module.scss';

interface IndexProfileProps {
    index: IIndex;
}

/** Пояснение типа расчёта — простыми словами, чем ценовой индекс отличается от полного. */
const RETURN_TYPE_HINT: Record<IIndex['returnType'], string> = {
    price: 'Ценовой индекс: отражает только изменение цен бумаг корзины, без учёта дивидендов и купонов.',
    total: 'Индекс полной доходности: учитывает не только цены, но и реинвестирование дивидендов/купонов — честнее показывает доход инвестора.'
};

/** Форматирование значения индекса с его числом знаков. */
const formatValue = (value: number | null, decimals: number) =>
    value === null
        ? '—'
        : value.toLocaleString('ru-RU', {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals
          });

const IndexProfile: React.FC<IndexProfileProps> = ({ index }) => {
    const rows: { label: string; value: React.ReactNode }[] = [
        { label: 'Код (SECID)', value: index.secid },
        { label: 'Группа', value: INDEX_GROUP_LABEL[index.group] },
        {
            label: 'Тип расчёта',
            value: index.returnType === 'total' ? 'Полной доходности' : 'Ценовой'
        },
        { label: 'Валюта', value: index.currency },
        {
            label: 'Годовой максимум',
            value: formatValue(index.annualHigh, index.decimals)
        },
        {
            label: 'Годовой минимум',
            value: formatValue(index.annualLow, index.decimals)
        }
    ];

    return (
        <section className={style.wrapper}>
            {index.name && index.name !== index.shortName && (
                <p className={style.fullName}>{index.name}</p>
            )}
            <p className={style.hint}>{RETURN_TYPE_HINT[index.returnType]}</p>
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
export default IndexProfile;
