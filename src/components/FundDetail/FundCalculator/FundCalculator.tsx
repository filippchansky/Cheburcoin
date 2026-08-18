'use client';
import React, { useMemo, useState } from 'react';
import { InputNumber, Slider, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { IFundDetail } from '@models/fundDetail';
import { formatMoney, intToGrouped } from '@/utils/formatCurrency';
import { currencySymbol } from '@/utils/currencyRegistry';
import { calcFundPosition, pluralPai } from '@/utils/fundCalc';
import style from './style.module.scss';

interface FundCalculatorProps {
    fund: IFundDetail;
}

const PRESETS = [10_000, 50_000, 100_000, 500_000];
const SLIDER_MAX = 1_000_000;
const SLIDER_STEP = 5_000;

const FundCalculator: React.FC<FundCalculatorProps> = ({ fund }) => {
    const [amount, setAmount] = useState<number>(100_000);

    const result = useMemo(
        () => calcFundPosition(amount, fund.price, fund.lotSize),
        [amount, fund.price, fund.lotSize]
    );
    const money = (value: number) => formatMoney(value, fund.currency);
    const symbol = currencySymbol(fund.currency);

    if (result === null) {
        return (
            <section className={style.calc}>
                <h2 className={style.title}>Калькулятор</h2>
                <p className={style.empty}>
                    Фонд сейчас не торгуется — рыночной цены нет, расчёт недоступен.
                </p>
            </section>
        );
    }

    const lotSize = fund.lotSize && fund.lotSize > 0 ? fund.lotSize : 1;

    const tiles: { label: string; value: React.ReactNode; accent?: boolean; hint?: string }[] = [
        {
            label: 'Куплю паёв',
            value: `${intToGrouped(result.quantity)} шт`,
            accent: result.quantity > 0,
            hint:
                lotSize > 1
                    ? `Лот — ${lotSize} ${pluralPai(lotSize)}, покупка целыми лотами (${intToGrouped(result.lots)} лот.).`
                    : 'Паи фонда торгуются поштучно (лот — 1 пай).'
        },
        { label: 'Вложено', value: money(result.invested) },
        {
            label: 'Остаток',
            value: money(result.remainder),
            hint: 'Часть суммы, которой не хватило на ещё один целый пай/лот.'
        },
        { label: 'Цена пая', value: money(fund.price ?? 0) }
    ];

    return (
        <section className={style.calc}>
            <h2 className={style.title}>Калькулятор</h2>

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
                Расчёт ориентировочный, без учёта комиссий брокера и управляющей компании.
                Большинство биржевых фондов не выплачивают доход — он реинвестируется и отражается
                в цене пая.
            </p>
        </section>
    );
};
export default FundCalculator;
