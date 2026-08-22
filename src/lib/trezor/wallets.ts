/**
 * Кошельки, из которых можно взять публичный дескриптор для read-only-подключения.
 *
 * Блок подключения крипты кошелёк-агностичен: механика одна (вставить xpub или
 * адрес получения), меняется лишь инструкция «где взять». Переключатель кошельков
 * в WalletPanel подменяет подсказку под конкретный кошелёк; сам список монет
 * (TREZOR_COINS: BTC/ETH/SOL) от выбора кошелька не зависит.
 *
 * `hints[coinKey]` — где взять дескриптор этой монеты в этом кошельке. Если ключа
 * нет, кошелёк эту монету не хранит в подходящем виде — панель покажет общий
 * fallback (см. WalletPanel).
 */
export interface WalletOption {
    /** Внутренний ключ. */
    key: string;
    /** Название для чипа-переключателя. */
    name: string;
    /** Ссылка на приложение кошелька (необязательно). */
    link?: string;
    /** Текст ссылки. */
    linkLabel?: string;
    /** Инструкция «где взять» по ключу монеты (BTC/ETH/SOL). */
    hints: Record<string, string>;
}

export const WALLET_OPTIONS: WalletOption[] = [
    {
        key: 'trezor',
        name: 'Trezor',
        link: 'https://suite.trezor.io',
        linkLabel: 'Открыть Trezor Suite',
        hints: {
            BTC: 'Suite → аккаунт Bitcoin → «Детали аккаунта» → «Показать публичный ключ». Нужен xpub/zpub, не одиночный адрес.',
            ETH: 'Suite → аккаунт Ethereum → адрес получения (0x…).',
            SOL: 'Suite → аккаунт Solana → адрес получения.'
        }
    },
    {
        key: 'ledger',
        name: 'Ledger',
        link: 'https://www.ledger.com/ledger-live',
        linkLabel: 'Открыть Ledger Live',
        hints: {
            BTC: 'Ledger Live → Bitcoin → Receive → Advanced → extended public key (xpub).',
            ETH: 'Ledger Live → Ethereum → Receive → адрес 0x…',
            SOL: 'Ledger Live → Solana → Receive → адрес получения.'
        }
    },
    {
        key: 'metamask',
        name: 'MetaMask',
        link: 'https://metamask.io',
        linkLabel: 'Открыть metamask.io',
        hints: {
            ETH: 'MetaMask → нажмите на адрес аккаунта сверху, чтобы скопировать (0x…).'
        }
    },
    {
        key: 'phantom',
        name: 'Phantom',
        link: 'https://phantom.app',
        linkLabel: 'Открыть phantom.app',
        hints: {
            SOL: 'Phantom → нажмите на имя кошелька, чтобы скопировать адрес.',
            ETH: 'Phantom → переключите сеть на Ethereum → скопируйте адрес 0x…'
        }
    }
];

export const walletByKey = (key: string): WalletOption | undefined =>
    WALLET_OPTIONS.find((w) => w.key === key);
