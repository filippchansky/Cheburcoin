/** Сырой ответ MOEX ISS по фьючерсам (борд FORTS) — тот же «колоночный» формат, что у акций/индексов. */
export interface IFuturesRaw {
    securities: { columns: string[]; data: unknown[][] };
    marketdata: { columns: string[]; data: unknown[][] };
}

/**
 * Смысловая группа фьючерса по базовому активу. MOEX её отдельным полем не отдаёт —
 * выводим из ASSETCODE и названия (см. futureGroup.ts). 'currency' — валютные,
 * 'index' — на индексы, 'commodity' — товарные (нефть/газ/металлы/сельхоз),
 * 'stock' — на отдельные акции (самая большая группа, дефолт), 'rate' — процентные
 * ставки и облигационные индексы, 'crypto' — на криптовалюту.
 */
export type FutureGroup = 'currency' | 'index' | 'commodity' | 'stock' | 'rate' | 'crypto';

export interface IFuture {
    id: string;
    /** Код контракта (SECID), напр. «BRV6», «USDRUBF». */
    secid: string;
    /** Короткое имя (SHORTNAME), напр. «BR-10.26». */
    shortName: string;
    /** Полное описательное имя (SECNAME). */
    name: string;
    /** Код базового актива (ASSETCODE), напр. «BR» — объединяет все серии одного актива. */
    assetCode: string;

    /** Смысловая группа (выведена из ASSETCODE/названия). */
    group: FutureGroup;
    /** Вечный (бессрочный) фьючерс — торгуется непрерывно без экспирации серий. */
    isPerpetual: boolean;

    /** Последняя цена (LAST, вне торгов — LASTSETTLEPRICE). null — не торгуется. */
    last: number | null;
    /** Изменение за день, % к предыдущей цене (LASTTOPREVPRICE). */
    dayChangePercent: number;
    /** Открытый интерес — число открытых позиций (OPENPOSITION), мера ликвидности. */
    openPosition: number;
    /** Объём торгов за день, контрактов (VOLTODAY). */
    volToday: number;
    /** Оборот за день, ₽ (VALTODAY). */
    valToday: number;
    /** Число сделок за день (NUMTRADES). */
    numTrades: number;

    /** Дата исполнения контракта (LASTTRADEDATE), ISO. Для вечных — очень далёкая. */
    expiry: string;
    /** Объём лота — сколько единиц базового актива в одном контракте (LOTVOLUME). */
    lot: number;
    /** Минимальный шаг цены (MINSTEP). */
    minStep: number;
    /** Стоимость шага цены, ₽ (STEPPRICE) — цена одного минимального шага. */
    stepPrice: number;
    /** Гарантийное обеспечение — залог под один контракт, ₽ (INITIALMARGIN). */
    initialMargin: number;
    /** Число знаков после запятой для форматирования цены (DECIMALS). */
    decimals: number;
}
