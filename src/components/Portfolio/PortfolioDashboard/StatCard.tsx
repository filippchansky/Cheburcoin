'use client';
import React from 'react';

export type StatTone = 'up' | 'down' | 'neutral';

export interface StatCardProps {
    label: string;
    value: string;
    sub?: string;
    tone?: StatTone;
    bg: string;
    border: string;
    muted: string;
}

/** KPI-плитка дашборда: подпись, крупное значение, опциональная строка снизу. */
const StatCard: React.FC<StatCardProps> = ({ label, value, sub, tone = 'neutral', bg, border, muted }) => {
    const color = tone === 'up' ? '#1baf7a' : tone === 'down' ? '#e24b4a' : 'inherit';
    return (
        <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ fontSize: 13, color: muted, marginBottom: 6 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1.2, color }}>{value}</div>
            {sub ? <div style={{ fontSize: 13, color, marginTop: 2 }}>{sub}</div> : null}
        </div>
    );
};

export default StatCard;
