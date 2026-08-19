import CryptoNews from '@/components/Cryptocurrency/CryptoNews/CryptoNews';
import style from './style.module.scss';

export default function NewsRoute() {
    return (
        <main className={style.page}>
            <CryptoNews />
        </main>
    );
}
