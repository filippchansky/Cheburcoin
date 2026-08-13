'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import ReactECharts from 'echarts-for-react';
import { Skeleton } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import { formatMoney, formatPercent } from '@/utils/formatCurrency';
import { MarketMapItem, useMarketMap } from '@/hooks/useMarketOverview';
import style from './style.module.scss';

/** Насыщенность цвета достигает предела при ±CLAMP% дневного изменения. */
const CLAMP = 3;

const NEUTRAL: [number, number, number] = [74, 79, 89]; // #4a4f59 — «около нуля»
const GAIN: [number, number, number] = [33, 163, 102]; // #21a366
const LOSS: [number, number, number] = [207, 59, 57]; // #cf3b39
const DEAD = '#383c44'; // нет сделок сегодня

const rgb = (c: [number, number, number]): string => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

const mix = (
    from: [number, number, number],
    to: [number, number, number],
    t: number
): string => {
    const c = from.map((v, i) => Math.round(v + (to[i] - v) * t));
    return rgb(c as [number, number, number]);
};

/** Градиент легенды строится из тех же опорных цветов, что и плитки. */
const LEGEND_GRADIENT = `linear-gradient(90deg, ${rgb(LOSS)}, ${rgb(NEUTRAL)}, ${rgb(GAIN)})`;

/** Цвет плитки: серый у нуля → зелёный/красный по знаку и величине дневного %. */
const tileColor = (pct: number | null): string => {
    if (pct === null) return DEAD;
    const t = Math.min(Math.abs(pct) / CLAMP, 1);
    return mix(NEUTRAL, pct >= 0 ? GAIN : LOSS, t);
};

interface TreemapNode {
    name: string;
    value: number;
    shortName: string;
    changePct: number | null;
    last: number | null;
    itemStyle: { color: string };
}

const toNode = (item: MarketMapItem): TreemapNode => ({
    name: item.ticker,
    value: item.weight,
    shortName: item.name,
    changePct: item.changePct,
    last: item.last,
    itemStyle: { color: tileColor(item.changePct) }
});

const MarketMap: React.FC = () => {
    const router = useRouter();
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);
    const { data, isLoading, isError } = useMarketMap();

    if (isLoading) {
        return <Skeleton.Node active className={style.mapSkeleton} />;
    }

    if (isError || !data || data.length === 0) {
        return (
            <div className={style.mapPlaceholder}>
                <div className={style.placeholderInner}>
                    <AppstoreOutlined className={style.placeholderIcon} />
                    <span>Не удалось загрузить карту рынка</span>
                </div>
            </div>
        );
    }

    const option = {
        tooltip: {
            formatter: (p: { data?: Partial<TreemapNode> }) => {
                const d = p.data;
                // ECharts зовёт форматтер и для корневого узла treemap — у него наших полей нет.
                if (!d || d.value == null) return '';
                const pct = d.changePct == null ? 'нет сделок' : formatPercent(d.changePct);
                const price = d.last == null ? '' : `<br/>${formatMoney(d.last)}`;
                return `<b>${d.shortName ?? d.name}</b> · ${d.name}<br/>Вес ${d.value.toFixed(2)}% · ${pct}${price}`;
            }
        },
        series: [
            {
                type: 'treemap',
                roam: false,
                nodeClick: false,
                breadcrumb: { show: false },
                width: '100%',
                height: '100%',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                itemStyle: { borderColor: palette.containerBg, gapWidth: 2 },
                emphasis: { itemStyle: { borderColor: palette.primary, borderWidth: 2 } },
                label: {
                    show: true,
                    overflow: 'truncate',
                    formatter: (p: { name?: string; data?: Partial<TreemapNode> }) => {
                        const changePct = p.data?.changePct;
                        const pct = changePct == null ? '' : formatPercent(changePct);
                        return `{t|${p.name ?? ''}}\n{p|${pct}}`;
                    },
                    rich: {
                        t: { fontSize: 12, fontWeight: 'bold', color: '#fff', lineHeight: 15 },
                        p: { fontSize: 10, color: 'rgba(255,255,255,0.82)', lineHeight: 13 }
                    }
                },
                data: data.map(toNode)
            }
        ]
    };

    const onEvents = {
        click: (params: { name?: string; data?: TreemapNode }) => {
            if (params.data?.name) router.push(`/moex/${params.data.name}`);
        }
    };

    return (
        <div className={style.mapWrap}>
            <div className={style.mapChart}>
                <ReactECharts
                    option={option}
                    style={{ height: '100%', width: '100%' }}
                    notMerge
                    lazyUpdate
                    onEvents={onEvents}
                />
            </div>
            <div className={style.mapLegend}>
                <span className={style.mapLegendCaption}>Изменение за день</span>
                <div className={style.mapLegendScale}>
                    <span className={style.mapLegendBar} style={{ background: LEGEND_GRADIENT }} />
                    <div className={style.mapLegendTicks}>
                        <span>−3%</span>
                        <span>0</span>
                        <span>+3%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketMap;
