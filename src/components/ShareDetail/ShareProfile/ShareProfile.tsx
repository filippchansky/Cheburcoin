'use client';
import React from 'react';
import { Tag, Tooltip } from 'antd';
import { CheckCircleFilled, CloseCircleOutlined } from '@ant-design/icons';
import { IShareDetail, IShareIndex } from '@models/shareDetail';
import { formatDate } from '@/utils/dateUtils';
import { formatMoney, intToGrouped } from '@/utils/formatCurrency';
import style from './style.module.scss';

interface ShareProfileProps {
    share: IShareDetail;
    indices: IShareIndex[];
}

const Session: React.FC<{ label: string; on: boolean }> = ({ label, on }) => (
    <span className={`${style.session} ${on ? style.on : style.off}`}>
        {on ? <CheckCircleFilled /> : <CloseCircleOutlined />} {label}
    </span>
);

const ShareProfile: React.FC<ShareProfileProps> = ({ share, indices }) => {
    const rows: { label: string; value: React.ReactNode }[] = [
        { label: 'Полное название', value: share.fullName || '—' },
        { label: 'Тикер', value: share.ticker },
        { label: 'ISIN', value: share.isin || '—' },
        { label: 'Рег. номер', value: share.regNumber || '—' },
        { label: 'Тип бумаги', value: share.typeName || '—' },
        { label: 'Дата выпуска', value: formatDate(share.issueDate) },
        {
            label: 'Размер выпуска',
            value: share.issueSize === null ? '—' : `${intToGrouped(share.issueSize)} шт`
        },
        {
            label: 'Номинал',
            value: share.faceValue === null ? '—' : formatMoney(share.faceValue, share.faceUnit)
        },
        { label: 'Размер лота', value: share.lotSize === null ? '—' : `${share.lotSize} шт` },
        {
            label: 'Уровень листинга',
            value: share.listLevel === null ? '—' : `${share.listLevel} уровень`
        }
    ];

    return (
        <section className={style.wrapper}>
            <h2 className={style.title}>О бумаге</h2>

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
                    <Session label='Утренняя' on={share.morningSession} />
                    <Session label='Вечерняя' on={share.eveningSession} />
                    <Session label='Выходного дня' on={share.weekendSession} />
                </div>
            </div>

            {indices.length > 0 && (
                <div className={style.block}>
                    <span className={style.blockLabel}>Входит в индексы ({indices.length})</span>
                    <div className={style.indices}>
                        {indices.map((index) => (
                            <Tooltip key={index.id} title={index.id}>
                                <Tag bordered={false} className={style.indexTag}>
                                    {index.name}
                                </Tag>
                            </Tooltip>
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
};
export default ShareProfile;
