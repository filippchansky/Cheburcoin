'use client';
import Image from 'next/image';
import React, { useState } from 'react';
import { getShareIcon } from '@api/moex/shares/getShareIcon';
import style from './style.module.scss';

interface ShareLogoProps {
    icon: string;
    ticker: string;
    size?: number;
    /** Прямой URL логотипа (крипта: локальная иконка). Имеет приоритет над icon/BCS. */
    src?: string;
}

/** Логотип бумаги с фолбэком на инициалы тикера, если картинка не загрузилась. */
const ShareLogo: React.FC<ShareLogoProps> = ({ icon, ticker, size = 40, src }) => {
    const [errored, setErrored] = useState(false);

    if ((!icon && !src) || errored) {
        return (
            <div
                className={style.fallback}
                style={{ width: size, height: size, fontSize: size * 0.34 }}
            >
                {ticker.slice(0, 2)}
            </div>
        );
    }

    // Прямой URL (крипта) — обычный <img>, чтобы не заводить хост в next/image.
    if (src) {
        // eslint-disable-next-line @next/next/no-img-element
        return (
            <img
                className={style.logo}
                src={src}
                alt={ticker}
                width={size}
                height={size}
                onError={() => setErrored(true)}
            />
        );
    }

    return (
        <Image
            className={style.logo}
            src={getShareIcon(icon)}
            alt={ticker}
            width={size}
            height={size}
            onError={() => setErrored(true)}
        />
    );
};
export default ShareLogo;
