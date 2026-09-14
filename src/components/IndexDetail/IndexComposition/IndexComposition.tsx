'use client';
import React from 'react';
import { Empty, Skeleton } from 'antd';
import { useIndexComposition } from '@/hooks/useIndices';
import { useDarkTheme } from '@/store/darkTheme';
import { getPalette } from '@/theme/palette';
import style from './style.module.scss';

interface IndexCompositionProps {
    secid: string;
}

/**
 * Состав индекса: бумаги и их веса, отсортированные по убыванию. Вес показан и числом,
 * и полоской-баром (ширина = вес относительно самой крупной позиции). Для индексов без
 * состава (ставки денежного рынка) список пуст — показываем заглушку.
 */
const IndexComposition: React.FC<IndexCompositionProps> = ({ secid }) => {
    const { data: constituents = [], isLoading, isError } = useIndexComposition(secid);
    const { darkTheme } = useDarkTheme();
    const palette = getPalette(darkTheme);

    if (isLoading) {
        return <Skeleton active paragraph={{ rows: 8 }} />;
    }

    if (isError) {
        return <Empty description='Не удалось загрузить состав индекса.' />;
    }

    if (constituents.length === 0) {
        return <Empty description='У этого индекса нет публикуемого состава.' />;
    }

    const maxWeight = constituents[0]?.weight || 1;

    return (
        <section className={style.wrapper}>
            <p className={style.caption}>
                {constituents.length} бумаг · вес на последнюю дату пересмотра
            </p>
            <div className={style.list} style={{ ['--rowBorder' as string]: palette.border }}>
                {constituents.map((item, i) => (
                    <div key={item.ticker} className={style.row}>
                        <span className={style.rank}>{i + 1}</span>
                        <div className={style.main}>
                            <div className={style.nameRow}>
                                <span className={style.ticker}>{item.ticker}</span>
                                <span className={style.name}>{item.name}</span>
                            </div>
                            <div className={style.bar}>
                                <span
                                    className={style.barFill}
                                    style={{
                                        width: `${(item.weight / maxWeight) * 100}%`,
                                        background: palette.primary
                                    }}
                                />
                            </div>
                        </div>
                        <span className={style.weight}>{item.weight.toFixed(2)}%</span>
                    </div>
                ))}
            </div>
        </section>
    );
};
export default IndexComposition;
