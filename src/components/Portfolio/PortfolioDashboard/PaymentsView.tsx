'use client';
import React from 'react';
import { Segmented } from 'antd';
import { AccountPortfolio } from '@/hooks/usePortfolio';
import { PaymentsTab, usePortfolioPrefs } from '@/store/portfolioPrefs';
import PaymentsCalendar from './PaymentsCalendar';
import PaymentsHistory from './PaymentsHistory';

interface PaymentsViewProps {
    /** Счета портфеля — источник позиций для календаря и фильтра по счетам. */
    accounts: AccountPortfolio[];
}

/** Вкладка «Выплаты»: будущее (календарь купонов+дивидендов) vs прошлое (история). */
const PaymentsView: React.FC<PaymentsViewProps> = ({ accounts }) => {
    const tab = usePortfolioPrefs((s) => s.paymentsTab);
    const setTab = usePortfolioPrefs((s) => s.setPaymentsTab);

    return (
        <div>
            <div className='mb-4'>
                <Segmented<PaymentsTab>
                    options={[
                        { label: 'Календарь выплат', value: 'calendar' },
                        { label: 'История выплат', value: 'history' }
                    ]}
                    value={tab}
                    onChange={setTab}
                />
            </div>

            {tab === 'calendar' ? (
                <PaymentsCalendar accounts={accounts} />
            ) : (
                <PaymentsHistory />
            )}
        </div>
    );
};
export default PaymentsView;
