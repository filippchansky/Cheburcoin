import { useTbankApi } from '@/store/useTbankApi';
import axios from 'axios';

// Создаем экземпляр axios
export const apiTinkoff = axios.create({
    baseURL: process.env.NEXT_PUBLIC_TINKOFF_API,
    headers: {
        accept: 'application/json',
    },
});

// Функция для обновления заголовка Authorization
const updateAuthorizationHeader = (token: string) => {
    apiTinkoff.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Инициализируем заголовок Authorization текущим токеном
updateAuthorizationHeader(useTbankApi.getState().token ?? '');

// Подписываемся на изменения токена в хранилище
const unsubscribe = useTbankApi.subscribe(
    (newState) => {
        updateAuthorizationHeader(newState.token ?? ''); // Обновляем заголовок при изменении токена
    }, // Подписываемся только на изменения токена
);
// unsubscribe()