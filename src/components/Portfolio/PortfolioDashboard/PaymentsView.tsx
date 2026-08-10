'use client';
import React from 'react';
import { Segmented } from 'antd';
import { IPosition } from '@models/tinkoffData';
import PaymentsCalendar from './PaymentsCalendar';
import PaymentsHistory from './PaymentsHistory';

type PaymentsTab = 'calendar' | 'history';

interface PaymentsViewProps {
    /** Облигационные позиции для календаря будущих купонов (агрегат по счетам). */
    bondPositions: IPosition[];
    /** Акции для календаря будущих дивидендов (агрегат по счетам). */
    sharePositions: IPosition[];
}

/** Вкладка «Выплаты»: будущее (календарь купонов+дивидендов) vs прошлое (история). */
const PaymentsView: React.FC<PaymentsViewProps> = ({ bondPositions, sharePositions }) => {
    const [tab, setTab] = React.useState<PaymentsTab>('calendar');

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
                <PaymentsCalendar bondPositions={bondPositions} sharePositions={sharePositions} />
            ) : (
                <PaymentsHistory />
            )}
        </div>
    );
};
export default PaymentsView;
