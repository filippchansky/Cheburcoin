'use client';
import React, { useMemo, useState } from 'react';
import { InputNumber, Slider, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { IBond } from '@models/bond';
import { formatMoney } from '@/utils/formatCurrency';
import { currencySymbol } from '@/utils/currencyRegistry';
import { calcBondInvestment } from '@/utils/bondCalc';
import style from './style.module.scss';

interface BondCalculatorProps {
    bond: IBond;
    /**
     * Встроен в панель (sticky-колонка или шторка): уже вёрстка, без своего
     * заголовка — его рисует контейнер.
     */
    compact?: boolean;
}

const PRESETS = [10_000, 50_000, 100_000, 500_000];
const SLIDER_MAX = 1_000_000;
const SLIDER_STEP = 5_000;

const BondCalculator: React.FC<BondCalculatorProps> = ({ bond, compact }) => {
    const [amount, setAmount] = useState<number>(100_000);
    const rootClass = `${style.calc} ${compact ? style.compact : ''}`;

    const result = useMemo(() => calcBondInvestment(bond, amount), [bond, amount]);
    const money = (value: number) => formatMoney(value, bond.currency);
    const symbol = currencySymbol(bond.currency);

    if (result === null) {
        return (
            <section className={rootClass}>
                {!compact && <h2 className={style.title}>Калькулятор</h2>}
                <p className={style.empty}>
                    Облигация сейчас не торгуется — рыночной цены нет, расчёт недоступен.
                </p>
            </section>
        );
    }

    const isFloating = result.couponPerYear === null;

    const tiles: { label: string; value: React.ReactNode; accent?: boolean; hint?: string }[] = [
        { label: 'Облигаций в пакете', value: `${result.quantity} шт` },
        { label: 'Вложено (с НКД)', value: money(result.invested) },
        {
            label: 'Купон в месяц',
            value: result.couponPerMonth === null ? '—' : money(result.couponPerMonth)
        },
        {
            label: 'Купон в год',
            value: result.couponPerYear === null ? '—' : money(result.couponPerYear)
        },
        {
            label: 'Доход к погашению',
            value: result.profitToMaturity === null ? '—' : money(result.profitToMaturity),
            accent: result.profitToMaturity !== null && result.profitToMaturity > 0
        },
        {
            label: 'Доходность к погашению',
            value: result.ytm === null ? '—' : `${result.ytm.toFixed(2)}%`,
            hint: 'Эффективная доходность к погашению по данным MOEX: предполагает реинвестирование купонов под ту же ставку. Доход в деньгах выше считается без реинвестирования.'
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
                {isFloating
                    ? 'У облигации плавающий купон — будущие выплаты неизвестны, поэтому купонный доход и доход к погашению не рассчитываются.'
                    : 'Расчёт ориентировочный: без реинвестирования купонов, налогов и брокерских комиссий; доход к погашению считается при удержании до даты погашения.'}
            </p>
        </section>
    );
};
export default BondCalculator;
