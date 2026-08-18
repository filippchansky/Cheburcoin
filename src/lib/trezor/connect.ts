/**
 * Client-only синглтон Trezor Connect.
 *
 * SDK общается с устройством и своим backend (Blockbook) через защищённый popup
 * connect.trezor.io — работает ТОЛЬКО в браузере. В Next.js его нельзя тянуть на
 * сервере (SSR/сборка упадут), поэтому импорт динамический и вся инициализация
 * спрятана за `getTrezorConnect()`, который зовём лениво из клиентских хуков.
 *
 * init() вызываем один раз за сессию: держим промис инициализации, при ошибке
 * сбрасываем — чтобы следующий вызов мог попробовать снова (например, если
 * пользователь сначала отклонил доступ к устройству).
 */

// Тип берём из default-экспорта пакета (именованного типа TrezorConnect в
// connect-web нет — это значение). `typeof import(...)` даёт точный тип, при
// этом рантайм-загрузка модуля остаётся динамической (внутри функции ниже) —
// иначе бандлер затащил бы SDK в серверную сборку и SSR/билд упали бы.
type TrezorConnectType = (typeof import('@trezor/connect-web'))['default'];

// Манифест обязателен: Trezor требует контакт разработчика и URL приложения
// (показываются пользователю в popup). Держим в env, с безопасным фолбэком.
const MANIFEST_EMAIL = process.env.NEXT_PUBLIC_TREZOR_EMAIL || 'filippchansky@yandex.ru';

let instance: TrezorConnectType | null = null;
let initPromise: Promise<TrezorConnectType> | null = null;

/**
 * Возвращает готовый к работе TrezorConnect. Первый вызов инициализирует SDK
 * (грузит iframe connect.trezor.io), последующие переиспользуют инстанс.
 * Бросает на сервере — вызывать только из клиентского кода (useEffect/обработчики).
 */
export const getTrezorConnect = async (): Promise<TrezorConnectType> => {
    if (typeof window === 'undefined') {
        throw new Error('TrezorConnect доступен только в браузере');
    }
    if (instance) return instance;
    if (initPromise) return initPromise;

    initPromise = (async () => {
        // default-экспорт пакета — уже сконфигурированный под web инстанс.
        const mod = await import('@trezor/connect-web');
        const TrezorConnect = (mod.default ?? mod) as unknown as TrezorConnectType;

        await TrezorConnect.init({
            // lazyLoad: iframe поднимается при первом реальном вызове метода, а не
            // сразу при init — не грузим connect.trezor.io, пока не нужно.
            lazyLoad: true,
            manifest: {
                appName: 'Cheburcoin',
                email: MANIFEST_EMAIL,
                appUrl: window.location.origin
            }
        });

        instance = TrezorConnect;
        return TrezorConnect;
    })();

    try {
        return await initPromise;
    } catch (error) {
        // Сбрасываем, чтобы повторный вызов мог инициализировать заново.
        initPromise = null;
        throw error;
    }
};
