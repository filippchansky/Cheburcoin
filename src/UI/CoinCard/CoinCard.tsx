import CardContent from '@/components/Cryptocurrency/CardContent/CardContent';
import { RedditOutlined, TwitterOutlined } from '@ant-design/icons';
import { Avatar, Card, Rate, Skeleton, notification } from 'antd';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { ICoin } from '../../../models/coinData';
import { auth } from '../../../configs/firebase/config';
import style from './style.module.scss';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useToggleFavorite } from '@/hooks/useFavorites';

interface CoinCardProps {
    item: ICoin;
    favorite: boolean | undefined;
}

const CoinCard: React.FC<CoinCardProps> = ({ item, favorite }) => {
    const toggleFavorite = useToggleFavorite();
    const [isFavorite, setIsFavorite] = useState(favorite);
    const [user, loading] = useAuthState(auth);
    const [api, contextHolder] = notification.useNotification();

    useEffect(() => {
        setIsFavorite(favorite);
    }, [favorite]);

    const openNotification = (type: 'deleted' | 'added') => {
        if (type === 'added') {
            api.info({
                message: `you have successfully added ${item.name} to your favorites`,
                placement: 'topRight'
            });
        } else if (type === 'deleted') {
            api.info({
                message: `you have successfully deleted  ${item.name} from your favorites`,
                placement: 'topRight'
            });
        }
    };

    const addToFavorite = () => {
        if (!auth.currentUser) return;
        const currentlyFavorite = !!isFavorite;
        toggleFavorite.mutate(
            { coinId: item.id, isFavorite: currentlyFavorite },
            { onSuccess: () => openNotification(currentlyFavorite ? 'deleted' : 'added') }
        );
        setIsFavorite(!currentlyFavorite);
    };

    return (
        <>
            {contextHolder}
            <Card
                key={item.id}
                title={
                    <Link href={`cryptocurrency/${item.id}`}>
                        <div className='flex items-center gap-3'>
                            <Avatar src={item.icon} />
                            <p>{item.name}</p>
                        </div>
                    </Link>
                }
                extra={
                    user ? (
                        isFavorite !== undefined ? (
                            <div className='flex'>
                                {isFavorite ? (
                                    <Rate onChange={addToFavorite} defaultValue={1} count={1} />
                                ) : (
                                    <Rate onChange={addToFavorite} count={1} />
                                )}
                            </div>
                        ) : (
                            <Skeleton.Button size='small' active style={{ width: '11px' }} />
                        )
                    ) : (
                        <Rate count={1} disabled />
                    )
                }
                actions={[
                    <a target='_blank' href={item.twitterUrl} key='twitter'>
                        <TwitterOutlined style={{ fontSize: '25px' }} />
                    </a>,
                    <a target='_blank' href={item.redditUrl} key='reddit'>
                        <RedditOutlined style={{ fontSize: '25px' }} />
                    </a>
                ]}
                style={{ width: 300 }}
            >
                <CardContent item={item} />
            </Card>
        </>
    );
};
export default CoinCard;
