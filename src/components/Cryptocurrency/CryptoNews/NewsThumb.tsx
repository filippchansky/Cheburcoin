'use client';
import React, { useState } from 'react';
import style from './style.module.scss';

/**
 * Превью новости: внешняя картинка поверх градиента-заглушки. Если картинка не
 * грузится (хотлинк-защита, битый URL) — прячем `<img>`, остаётся градиент с
 * инициалом источника. Без next/image, чтобы не заводить домены в конфиг.
 */
const NewsThumb: React.FC<{ src: string | null; source: string; className?: string }> = ({
    src,
    source,
    className
}) => {
    const [failed, setFailed] = useState(false);
    const show = src && !failed;

    return (
        <div className={`${style.thumb} ${className ?? ''}`} data-source={source}>
            {show ? (
                <img
                    src={src}
                    alt=''
                    loading='lazy'
                    referrerPolicy='no-referrer'
                    onError={() => setFailed(true)}
                />
            ) : (
                <span className={style.thumbMark}>{source.slice(0, 1)}</span>
            )}
        </div>
    );
};

export default NewsThumb;
