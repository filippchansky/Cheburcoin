'use client';
import React, { useMemo, useState } from 'react';
import { InputNumber, Slider, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { IShareDetail } from '@models/shareDetail';
import { formatMoney, intToGrouped } from '@/utils/formatCurrency';
import { currencySymbol } from '@/utils/currencyRegistry';
import { calcSharePosition } from '@/utils/shareCalc';
import style from './style.module.scss';

interface ShareCalculatorProps {
    share: IShareDetail;
    /** Дивиденды на акцию за последние 12 мес (для прогноза потока). */
    annualDivPerShare: number;
    /**
     * Встроен в панель (sticky-колонка или шторка): уже вёрстка, без своего
     * заголовка — его рисует контейнер.
     */
    compact?: boolean;
}

const PRESETS = [10_000, 50_000, 100_000, 500_000];
const SLIDER_MAX = 1_000_000;
const SLIDER_STEP = 5_000;

const ShareCalculator: React.FC<ShareCalculatorProps> = ({
    share,
    annualDivPerShare,
    compact
}) => {
    const [amount, setAmount] = useState<number>(100_000);
    const rootClass = `${style.calc} ${compact ? style.compact : ''}`;

    const result = useMemo(
        () => calcSharePosition(amount, share.price, share.lotSize, annualDivPerShare),
        [amount, share.price, share.lotSize, annualDivPerShare]
    );
    const money = (value: number) => formatMoney(value, share.currency);
    const symbol = currencySymbol(share.currency);

    if (result === null) {
        return (
            <section className={rootClass}>
                {!compact && <h2 className={style.title}>Калькулятор</h2>}
                <p className={style.empty}>
                    Акция сейчас не торгуется — рыночной цены нет, расчёт недоступен.
                </p>
            </section>
        );
    }

    const noDividends = annualDivPerShare <= 0;

    const tiles: { label: string; value: React.ReactNode; accent?: boolean; hint?: string }[] = [
        {
            label: 'Куплю акций',
            value: `${intToGrouped(result.quantity)} шт`,
            hint:
                share.lotSize && share.lotSize > 1
                    ? `Лот — ${share.lotSize} шт, покупка целыми лотами (${intToGrouped(result.lots)} лот.).`
                    : undefined
        },
        { label: 'Вложено', value: money(result.invested) },
        {
            label: 'Дивиденды в год',
            value: noDividends ? '—' : money(result.annualDividends),
            accent: !noDividends && result.annualDividends > 0
        },
        {
            label: 'Дивдоходность',
            value: result.dividendYield === null ? '—' : `${result.dividendYield.toFixed(2)}%`,
            hint: 'По выплатам за последние 12 месяцев относительно текущей цены.'
        }
    ];

    return (
        <section className={rootClass}>
            {!compact && <h2 className={style.title}>Калькулятор</h2>}

            <div className={style.controls}>
                <label className={style.field}>
                    <span className={style.fieldLabel}>Сумма вложения</span>
                    <InputNumber
                        className={style.input}
                        value={amount}
                        min={0}
                        step={1000}
                        controls={false}
                        addonAfter={symbol}
                        formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                        parser={(value) => Number((value ?? '').replace(/\s/g, '')) || 0}
                        onChange={(value) => setAmount(value ?? 0)}
                    />
                </label>
                <div className={style.presets}>
                    {PRESETS.map((preset) => (
                        <button
                            key={preset}
                            type='button'
                            className={style.preset}
                            onClick={() => setAmount(preset)}
                        >
                            {preset.toLocaleString('ru-RU')}
                        </button>
                    ))}
                </div>
            </div>

            <Slider
                className={style.slider}
                value={Math.min(amount, SLIDER_MAX)}
                min={0}
                max={SLIDER_MAX}
                step={SLIDER_STEP}
                onChange={setAmount}
                tooltip={{ formatter: (value) => `${(value ?? 0).toLocaleString('ru-RU')} ${symbol}` }}
            />

            <div className={style.results}>
                {tiles.map((tile) => (
                    <div key={tile.label} className={style.tile}>
                        <span className={style.tileLabel}>
                            {tile.label}
                            {tile.hint && (
                                <Tooltip title={tile.hint}>
                                    <InfoCircleOutlined className={style.hint} />
                                </Tooltip>
                            )}
                        </span>
                        <span className={`${style.tileValue} ${tile.accent ? style.accent : ''}`}>
                            {tile.value}
                        </span>
                    </div>
                ))}
            </div>

            <p className={style.note}>
                {noDividends
                    ? 'Компания не платила дивиденды за последний год — прогноз дивидендного потока недоступен. Расчёт без учёта комиссий и налогов.'
                    : 'Прогноз дивидендов ориентировочный: по выплатам за последние 12 месяцев, без гарантии их повторения, без учёта налогов и комиссий.'}
            </p>
        </section>
    );
};
export default ShareCalculator;
