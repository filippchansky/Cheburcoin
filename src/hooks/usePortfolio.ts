import { useQueries } from '@tanstack/react-query';
import { getPortfolio } from '@api/tinkoff/getPortfolio/getPortfolio';
import { IAccount, IPortfolio, IPosition } from '@models/tinkoffData';
import { useTbank } from './useTbank';
import { useCryptoPositions } from './useCryptoPositions';

export interface AccountPortfolio {
    account: IAccount;
    portfolio: IPortfolio | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
}

/** Сводка по всем выбранным счетам (для шапки дашборда). */
export interface PortfolioAggregate {
    totalAmountPortfolio: number;
    expectedYieldInt: number;
    dailyYieldInt: number;
    positions: IPosition[];
    /** Стоимость по типам инструментов (share/bond/etf/currency/...). */
    byType: Record<string, number>;
}

export type PortfolioStatus = 'empty' | 'loading' | 'error' | 'ready';

export interface UsePortfolioResult {
    accounts: AccountPortfolio[];
    aggregate: PortfolioAggregate | null;
    status: PortfolioStatus;
    isFetching: boolean;
    refetchAll: () => void;
}

const TYPE_TOTAL_FIELDS: Record<keyof Pick<IPortfolio,
    'totalAmountShares' | 'totalAmountBonds' | 'totalAmountEtf' | 'totalAmountCurrencies' | 'totalAmountFutures' | 'totalAmountCrypto'>, string> = {
    totalAmountShares: 'share',
    totalAmountBonds: 'bond',
    totalAmountEtf: 'etf',
    totalAmountCurrencies: 'currency',
    totalAmountFutures: 'futures',
    totalAmountCrypto: 'crypto'
};

/** id синтетического счёта, под которым крипта Trezor встаёт в список счетов. */
export const TREZOR_ACCOUNT_ID = 'trezor';

const round = (n: number, digits = 2) => Number(n.toFixed(digits));

/** Схлопывает одинаковые инструменты (один и тот же на разных счетах) в одну позицию. */
const mergePositions = (positions: IPosition[]): IPosition[] => {
    const map = new Map<string, IPosition>();
    positions.forEach((pos) => {
        const key = pos.instrumentUid || pos.positionUid || pos.figi;
        const prev = map.get(key);
        if (!prev) {
            map.set(key, { ...pos });
            return;
        }
        const quantity = (prev.quantity ?? 0) + (pos.quantity ?? 0);
        const currentPrice = pos.currentPrice ?? prev.currentPrice;
        const averagePositionPrice = quantity
            ? round(
                  ((prev.averagePositionPrice ?? 0) * (prev.quantity ?? 0) +
                      (pos.averagePositionPrice ?? 0) * (pos.quantity ?? 0)) /
                      quantity,
                  4
              )
            : prev.averagePositionPrice;
        map.set(key, {
            ...prev,
            quantity,
            currentPrice,
            averagePositionPrice,
            priceInPorfolio: round((prev.priceInPorfolio ?? 0) + (pos.priceInPorfolio ?? 0)),
            expectedYieldFifo: round((prev.expectedYieldFifo ?? 0) + (pos.expectedYieldFifo ?? 0)),
            dailyYield: round((prev.dailyYield ?? 0) + (pos.dailyYield ?? 0)),
            expectedYieldPercent: averagePositionPrice
                ? round(((currentPrice - averagePositionPrice) / averagePositionPrice) * 100)
                : 0
        });
    });
    return Array.from(map.values());
};

/**
 * Доменный слой портфеля: тянет портфели по всем выбранным счетам параллельно
 * и сводит их в единую модель + нормализованный статус. Токен НЕ входит в
 * queryKey (иначе светился бы в devtools-кэше); корректность при смене токена
 * обеспечивают мутации useTbank, инвалидирующие ['portfolio'].
 */
export const usePortfolio = (): UsePortfolioResult => {
    const { data: tbank } = useTbank();
    const token = tbank?.token;
    const accounts = tbank?.accounts ?? [];

    const queries = useQueries({
        queries: accounts.map((account) => ({
            queryKey: ['portfolio', account.id],
            queryFn: () => getPortfolio(account.id, token as string),
            enabled: !!token,
            staleTime: 60_000,
            refetchOnWindowFocus: false as const
        }))
    });

    const tbankPortfolios: AccountPortfolio[] = accounts.map((account, index) => {
        const query = queries[index];
        return {
            account,
            portfolio: query?.data,
            isLoading: Boolean(query?.isLoading),
            isError: Boolean(query?.isError),
            refetch: () => query?.refetch()
        };
    });

    // Крипта Trezor как синтетический счёт: собираем псевдо-IPortfolio из позиций
    // (стоимость/дневная доходность уже в ₽) и добавляем в список счетов — тогда
    // агрегат, пончик, таблица и переключатель счёта работают без спец-логики.
    const crypto = useCryptoPositions();
    const cryptoAccount: AccountPortfolio | null = crypto.positions.length
        ? {
              account: { id: TREZOR_ACCOUNT_ID, name: 'Trezor' },
              portfolio: {
                  totalAmountShares: 0,
                  totalAmountBonds: 0,
                  totalAmountEtf: 0,
                  totalAmountCurrencies: 0,
                  totalAmountFutures: 0,
                  totalAmountCrypto: crypto.total,
                  totalAmountOptions: 0,
                  totalAmountSp: 0,
                  totalAmountPortfolio: crypto.total,
                  expectedYield: 0,
                  expectedYieldInt: 0,
                  positions: crypto.positions,
                  accountId: TREZOR_ACCOUNT_ID,
                  virtualPositions: [],
                  dailyYield: crypto.dailyTotal,
                  dailyYieldRelative: 0,
                  name: 'Trezor'
              },
              isLoading: crypto.isLoading,
              isError: crypto.isError,
              refetch: crypto.refetch
          }
        : null;

    const accountPortfolios: AccountPortfolio[] = cryptoAccount
        ? [...tbankPortfolios, cryptoAccount]
        : tbankPortfolios;

    const loaded = accountPortfolios.filter((item) => item.portfolio);

    const aggregate: PortfolioAggregate | null = loaded.length
        ? (() => {
              const acc: PortfolioAggregate = {
                  totalAmountPortfolio: 0,
                  expectedYieldInt: 0,
                  dailyYieldInt: 0,
                  positions: [],
                  byType: {}
              };
              const raw: IPosition[] = [];
              loaded.forEach(({ portfolio }) => {
                  const p = portfolio as IPortfolio;
                  acc.totalAmountPortfolio += p.totalAmountPortfolio ?? 0;
                  acc.expectedYieldInt += p.expectedYieldInt ?? 0;
                  acc.dailyYieldInt += p.dailyYield ?? 0;
                  raw.push(...(p.positions ?? []));
                  (Object.keys(TYPE_TOTAL_FIELDS) as (keyof typeof TYPE_TOTAL_FIELDS)[]).forEach(
                      (field) => {
                          const type = TYPE_TOTAL_FIELDS[field];
                          acc.byType[type] = (acc.byType[type] ?? 0) + (Number(p[field]) || 0);
                      }
                  );
              });
              // Один инструмент на нескольких счетах → одна строка со сложением
              // (иначе одинаковый positionUid ломает ключи таблицы в своде).
              acc.positions = mergePositions(raw);
              return acc;
          })()
        : null;

    // Портфель пуст только если нет НИ одного источника: ни счетов Т-Банка, ни
    // подключённой крипты (Trezor может быть единственным источником).
    const hasCrypto = crypto.positions.length > 0;
    const noSource = (!token || accounts.length === 0) && !hasCrypto;
    const status: PortfolioStatus = noSource
        ? 'empty'
        : accountPortfolios.some((item) => item.isLoading && !item.portfolio)
          ? 'loading'
          : accountPortfolios.length > 0 && accountPortfolios.every((item) => item.isError)
            ? 'error'
            : 'ready';

    return {
        accounts: accountPortfolios,
        aggregate,
        status,
        isFetching: queries.some((query) => query.isFetching) || crypto.isLoading,
        refetchAll: () => {
            queries.forEach((query) => query.refetch());
            crypto.refetch();
        }
    };
};
