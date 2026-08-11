'use client';
import React from 'react';
import { CheckCircleFilled, CloseCircleOutlined } from '@ant-design/icons';
import { IFundDetail } from '@models/fundDetail';
import { FUND_CATEGORY_LABEL } from '@api/moex/funds/fundCategory';
import { pluralPai } from '@/utils/fundCalc';
import { formatDate } from '@/utils/dateUtils';
import style from './style.module.scss';

interface FundProfileProps {
    fund: IFundDetail;
}

const Session: React.FC<{ label: string; on: boolean }> = ({ label, on }) => (
    <span className={`${style.session} ${on ? style.on : style.off}`}>
        {on ? <CheckCircleFilled /> : <CloseCircleOutlined />} {label}
    </span>
);

const FundProfile: React.FC<FundProfileProps> = ({ fund }) => {
    const rows: { label: string; value: React.ReactNode }[] = [
        { label: 'Полное название', value: fund.fullName || '—' },
        { label: 'Тикер', value: fund.ticker },
        { label: 'ISIN', value: fund.isin || '—' },
        { label: 'Рег. номер', value: fund.regNumber || '—' },
        { label: 'Тип бумаги', value: fund.typeName || '—' },
        { label: 'Класс активов', value: FUND_CATEGORY_LABEL[fund.category] },
        { label: 'Дата регистрации', value: formatDate(fund.issueDate) },
        {
            label: 'Размер лота',
            value: fund.lotSize === null ? '—' : `${fund.lotSize} ${pluralPai(fund.lotSize)}`
        },
        {
            label: 'Уровень листинга',
            value: fund.listLevel === null ? '—' : `${fund.listLevel} уровень`
        },
        { label: 'Валюта торгов', value: fund.currency === 'SUR' ? 'Рубль' : fund.currency }
    ];

    return (
        <section className={style.wrapper}>
            <h2 className={style.title}>О фонде</h2>

            <div className={style.grid}>
                {rows.map((row) => (
                    <div key={row.label} className={style.row}>
                        <span className={style.label}>{row.label}</span>
                        <span className={style.value}>{row.value}</span>
                    </div>
                ))}
            </div>

            <div className={style.block}>
                <span className={style.blockLabel}>Режимы торгов</span>
                <div className={style.sessions}>
                    <Session label='Утренняя' on={fund.morningSession} />
                    <Session label='Вечерняя' on={fund.eveningSession} />
                    <Session label='Выходного дня' on={fund.weekendSession} />
                </div>
            </div>

            <p className={style.note}>
                Стоимость чистых активов (СЧА) и комиссию управляющей компании MOEX в открытых
                данных не публикует — их здесь нет. Смотрите на сайте или в правилах доверительного
                управления фонда.
            </p>
        </section>
    );
};
export default FundProfile;
