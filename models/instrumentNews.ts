/**
 * Пост ленты Пульса по инструменту (акция по тикеру или облигация по SECID).
 * Источник — соцсеть Т-Банка (не Invest API): аналитика, новости и обсуждения
 * вперемешку. Публичный, токен не нужен.
 */
export interface IInstrumentNewsItem {
    id: string;
    /** Текст поста. */
    text: string;
    /** Никнейм автора в Пульсе. */
    author: string | null;
    /** Дата публикации, ISO-строка. */
    date: string | null;
    likes: number;
    comments: number;
    /** Постоянная ссылка на пост в Пульсе (или null). */
    url: string | null;
}
