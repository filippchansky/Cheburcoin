'use client';
import React from 'react';
import { Segmented } from 'antd';
import { IPosition } from '@models/tinkoffData';
import CouponCalendar from './CouponCalendar';
import PaymentsHistory from './PaymentsHistory';

type PaymentsTab = 'calendar' | 'history';

interface PaymentsViewProps {
    /** Облигационные позиции для календаря будущих купонов (агрегат по счетам). */
    bondPositions: IPosition[];
}

/** Вкладка «Выплаты»: будущее (календарь купонов) vs прошлое (история выплат). */
const PaymentsView: React.FC<PaymentsViewProps> = ({ bondPositions }) => {
    const [tab, setTab] = React.useState<PaymentsTab>('calendar');

    return (
        <div>
            <div className='mb-4'>
                <Segmented<PaymentsTab>
                    options={[
                        { label: 'Календарь купонов', value: 'calendar' },
                        { label: 'История выплат', value: 'history' }
                    ]}
                    value={tab}
                    onChange={setTab}
                />
            </div>

            {tab === 'calendar' ? (
                <CouponCalendar bondPositions={bondPositions} />
            ) : (
                <PaymentsHistory />
            )}
        </div>
    );
};
export default PaymentsView;
