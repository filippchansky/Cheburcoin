'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Grid, Tabs, Tooltip, theme } from 'antd';
import { InfoCircleOutlined, LeftOutlined } from '@ant-design/icons';
import { parseAsString, useQueryState } from 'nuqs';
import style from './style.module.scss';

export interface InstrumentMetric {
    label: string;
    value: React.ReactNode;
    hint?: string;
}

export interface InstrumentTab {
    key: string;
    label: string;
    children: React.ReactNode;
}

interface InstrumentLayoutProps {
    /** Ссылка «назад к списку». */
    backHref: string;
    backLabel: string;
    /** Логотип бумаги (у облигаций его нет). */
    logo?: React.ReactNode;
    title: string;
    /** Строка под заголовком: тикер · ISIN. */
    subtitle?: React.ReactNode;
    tags?: React.ReactNode;
    /** Блок цены — вёрстка своя у акции (цена + изменение) и облигации (₽ + %). */
    price: React.ReactNode;
    /** Компактный вариант цены для липкой шапки. По умолчанию — тот же блок. */
    stickyPrice?: React.ReactNode;
    metrics: InstrumentMetric[];
    tabs: InstrumentTab[];
    /** Калькулятор: sticky-колонка на десктопе, отдельная вкладка на узких экранах. */
    aside?: { title: string; content: React.ReactNode };
}

/** Ключ вкладки, под которой калькулятор живёт на узких экранах. */
const ASIDE_TAB_KEY = 'calculator';

/**
 * Каркас страницы бумаги (акция/облигация): шапка с ценой, плитки метрик и
 * разделы во вкладках. Даёт три вещи, которых не было при простом списке блоков:
 *
 * 1. Вкладки монтируются лениво (antd рендерит панель только после первого
 *    открытия) — при заходе на бумагу не улетают запросы за фундаменталом,
 *    прогнозами, купонами и новостями разом.
 * 2. Активная вкладка живёт в query-параметре `tab` (nuqs) — раздел шарится
 *    ссылкой и переживает «назад».
 * 3. Липкая мини-шапка: при прокрутке видно, чью бумагу и по какой цене смотришь.
 */
const InstrumentLayout: React.FC<InstrumentLayoutProps> = ({
    backHref,
    backLabel,
    logo,
    title,
    subtitle,
    tags,
    price,
    stickyPrice,
    metrics,
    tabs,
    aside
}) => {
    const { token } = theme.useToken();
    const screens = Grid.useBreakpoint();
    const [pinned, setPinned] = useState(false);
    const sentinel = useRef<HTMLDivElement>(null);
    const barRef = useRef<HTMLDivElement>(null);
    const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

    // Колонка с калькулятором появляется на той же ширине, что и в стилях (xl = 1200px).
    // Пока её нет — калькулятор становится последней вкладкой.
    const wide = !!screens.xl;
    const items = useMemo<InstrumentTab[]>(
        () =>
            aside && !wide
                ? [...tabs, { key: ASIDE_TAB_KEY, label: aside.title, children: aside.content }]
                : tabs,
        [tabs, aside, wide]
    );

    const [tab, setTab] = useQueryState('tab', parseAsString.withDefault(items[0].key));
    // Чужой/устаревший ключ в URL не должен показывать пустую страницу.
    const activeKey = items.some((item) => item.key === tab) ? tab : items[0].key;

    // Мини-шапку показываем, когда основная уехала под шапку приложения (64px).
    useEffect(() => {
        const node = sentinel.current;
        if (!node || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(
            ([entry]) => setPinned(!entry.isIntersecting),
            { rootMargin: '-72px 0px 0px 0px' }
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    // Вкладка из ссылки может лежать за правым краем полосы — подтягиваем её к центру.
    // Скроллим саму полосу, а не scrollIntoView, чтобы не дёргать страницу по вертикали.
    useEffect(() => {
        const bar = barRef.current;
        const node = tabRefs.current[activeKey];
        if (!bar || !node) return;
        bar.scrollTo({
            left: node.offsetLeft - bar.clientWidth / 2 + node.offsetWidth / 2,
            behavior: 'smooth'
        });
    }, [activeKey]);

    return (
        <div className={style.page}>
            <Link href={backHref} className={style.back}>
                <LeftOutlined /> {backLabel}
            </Link>

            <header className={style.header}>
                <div className={style.titleBlock}>
                    <div className={style.titleRow}>
                        {logo}
                        <div>
                            <h1 className={style.title}>{title}</h1>
                            {subtitle && <span className={style.subtitle}>{subtitle}</span>}
                        </div>
                    </div>
                    {tags && <div className={style.tags}>{tags}</div>}
                </div>
                <div className={style.priceBlock}>{price}</div>
            </header>

            <div ref={sentinel} aria-hidden />

            <div
                className={`${style.stickyBar} ${pinned ? style.pinned : ''}`}
                style={{
                    background: token.colorBgLayout,
                    borderBottom: `1px solid ${token.colorBorderSecondary}`
                }}
                aria-hidden={!pinned}
            >
                <div className={style.stickyInner}>
                    <div className={style.stickyTitle}>
                        {logo}
                        <span className={style.stickyName}>{title}</span>
                    </div>
                    <div className={style.stickyPrice}>{stickyPrice ?? price}</div>
                </div>
            </div>

            <div className={style.metrics}>
                {metrics.map((metric) => (
                    <div key={metric.label} className={style.tile}>
                        <span className={style.tileLabel}>
                            {metric.label}
                            {metric.hint && (
                                <Tooltip title={metric.hint}>
                                    <InfoCircleOutlined className={style.hint} />
                                </Tooltip>
                            )}
                        </span>
                        <span className={style.tileValue}>{metric.value}</span>
                    </div>
                ))}
            </div>

            <div className={style.body}>
                <div className={style.main}>
                    <Tabs
                        activeKey={activeKey}
                        onChange={setTab}
                        // Своя полоса вкладок: на телефоне она просто скроллится пальцем,
                        // без выпадашки «…», в которую antd прячет непоместившиеся разделы.
                        renderTabBar={() => (
                            <div
                                ref={barRef}
                                role="tablist"
                                className={style.tabBar}
                                style={{ borderBottom: `1px solid ${token.colorBorderSecondary}` }}
                            >
                                {items.map((item) => {
                                    const active = item.key === activeKey;
                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            role="tab"
                                            aria-selected={active}
                                            ref={(node) => {
                                                tabRefs.current[item.key] = node;
                                            }}
                                            className={`${style.tabItem} ${active ? style.tabItemActive : ''}`}
                                            style={{
                                                color: active
                                                    ? token.colorPrimary
                                                    : token.colorText,
                                                borderBottomColor: active
                                                    ? token.colorPrimary
                                                    : 'transparent'
                                            }}
                                            onClick={() => setTab(item.key)}
                                        >
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        items={items.map((item) => ({
                            key: item.key,
                            label: item.label,
                            children: <div className={style.pane}>{item.children}</div>
                        }))}
                    />
                </div>

                {aside && (
                    <aside className={style.aside}>
                        <h2 className={style.asideTitle}>{aside.title}</h2>
                        {aside.content}
                    </aside>
                )}
            </div>
        </div>
    );
};
export default InstrumentLayout;
