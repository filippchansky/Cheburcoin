'use client';
import { useEffect } from 'react';

/**
 * Прячет стартовый splash (#app-splash из layout) после того,
 * как приложение смонтировалось. Сам splash отрисован в серверном
 * HTML, чтобы появиться с первым кадром WebView и закрыть «серую»
 * паузу при запуске PWA.
 */
const SplashHider = () => {
    useEffect(() => {
        const el = document.getElementById('app-splash');
        if (!el) return;
        el.classList.add('app-splash--hidden');
        const timer = window.setTimeout(() => el.remove(), 400);
        return () => window.clearTimeout(timer);
    }, []);

    return null;
};

export default SplashHider;
