'use client';
import React from 'react';
import Link from 'next/link';
import { Skeleton, Tag, Tooltip } from 'antd';
import { LeftOutlined } from '@ant-design/icons';
import {
    useShareDetail,
    useShareDividends,
    useShareIndices
} from '@/hooks/useShareDetail';
import { useSectors } from '@/hooks/useShares';
import ShareLogo from '@/components/ShareLogo/ShareLogo';
import InstrumentLayout, {
    InstrumentMetric,
    InstrumentTab
} from '@/components/InstrumentLayout/InstrumentLayout';
import { formatMoney, formatPercent, intToCompact, intToRubCompact } from '@/utils/formatCurrency';
import { annualDividendPerShare, dividendYield } from '@/utils/shareCalc';
import PriceRange from './PriceRange/PriceRange';
import Fundamentals from './Fundamentals/Fundamentals';
import Forecast from './Forecast/Forecast';
import ShareChart from './ShareChart/ShareChart';
import Dividends from './Dividends/Dividends';
import ShareCalculator from './ShareCalculator/ShareCalculator';
import ShareProfile from './ShareProfile/ShareProfile';
import InstrumentNews from '@/components/InstrumentNews/InstrumentNews';
import PortfolioPosition from '@/components/PortfolioPosition/PortfolioPosition';
import style from './style.module.scss';

interface ShareDetailProps {
    ticker: string;
}

const listLevelHint = 'Уровень листинга MOEX: 1 — высшая котировальная группа (самые надёжные и ликвидные), 3 — некотировальная часть.';

const ShareDetail: React.FC<ShareDetailProps> = ({ ticker }) => {
    const { data: share, isLoading, isError } = useShareDetail(ticker);
    const {
        dividends,
        yieldByDate,
        isLoading: dividendsLoading,
        noToken: dividendsNoToken
    } = useShareDividends(ticker);
    const { data: indices = [] } = useShareIndices(ticker);
    const { data: sectors } = useSectors();

    if (isLoading) {
        return (
            <div className={style.page}>
                <Skeleton active paragraph={{ rows: 6 }} />
            </div>
        );
    }

    if (isError || !share) {
        return (
            <div className={style.page}>
                <Link href='/moex' className={style.back}>
                    <LeftOutlined /> К списку акций
                </Link>
                <p className={style.notFound}>Акция не найдена или сейчас не торгуется.</p>
            </div>
        );
    }

    const sector = sectors?.[share.ticker];
    const isBlueChip = indices.some((index) => index.id === 'MOEXBC');
    const changeClass =
        share.dayChangePercent > 0 ? style.up : share.dayChangePercent < 0 ? style.down : '';

    const annualDiv = annualDividendPerShare(dividends);
    const divYield = dividendYield(annualDiv, share.price);

    const metrics: InstrumentMetric[] = [
        {
            label: 'Капитализация',
            value: share.capitalization === null ? '—' : intToRubCompact(share.capitalization)
        },
        {
            label: 'Акций в обращении',
            value: share.issueSize === null ? '—' : `${intToCompact(share.issueSize)} шт`
        },
        {
            label: 'Дивдоходность',
            value: divYield === null ? '—' : `${divYield.toFixed(2)}%`,
            hint: 'Годовой дивиденд относительно текущей цены. Берём выплаты за последние 12 месяцев, а вне дивидендного сезона — последнюю годовую выплату. Историческая, не прогноз.'
        },
        {
            label: 'Объём за день',
            value: share.volumeToday === null ? '—' : `${intToCompact(share.volumeToday)} шт`
        },
        {
            label: 'Оборот за день',
            value: share.valueToday === null ? '—' : intToRubCompact(share.valueToday)
        },
        {
            label: 'Сделок за день',
            value: share.numTrades === null ? '—' : intToCompact(share.numTrades)
        },
        {
            label: 'Спред bid / ask',
            value:
                share.bid === null || share.offer === null
                    ? '—'
                    : `${formatMoney(share.bid, share.currency)} / ${formatMoney(share.offer, share.currency)}`,
            hint: 'Лучшие цены покупки (bid) и продажи (offer) в стакане. Прочерк — после закрытия торгов.'
        },
        {
            label: 'Номинал',
            value: share.faceValue === null ? '—' : formatMoney(share.faceValue, share.faceUnit)
        }
    ];

    const priceText = share.price === null ? '—' : formatMoney(share.price, share.currency);
    const changeText = `${share.dayChange > 0 ? '+' : ''}${formatMoney(share.dayChange, share.currency)} · ${formatPercent(share.dayChangePercent)}`;

    // Разделы: «Обзор» отдаёт цену и график сразу, остальное монтируется по клику,
    // так что фундаментал, прогнозы и новости не дёргают Т-Банк на каждом заходе.
    const tabs: InstrumentTab[] = [
        {
            key: 'overview',
            label: 'Обзор',
            children: (
                <>
                    <PortfolioPosition
                        ticker={share.ticker}
                        isin={share.isin}
                        isPreferred={share.isPreferred}
                    />
                    <PriceRange
                        ticker={share.ticker}
                        price={share.price}
                        currency={share.currency}
                    />
                    <ShareChart ticker={share.ticker} />
                </>
            )
        },
        {
            key: 'fundamentals',
            label: 'Фундаментал',
            children: (
                <>
                    <Fundamentals ticker={share.ticker} />
                    <ShareProfile share={share} indices={indices} />
                </>
            )
        },
        {
            key: 'forecast',
            label: 'Прогнозы',
            children: <Forecast ticker={share.ticker} currency={share.currency} />
        },
        {
            key: 'dividends',
            label: 'Дивиденды',
            children: (
                <Dividends
                    dividends={dividends}
                    price={share.price}
                    yieldByDate={yieldByDate}
                    loading={dividendsLoading}
                    noToken={dividendsNoToken}
                />
            )
        },
        {
            key: 'news',
            label: 'Новости',
            children: <InstrumentNews ticker={share.ticker} />
        }
    ];

    return (
        <InstrumentLayout
            backHref='/moex'
            backLabel='К списку акций'
            logo={<ShareLogo icon={share.isin} ticker={share.ticker} size={48} />}
            title={share.shortName}
            subtitle={`${share.ticker} · ${share.isin}`}
            tags={
                <>
                    <Tag color={share.isPreferred ? 'gold' : 'blue'} bordered={false}>
                        {share.isPreferred ? 'Привилегированная' : 'Обыкновенная'}
                    </Tag>
                    {sector && (
                        <Tag color='geekblue' bordered={false}>
                            {sector}
                        </Tag>
                    )}
                    {isBlueChip && (
                        <Tag color='purple' bordered={false}>
                            Голубая фишка
                        </Tag>
                    )}
                    {share.listLevel !== null && (
                        <Tooltip title={listLevelHint}>
                            <Tag bordered={false}>{share.listLevel} ур. листинга</Tag>
                        </Tooltip>
                    )}
                    {share.forQualified && (
                        <Tag color='volcano' bordered={false}>
                            Только для квалов
                        </Tag>
                    )}
                </>
            }
            price={
                <>
                    <span className={style.price}>{priceText}</span>
                    <span className={`${style.change} ${changeClass}`}>{changeText}</span>
                </>
            }
            stickyPrice={
                <>
                    <span className={style.stickyPriceValue}>{priceText}</span>
                    <span className={`${style.stickyChange} ${changeClass}`}>
                        {formatPercent(share.dayChangePercent)}
                    </span>
                </>
            }
            metrics={metrics}
            tabs={tabs}
            aside={{
                title: 'Калькулятор',
                content: <ShareCalculator share={share} annualDivPerShare={annualDiv} compact />
            }}
        />
    );
};
export default ShareDetail;
