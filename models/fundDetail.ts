import { FundCategory } from './fund';

/**
 * Полные данные одного биржевого фонда (БПИФ/ETF): маркетдата борда TQBR + карточка
 * бумаги MOEX. Фонды торгуются на том же борде, что и акции, поэтому набор рыночных
 * полей совпадает — но у фонда НЕТ капитализации/СЧА, номинала и дивидендов
 * (в бесплатном ISS их нет), зато есть категория актива, выведенная из названия.
 */
export interface IFundDetail {
    ticker: string;
    /** Короткое имя (SHORTNAME), напр. «TMOS ETF». */
    shortName: string;
    /** Полное имя фонда (ISSUENAME/NAME), напр. «БПИФ Т-КАПИТАЛ ИНДЕКС МОСБИРЖИ». */
    fullName: string;
    isin: string;
    regNumber: string;
    /** Тип бумаги из карточки (TYPENAME), напр. «Пай биржевого ПИФа». */
    typeName: string;
    /** Категория актива (Акции/Облигации/Денежный рынок/…), выведена из названия. */
    category: FundCategory;

    // Цена и торги
    /** Последняя цена пая (LAST), ₽. null — сегодня не торговался. */
    price: number | null;
    prevPrice: number | null;
    open: number | null;
    dayLow: number | null;
    dayHigh: number | null;
    /** Изменение за день в валюте (LAST − PREVPRICE). */
    dayChange: number;
    /** Изменение за день, % (LASTTOPREVPRICE). */
    dayChangePercent: number;
    bid: number | null;
    offer: number | null;
    /** Спред bid/ask (когда обе котировки есть). */
    spread: number | null;
    /** Средневзвешенная цена за день. */
    waPrice: number | null;

    // Объём торгов сегодня
    /** Оборот за день в деньгах, ₽ (VALTODAY) — мера ликвидности фонда. */
    valueToday: number | null;
    /** Объём за день в паях (VOLTODAY). */
    volumeToday: number | null;
    numTrades: number | null;
    updateTime: string;

    // Параметры бумаги
    currency: string;
    lotSize: number | null;
    listLevel: number | null;
    forQualified: boolean;
    issueDate: string;

    // Режимы торгов
    morningSession: boolean;
    eveningSession: boolean;
    weekendSession: boolean;
}
