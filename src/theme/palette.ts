export interface BrandPalette {
    /** Акцентный цвет бренда (кнопки, ссылки, активная навигация). */
    primary: string;
    /** Фон всей страницы. */
    layoutBg: string;
    /** Фон шапки. */
    headerBg: string;
    /** Фон карточек/контейнеров. */
    containerBg: string;
    /** Цвет разделителей и границ. */
    border: string;
    /** Приглушённый текст (подписи, вторичное). */
    textMuted: string;
}

export const lightPalette: BrandPalette = {
    primary: '#635BFF',
    layoutBg: '#F5F6F8',
    headerBg: '#FFFFFF',
    containerBg: '#FFFFFF',
    border: '#EAEBEF',
    textMuted: '#6B7280'
};

export const darkPalette: BrandPalette = {
    primary: '#7C74FF',
    layoutBg: '#0F1013',
    headerBg: '#17181C',
    containerBg: '#17181C',
    border: '#26272B',
    textMuted: '#8A8F98'
};

export const getPalette = (dark: boolean): BrandPalette => (dark ? darkPalette : lightPalette);
