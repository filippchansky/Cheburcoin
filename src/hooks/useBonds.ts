import { getOfzBonds } from '@api/moex/bonds/getOfzBonds';
import { mapBonds } from '@api/moex/bonds/mapBonds';
import { useQuery } from '@tanstack/react-query';

/** Список ОФЗ (борд TQOB), типизированный и обогащённый производными атрибутами. */
export const useOfzBonds = () =>
    useQuery({
        queryKey: ['bonds', 'ofz'],
        queryFn: getOfzBonds,
        select: mapBonds
    });
