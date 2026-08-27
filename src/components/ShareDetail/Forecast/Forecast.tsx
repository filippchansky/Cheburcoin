'use client';
import React from 'react';
import { Skeleton, Tag, Tooltip } from 'antd';
import { useShareForecast } from '@/hooks/useShareDetail';
import { Recommendation } from '@models/shareDetail';
import { formatMoney } from '@/utils/formatCurrency';
import style from './style.module.scss';

interface ForecastProps {
    ticker: string;
    /** Валюта бумаги — на случай, если прогноз её не вернул. */
    currency: string;
}

/** Русская подпись и цвет antd-тега для рекомендации. */
const REC_META: Record<Recommendation, { label: string; color: string }> = {
    BUY: { label: 'Покупать', color: 'green' },
    HOLD: { label: 'Держать', color: 'gold' },
    SELL: { label: 'Продавать', color: 'red' }
};

const recTag = (rec: Recommendation | null) =>
    rec ? (
        <Tag color={REC_META[rec].color} bordered={false}>
            {REC_META[rec].label}
        </Tag>
    ) : (
        <span className={style.muted}>—</span>
    );

/** Потенциал в процентах со знаком и цветом. */
const Potential: React.FC<{ value: number | null }> = ({ value }) => {
    if (value === null) return <span className={style.muted}>—</span>;
    const cls = value > 0 ? style.up : value < 0 ? style.down : '';
    return (
        <span className={cls}>
            {value > 0 ? '+' : ''}
            {value.toFixed(1)}%
        </span>
    );
};

/** Дата ISO → ДД.ММ.ГГГГ. */
const ruDate = (iso: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('ru-RU');
};

const Forecast: React.FC<ForecastProps> = ({ ticker, currency }) => {
    const { forecast, isLoading, noToken } = useShareForecast(ticker);

    if (isLoading) {
        return <Skeleton.Button active block style={{ height: 160, marginTop: 20 }} />;
    }

    if (noToken) {
        return (
            <section className={style.wrapper}>
                <div className={style.head}>
                    <h2 className={style.title}>Прогнозы аналитиков</h2>
                </div>
                <p className={style.empty}>
                    Подключите Т-Банк в разделе «Источники данных», чтобы видеть
                    прогнозы аналитиков по бумаге.
                </p>
            </section>
        );
    }

    if (!forecast || (!forecast.consensus && forecast.targets.length === 0)) return null;

    const c = forecast.consensus;
    const cur = c?.currency ?? currency;
    const votes = c ? c.buy + c.hold + c.sell : 0;

    return (
        <section className={style.wrapper}>
            <div className={style.head}>
                <h2 className={style.title}>Прогнозы аналитиков</h2>
                <span className={style.sub}>по данным Т-Банка</span>
            </div>

            {c && (
                <div className={style.consensus}>
                    <div className={style.consMain}>
                        <span className={style.consLabel}>Консенсус</span>
                        <div className={style.consRec}>
                            {recTag(c.recommendation)}
                            {c.targetPrice !== null && (
                                <span className={style.consTarget}>
                                    {formatMoney(c.targetPrice, cur)}
                                    <span className={style.consPot}>
                                        {' · '}
                                        <Potential value={c.priceChangeRel} />
                                    </span>
                                </span>
                            )}
                        </div>
                        {(c.minTarget !== null || c.maxTarget !== null) && (
                            <span className={style.consRange}>
                                Диапазон: {c.minTarget === null ? '—' : formatMoney(c.minTarget, cur)}
                                {' — '}
                                {c.maxTarget === null ? '—' : formatMoney(c.maxTarget, cur)}
                                {c.prognosisDate && ` · на ${ruDate(c.prognosisDate)}`}
                            </span>
                        )}
                    </div>

                    {votes > 0 && (
                        <div className={style.votes}>
                            <Tooltip title={`Покупать: ${c.buy}`}>
                                <div className={style.voteBar} style={{ flexGrow: c.buy }} data-kind='buy' />
                            </Tooltip>
                            <Tooltip title={`Держать: ${c.hold}`}>
                                <div className={style.voteBar} style={{ flexGrow: c.hold }} data-kind='hold' />
                            </Tooltip>
                            <Tooltip title={`Продавать: ${c.sell}`}>
                                <div className={style.voteBar} style={{ flexGrow: c.sell }} data-kind='sell' />
                            </Tooltip>
                            <span className={style.votesText}>{votes} аналитиков</span>
                        </div>
                    )}
                </div>
            )}

            {forecast.targets.length > 0 && (
                <div className={style.targets}>
                    <div className={`${style.trow} ${style.thead}`}>
                        <span>Аналитик</span>
                        <span>Рекомендация</span>
                        <span className={style.right}>Цель</span>
                        <span className={style.right}>Потенциал</span>
                    </div>
                    {forecast.targets.map((t, i) => (
                        <div key={`${t.company}-${i}`} className={style.trow}>
                            <span className={style.company}>{t.company ?? '—'}</span>
                            <span>{recTag(t.recommendation)}</span>
                            <span className={style.right}>
                                {t.targetPrice === null ? '—' : formatMoney(t.targetPrice, t.currency ?? cur)}
                            </span>
                            <span className={style.right}>
                                <Potential value={t.priceChangeRel} />
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};
export default Forecast;
