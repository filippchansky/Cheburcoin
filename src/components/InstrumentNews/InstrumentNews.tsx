'use client';
import React, { useState } from 'react';
import { Skeleton, Modal, Drawer, Grid, theme } from 'antd';
import { LikeOutlined, MessageOutlined, ExportOutlined } from '@ant-design/icons';
import { useInstrumentNews } from '@/hooks/useInstrumentNews';
import { formatTimeAgo } from '@/utils/dateUtils';
import type { IInstrumentNewsItem } from '@models/instrumentNews';
import type { GlobalToken } from 'antd';
import style from './style.module.scss';

interface InstrumentNewsProps {
    /** Тикер акции или SECID облигации — эндпоинт Пульса один и тот же. */
    ticker: string;
}

/** Сколько постов показываем до нажатия «Показать ещё». */
const COLLAPSED = 5;
const MAX = 20;

/** Полная дата поста для оверлея: «27 авг. 2026, 14:42». Битая → пусто. */
const fullDate = (iso: string | null): string => {
    if (!iso) return '';
    const d = new Date(iso);
    return Number.isNaN(d.getTime())
        ? ''
        : d.toLocaleString('ru-RU', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
          });
};

/** Заголовок оверлея: автор + полная дата (общий для Modal и Drawer). */
const PostHeader: React.FC<{ item: IInstrumentNewsItem; token: GlobalToken }> = ({
    item,
    token
}) => (
    <div className={style.modalHead} style={{ color: token.colorText }}>
        <span className={style.modalAuthor}>{item.author ?? 'Пульс'}</span>
        <span className={style.modalDate} style={{ color: token.colorTextTertiary }}>
            {fullDate(item.date)}
        </span>
    </div>
);

/**
 * Тело оверлея: полный текст поста + футер (лайки/комменты + ссылка на Пульс).
 * Общее для Modal (десктоп) и Drawer-шторки (мобилка). ВАЖНО: оба рендерятся
 * порталом в body — мимо тёмной темы; цвета берём из токена, не из inherit.
 */
const PostBody: React.FC<{ item: IInstrumentNewsItem; token: GlobalToken }> = ({
    item,
    token
}) => (
    <div style={{ color: token.colorText }}>
        <p className={style.modalText}>{item.text}</p>
        <div className={style.modalFoot} style={{ borderColor: token.colorBorderSecondary }}>
            <span className={style.modalStats} style={{ color: token.colorTextTertiary }}>
                <LikeOutlined /> {item.likes}
                <MessageOutlined className={style.statIcon} /> {item.comments}
            </span>
            {item.url && (
                <a
                    className={style.modalLink}
                    href={item.url}
                    target='_blank'
                    rel='noopener noreferrer'
                    style={{ color: token.colorPrimary }}
                >
                    Открыть в Пульсе <ExportOutlined />
                </a>
            )}
        </div>
    </div>
);

const NewsRow: React.FC<{ item: IInstrumentNewsItem; onOpen: () => void }> = ({
    item,
    onOpen
}) => (
    <button type='button' className={style.row} onClick={onOpen}>
        <div className={style.rowMeta}>
            {item.author && <span className={style.author}>{item.author}</span>}
            {item.date && (
                <>
                    <span className={style.dot} />
                    <time className={style.time}>{formatTimeAgo(item.date)}</time>
                </>
            )}
            <span className={style.stats}>
                <LikeOutlined /> {item.likes}
                <MessageOutlined className={style.statIcon} /> {item.comments}
            </span>
        </div>
        <p className={style.text}>{item.text}</p>
    </button>
);

/**
 * Лента Пульса по инструменту (акция или облигация). Источник — соцсеть Т-Банка:
 * обсуждения и аналитика инвесторов, а не новостной wire; честно подписываем.
 * Публичная — видна без подключения Т-Банка. Клик по посту открывает полный
 * текст (он приходит в ответе целиком) БЕЗ ухода на сайт Пульса: на десктопе —
 * центральная модалка, на мобилке — шторка снизу (bottom sheet) как в нативных
 * приложениях. Ссылка «Открыть в Пульсе» остаётся в оверлее для комментов/картинок.
 */
const InstrumentNews: React.FC<InstrumentNewsProps> = ({ ticker }) => {
    const { data = [], isLoading, isError } = useInstrumentNews(ticker);
    const [expanded, setExpanded] = useState(false);
    const [active, setActive] = useState<IInstrumentNewsItem | null>(null);
    const { token } = theme.useToken();
    const screens = Grid.useBreakpoint();
    // md-брейкпоинт antd = 768px; ниже — мобильная шторка (как в остальном проекте).
    const isMobile = !screens.md;

    // Ошибку/пустоту не показываем шумным блоком — просто скрываем секцию.
    if (isError || (!isLoading && data.length === 0)) return null;

    const shown = expanded ? data.slice(0, MAX) : data.slice(0, COLLAPSED);
    const close = () => setActive(null);

    return (
        <section className={style.wrapper}>
            <div className={style.head}>
                <h2 className={style.title}>Обсуждения в Пульсе</h2>
                <span className={style.sub}>Соцсеть инвесторов Т-Банка</span>
            </div>

            {isLoading ? (
                <div className={style.list}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton active key={i} paragraph={{ rows: 2 }} title={false} />
                    ))}
                </div>
            ) : (
                <>
                    <div className={style.list}>
                        {shown.map((item) => (
                            <NewsRow key={item.id} item={item} onOpen={() => setActive(item)} />
                        ))}
                    </div>
                    {!expanded && data.length > COLLAPSED && (
                        <button className={style.more} onClick={() => setExpanded(true)}>
                            Показать ещё
                        </button>
                    )}
                </>
            )}

            {isMobile ? (
                <Drawer
                    open={active !== null}
                    onClose={close}
                    placement='bottom'
                    height='auto'
                    title={active && <PostHeader item={active} token={token} />}
                    styles={{
                        content: {
                            borderTopLeftRadius: 16,
                            borderTopRightRadius: 16
                        },
                        body: { paddingTop: 12 }
                    }}
                >
                    {active && <PostBody item={active} token={token} />}
                </Drawer>
            ) : (
                <Modal
                    open={active !== null}
                    onCancel={close}
                    footer={null}
                    width={640}
                    title={active && <PostHeader item={active} token={token} />}
                >
                    {active && <PostBody item={active} token={token} />}
                </Modal>
            )}
        </section>
    );
};

export default InstrumentNews;
