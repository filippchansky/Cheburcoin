import React from 'react';

interface SparklineProps {
    /** Точки цены за 7 дней (в валюте запроса). */
    data: number[];
    width?: number;
    height?: number;
}

/**
 * Лёгкий спарклайн на inline-SVG. Специально без ECharts: в таблице ~100 строк,
 * инстанс графика на каждую строку — дорого. Цвет — по знаку недельного изменения
 * (первая точка → последняя). Тянущийся стек viewBox делает линию адаптивной.
 */
const Sparkline: React.FC<SparklineProps> = ({ data, width = 120, height = 36 }) => {
    if (!data || data.length < 2) return <span style={{ opacity: 0.3 }}>—</span>;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const span = max - min || 1;
    const stepX = width / (data.length - 1);

    // Y инвертируем: в SVG ноль сверху, а бОльшая цена должна быть выше.
    const points = data
        .map((v, i) => `${(i * stepX).toFixed(2)},${(height - ((v - min) / span) * height).toFixed(2)}`)
        .join(' ');

    const up = data[data.length - 1] >= data[0];
    const color = up ? '#00A328' : '#E5484D';

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio='none'
            style={{ display: 'block' }}
        >
            <polyline
                points={points}
                fill='none'
                stroke={color}
                strokeWidth={1.5}
                strokeLinejoin='round'
                strokeLinecap='round'
                vectorEffect='non-scaling-stroke'
            />
        </svg>
    );
};
export default Sparkline;
