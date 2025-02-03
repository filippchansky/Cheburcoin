import CryptoPage from '@/components/Cryptocurrency/CryptoPage';
import HomePage from '@/components/HomePage/HomePage';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
    return (
        <main className='h-full'>
            {/* <CryptoPage /> */}
            <HomePage />
        </main>
    );
}
