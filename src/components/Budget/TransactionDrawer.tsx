'use client';
import React from 'react';
import { Button, DatePicker, Drawer, Input, InputNumber, Segmented, Select, Space, Typography, notification } from 'antd';
import ruRU from 'antd/es/date-picker/locale/ru_RU';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ru';
import { BudgetCategory, BudgetTx, BudgetTxDraft, TxType } from '@/lib/budget/types';
import { useAddBudgetTx, useBudgetCategories, useUpdateBudgetTx } from '@/hooks/useBudget';

dayjs.locale('ru');

const { Text } = Typography;

interface TransactionDrawerProps {
    open: boolean;
    onClose: () => void;
    /** Операция для редактирования; null/undefined — создание новой. */
    editing?: BudgetTx | null;
}

/** Первая категория нужного типа — дефолт для нового селекта. */
const firstOfType = (cats: BudgetCategory[] | undefined, type: TxType): string | undefined =>
    cats?.find((c) => c.type === type)?.id;

/**
 * Ввод/редактирование операции учёта: тип (расход/доход) → сумма → категория →
 * дата → заметка. Категории фильтруются по выбранному типу; при смене типа
 * выбранная категория сбрасывается на первую подходящую.
 */
const TransactionDrawer: React.FC<TransactionDrawerProps> = ({ open, onClose, editing }) => {
    const { data: categories } = useBudgetCategories();
    const addTx = useAddBudgetTx();
    const updateTx = useUpdateBudgetTx();
    const [api, contextHolder] = notification.useNotification();

    const [type, setType] = React.useState<TxType>('expense');
    const [amount, setAmount] = React.useState<number | null>(null);
    const [categoryId, setCategoryId] = React.useState<string | undefined>();
    const [date, setDate] = React.useState<Dayjs>(dayjs());
    const [note, setNote] = React.useState('');

    // Заполняем форму при открытии: значениями операции (правка) или дефолтами (новая).
    React.useEffect(() => {
        if (!open) return;
        if (editing) {
            setType(editing.type);
            setAmount(editing.amount);
            setCategoryId(editing.categoryId);
            setDate(dayjs(editing.date));
            setNote(editing.note ?? '');
        } else {
            setType('expense');
            setAmount(null);
            setCategoryId(firstOfType(categories, 'expense'));
            setDate(dayjs());
            setNote('');
        }
    }, [open, editing, categories]);

    const options = (categories ?? [])
        .filter((c) => c.type === type)
        .map((c) => ({ value: c.id, label: `${c.icon}  ${c.name}` }));

    const handleTypeChange = (next: TxType) => {
        setType(next);
        // Категория прошлого типа тут не валидна — берём первую нужного типа.
        if (!categories?.some((c) => c.id === categoryId && c.type === next)) {
            setCategoryId(firstOfType(categories, next));
        }
    };

    const handleSave = async () => {
        if (!amount || amount <= 0) {
            api.error({ placement: 'top', message: 'Введите сумму больше нуля' });
            return;
        }
        if (!categoryId) {
            api.error({ placement: 'top', message: 'Выберите категорию' });
            return;
        }

        const trimmed = note.trim();

        if (editing) {
            // При правке пишем все поля; пустую заметку — как '' (стираем прежнюю),
            // Firestore не принимает undefined.
            await updateTx.mutateAsync({
                id: editing.id,
                patch: { type, amount, categoryId, date: date.format('YYYY-MM-DD'), note: trimmed }
            });
            api.success({ placement: 'top', message: 'Операция изменена' });
        } else {
            // При создании пустое поле note просто не кладём.
            const draft: BudgetTxDraft = {
                type,
                amount,
                categoryId,
                date: date.format('YYYY-MM-DD'),
                ...(trimmed ? { note: trimmed } : {})
            };
            await addTx.mutateAsync(draft);
            api.success({ placement: 'top', message: 'Операция добавлена' });
        }
        onClose();
    };

    return (
        <Drawer
            title={editing ? 'Изменить операцию' : 'Новая операция'}
            open={open}
            onClose={onClose}
            width={420}
            destroyOnClose
        >
            {contextHolder}
            <div className='flex flex-col gap-4'>
                <Segmented<TxType>
                    block
                    value={type}
                    onChange={handleTypeChange}
                    options={[
                        { value: 'expense', label: 'Расход' },
                        { value: 'income', label: 'Доход' }
                    ]}
                />

                <label className='flex flex-col gap-1'>
                    <Text type='secondary' className='text-xs'>
                        Сумма
                    </Text>
                    <InputNumber<number>
                        autoFocus
                        size='large'
                        style={{ width: '100%' }}
                        min={0}
                        step={100}
                        suffix='₽'
                        placeholder='0'
                        value={amount ?? undefined}
                        onChange={setAmount}
                        onPressEnter={handleSave}
                    />
                </label>

                <label className='flex flex-col gap-1'>
                    <Text type='secondary' className='text-xs'>
                        Категория
                    </Text>
                    <Select
                        size='large'
                        value={categoryId}
                        onChange={setCategoryId}
                        options={options}
                        placeholder='Выберите категорию'
                    />
                </label>

                <label className='flex flex-col gap-1'>
                    <Text type='secondary' className='text-xs'>
                        Дата
                    </Text>
                    <DatePicker
                        size='large'
                        style={{ width: '100%' }}
                        locale={ruRU}
                        allowClear={false}
                        format='DD.MM.YYYY'
                        value={date}
                        onChange={(d) => d && setDate(d)}
                        maxDate={dayjs()}
                    />
                </label>

                <label className='flex flex-col gap-1'>
                    <Text type='secondary' className='text-xs'>
                        Заметка
                    </Text>
                    <Input.TextArea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder='Необязательно'
                        autoSize={{ minRows: 1, maxRows: 3 }}
                        maxLength={140}
                    />
                </label>

                <Space className='mt-2'>
                    <Button
                        type='primary'
                        loading={addTx.isPending || updateTx.isPending}
                        onClick={handleSave}
                    >
                        {editing ? 'Сохранить' : 'Добавить'}
                    </Button>
                    <Button onClick={onClose}>Отмена</Button>
                </Space>
            </div>
        </Drawer>
    );
};
export default TransactionDrawer;
