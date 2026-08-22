'use client';
import React from 'react';
import { Button, Collapse, Spin, Tag } from 'antd';
import {
    ApiOutlined,
    BankOutlined,
    CheckCircleFilled,
    WalletOutlined
} from '@ant-design/icons';
import { useTbank } from '@/hooks/useTbank';
import { useTrezor } from '@/hooks/useTrezor';
import { useBybit } from '@/hooks/useBybit';
import TbankPanel from './TbankPanel';
import WalletPanel from './WalletPanel';
import BybitPanel from './BybitPanel';

interface SourcesConnectProps {
    /** Режим настроек: показывает кнопку «Готово» для возврата к дашборду. */
    onClose?: () => void;
}

/** Строка-заголовок источника: иконка + название + подпись. */
const SourceHeader: React.FC<{
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    connected: boolean;
}> = ({ icon, title, subtitle, connected }) => (
    <div className='flex items-center gap-3'>
        <span
            className='flex items-center justify-center rounded-lg'
            style={{
                width: 34,
                height: 34,
                fontSize: 18,
                background: connected ? 'var(--ant-color-primary-bg, #e6f4ff)' : 'transparent',
                color: connected ? 'var(--ant-color-primary, #1677ff)' : undefined
            }}
        >
            {icon}
        </span>
        <span className='flex flex-col leading-tight'>
            <span className='font-medium'>{title}</span>
            <span className='text-xs opacity-60'>{subtitle}</span>
        </span>
    </div>
);

/** Бейдж статуса подключения. */
const StatusBadge: React.FC<{ connected: boolean }> = ({ connected }) =>
    connected ? (
        <Tag icon={<CheckCircleFilled />} color='success'>
            Подключено
        </Tag>
    ) : (
        <Tag>Не подключено</Tag>
    );

/**
 * Экран «Источники данных» в виде аккордеона: три сворачиваемые строки (брокер,
 * криптокошелёк, криптобиржа) со статусом. Форма раскрывается по клику, открыт
 * один источник за раз. Пришёл на смену трём стопкам full-width карточек.
 */
const SourcesConnect: React.FC<SourcesConnectProps> = ({ onClose }) => {
    const { data: tbank, isLoading: tbankLoading } = useTbank();
    const { data: trezor, isLoading: trezorLoading } = useTrezor();
    const { data: bybit, isLoading: bybitLoading } = useBybit();

    const isLoading = tbankLoading || trezorLoading || bybitLoading;

    const tbankConnected = Boolean(tbank?.token && tbank.accounts.length);
    const walletConnected = Boolean(trezor?.length);
    const bybitConnected = Boolean(bybit?.apiKey && bybit?.apiSecret);

    const [activeKey, setActiveKey] = React.useState<string | undefined>(undefined);
    const touched = React.useRef(false);

    // По умолчанию раскрываем первый ещё не подключённый источник (после загрузки
    // статусов), но не перебиваем выбор пользователя, если он уже кликал.
    React.useEffect(() => {
        if (touched.current || isLoading) return;
        const firstEmpty = !tbankConnected
            ? 'tbank'
            : !walletConnected
              ? 'wallet'
              : !bybitConnected
                ? 'bybit'
                : undefined;
        setActiveKey(firstEmpty);
    }, [isLoading, tbankConnected, walletConnected, bybitConnected]);

    const handleChange = (key: string | string[]) => {
        touched.current = true;
        setActiveKey(Array.isArray(key) ? key[0] : key);
    };

    if (isLoading) {
        return (
            <div className='text-center'>
                <Spin />
            </div>
        );
    }

    const items = [
        {
            key: 'tbank',
            label: (
                <SourceHeader
                    icon={<BankOutlined />}
                    title='Брокерский счёт'
                    subtitle='Т-Банк · по токену API'
                    connected={tbankConnected}
                />
            ),
            extra: <StatusBadge connected={tbankConnected} />,
            children: <TbankPanel onDone={() => setActiveKey(undefined)} />
        },
        {
            key: 'wallet',
            label: (
                <SourceHeader
                    icon={<WalletOutlined />}
                    title='Криптокошелёк'
                    subtitle='по публичному адресу'
                    connected={walletConnected}
                />
            ),
            extra: <StatusBadge connected={walletConnected} />,
            children: <WalletPanel />
        },
        {
            key: 'bybit',
            label: (
                <SourceHeader
                    icon={<ApiOutlined />}
                    title='Криптобиржа'
                    subtitle='Bybit · read-only API'
                    connected={bybitConnected}
                />
            ),
            extra: <StatusBadge connected={bybitConnected} />,
            children: <BybitPanel />
        }
    ];

    return (
        <div className='flex flex-col gap-4'>
            <div className='flex items-center justify-between'>
                <h2 className='text-xl font-medium m-0'>Источники данных</h2>
                {onClose && <Button onClick={onClose}>Готово</Button>}
            </div>
            <p className='text-sm opacity-70 m-0'>
                Подключите счета и кошельки — они соберутся в один портфель.
            </p>
            <Collapse
                accordion
                activeKey={activeKey}
                onChange={handleChange}
                expandIconPosition='end'
                items={items}
            />
        </div>
    );
};

export default SourcesConnect;
