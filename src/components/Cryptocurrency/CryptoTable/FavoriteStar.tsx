'use client';
import React from 'react';
import { StarFilled, StarOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../../../configs/firebase/config';
import { useToggleFavorite } from '@/hooks/useFavorites';
import style from './style.module.scss';

interface FavoriteStarProps {
    coinId: string;
    isFavorite: boolean;
}

/**
 * Звезда избранного для строки таблицы. Переиспользует общий useToggleFavorite
 * (Firestore coinList), в отличие от старого CoinCard на antd Rate. Гостю показываем
 * неактивную звезду с подсказкой. stopPropagation — чтобы клик не открывал монету.
 */
const FavoriteStar: React.FC<FavoriteStarProps> = ({ coinId, isFavorite }) => {
    const [user] = useAuthState(auth);
    const toggle = useToggleFavorite();

    const onClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user) return;
        toggle.mutate({ coinId, isFavorite });
    };

    if (!user) {
        return (
            <Tooltip title='Войдите, чтобы добавлять в избранное'>
                <StarOutlined className={style.starMuted} />
            </Tooltip>
        );
    }

    return (
        <span className={style.star} onClick={onClick}>
            {isFavorite ? <StarFilled className={style.starActive} /> : <StarOutlined />}
        </span>
    );
};
export default FavoriteStar;
