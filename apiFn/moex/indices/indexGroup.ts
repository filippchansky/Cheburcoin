import { IndexGroup } from '@models/marketIndex';

/** Человекочитаемые названия групп индексов. */
export const INDEX_GROUP_LABEL: Record<IndexGroup, string> = {
    main: 'Основные',
    sector: 'Отраслевые',
    bonds: 'Облигационные',
    money: 'Денежный рынок',
    other: 'Прочие'
};

/** Цвет тега группы (палитра antd). */
export const INDEX_GROUP_COLOR: Record<IndexGroup, string> = {
    main: 'geekblue',
    sector: 'volcano',
    bonds: 'green',
    money: 'gold',
    other: 'default'
};

/** Ключевые индексы широкого рынка — попадают в «Основные» по точному SECID. */
const MAIN_IDS = new Set(['IMOEX', 'IMOEX2', 'MOEXBMI', 'MOEX10', 'MRBC', 'RTSI', 'RTSTR']);

/**
 * Ключевые слова групп в НАЗВАНИИ (проверяются ПОСЛЕ точных SECID, в этом порядке).
 * Облигации и денежный рынок ловим раньше отраслей. Эвристика по подстроке (includes) —
 * MOEX меняет формулировки словаря, поэтому точных равенств избегаем (см. память по BONDTYPE).
 * РЕПО матчим и латиницей ('repo', SECID MOEXREPO*), и кириллицей ('репо', «ММВБ РЕПО»).
 */
const GROUP_KEYWORDS: [IndexGroup, string[]][] = [
    ['bonds', ['облига', 'госдолг', 'офз', 'rgbi', 'бонд', 'cbonds']],
    ['money', ['репо', 'repo', 'rusfar', 'ruonia']],
    [
        'sector',
        [
            'нефт', // нефти и газа / нефтехими
            'газа',
            'электроэнерг',
            'телеком',
            'металл',
            'добыч',
            'машиностро',
            'банк',
            'финанс',
            'потреб',
            'хими',
            'транспорт',
            'строит',
            'девелоп',
            'иннова',
            'здравоохран',
            'информацион'
        ]
    ]
];

/**
 * Определяет смысловую группу индекса по SECID и названию. Сначала точные основные
 * коды, затем ключевые слова названия (облигации → денежный рынок → отрасли). Всё,
 * что не подошло, — «Прочие» (валютные, кастомные, сегменты капитализации).
 */
export const deriveIndexGroup = (secid: string, name: string): IndexGroup => {
    if (MAIN_IDS.has(secid)) return 'main';

    const lower = `${name} ${secid}`.toLowerCase();
    for (const [group, keywords] of GROUP_KEYWORDS) {
        if (keywords.some((keyword) => lower.includes(keyword))) return group;
    }

    return 'other';
};
