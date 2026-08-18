'use client';
import { IFilteredShares } from '@models/filteredShares';
import { Card, Skeleton } from 'antd';
import { RiseOutlined, FallOutlined, CrownOutlined } from '@ant-design/icons';
import * as motion from 'motion/react-client';
import Link from 'next/link';
import React from 'react';
import { formatAmount, formatPercent, intToRubCompact } from '@/utils/formatCurrency';
import ShareLogo from '../../ShareLogo/ShareLogo';
import style from './style.module.scss';

type Metric = 'gain' | 'loss' | 'cap';
type Accent = 'up' | 'down' | 'neutral';

interface MoverCardProps {
    title: string;
    icon: React.ReactNode;
    accent: Accent;
    metric: Metric;
    shares: IFilteredShares[];
    loading?: boolean;
    index: number;
}

const renderMetric = (share: IFilteredShares, metric: Metric) => {
    if (metric === 'cap') return intToRubCompact(share.capitalization);
    return formatPercent(share.dayChangePercent);
};

const SkeletonRow: React.FC = () => (
    <li className={style.skeletonRow}>
        <Skeleton.Avatar active size={28} shape='circle' />
        <div className={style.itemName}>
            <Skeleton.Button active size='small' style={{ width: 64, height: 14 }} />
        </div>
        <Skeleton.Button active size='small' style={{ width: 56, height: 14 }} />
    </li>
);

const MoverCard: React.FC<MoverCardProps> = ({
    title,
    icon,
    accent,
    metric,
    shares,
    loading,
    index
}) => (
    <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: index * 0.08 }}
    >
        <Card className={style.card} styles={{ body: { padding: 0 } }}>
            <div className={`${style.cardHeader} ${style[accent]}`}>
                <span className={style.cardIcon}>{icon}</span>
                <h3 className={style.cardTitle}>{title}</h3>
            </div>
            <ul className={style.list}>
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                    : shares.map((share) => (
                          <li key={share.id} className={style.item}>
                              <Link className={style.itemLink} href={`/moex/${share.ticker}`}>
                                  <ShareLogo icon={share.icon} ticker={share.ticker} size={28} />
                                  <div className={style.itemName}>
                                      <span className={style.itemTicker}>{share.ticker}</span>
                                      <span className={style.itemPrice}>
                                          {formatAmount(share.price, share.currency)}
                                      </span>
                                  </div>
                                  <span className={`${style.itemMetric} ${style[accent]}`}>
                                      {renderMetric(share, metric)}
                                  </span>
                              </Link>
                          </li>
                      ))}
            </ul>
        </Card>
    </motion.div>
);

interface TopMoversProps {
    gainers: IFilteredShares[];
    losers: IFilteredShares[];
    topCap: IFilteredShares[];
    loading?: boolean;
}

const TopMovers: React.FC<TopMoversProps> = ({ gainers, losers, topCap, loading }) => (
    <div className={style.grid}>
        <MoverCard
            title='Лидеры роста'
            icon={<RiseOutlined />}
            accent='up'
            metric='gain'
            shares={gainers}
            loading={loading}
            index={0}
        />
        <MoverCard
            title='Лидеры падения'
            icon={<FallOutlined />}
            accent='down'
            metric='loss'
            shares={losers}
            loading={loading}
            index={1}
        />
        <MoverCard
            title='Крупнейшие'
            icon={<CrownOutlined />}
            accent='neutral'
            metric='cap'
            shares={topCap}
            loading={loading}
            index={2}
        />
    </div>
);
export default TopMovers;
