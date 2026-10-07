'use client';
import React from 'react';
import {
    Button,
    ColorPicker,
    Divider,
    Drawer,
    Input,
    Popconfirm,
    Segmented,
    Space,
    Typography,
    notification,
    theme
} from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { BudgetCategory, TxType } from '@/lib/budget/types';
import { useBudgetCategories, useSaveBudgetCategories } from '@/hooks/useBudget';

const { Text } = Typography;

interface CategoriesDrawerProps {
    open: boolean;
    onClose: () => void;
}

/** Быстрый выбор эмодзи для новой категории. */
const EMOJI_SUGGESTIONS = ['🍎', '🍽️', '🚗', '🏠', '🛍️', '💊', '🎬', '📈', '✈️', '🎓', '🐾', '🎁', '💼', '💵', '🧾', '📦'];

/** Пресеты цвета для пончика. */
const COLOR_PRESETS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981',
    '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
    '#14b8a6', '#64748b'
];

/** Короткий стабильный id для пользовательской категории. */
const makeId = () => `custom_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/**
 * Управление категориями: добавление своих (название, тип, эмодзи, цвет) и
 * удаление любых. Первое сохранение «материализует» дефолтный набор в Firestore
 * (useBudgetCategories до правок отдаёт дефолты в памяти), поэтому сохраняем
 * всегда ПОЛНЫЙ список. Операции с удалённой категорией деградируют мягко
 * (показываются как «Без категории»).
 */
const CategoriesDrawer: React.FC<CategoriesDrawerProps> = ({ open, onClose }) => {
    const { data: categories } = useBudgetCategories();
    const saveCategories = useSaveBudgetCategories();
    const [api, contextHolder] = notification.useNotification();
    // Тело antd Drawer (портал в body) имеет базовый color чёрным — сырой текст
    // (название категории) наследует его мимо тёмной темы. Задаём colorText темы.
    const { token } = theme.useToken();

    const [type, setType] = React.useState<TxType>('expense');
    const [name, setName] = React.useState('');
    const [icon, setIcon] = React.useState('📦');
    const [color, setColor] = React.useState('#64748b');

    const list = categories ?? [];
    const expense = list.filter((c) => c.type === 'expense');
    const income = list.filter((c) => c.type === 'income');

    const resetForm = () => {
        setName('');
        setIcon('📦');
        setColor('#64748b');
    };

    const handleAdd = async () => {
        const trimmed = name.trim();
        if (!trimmed) {
            api.error({ placement: 'top', message: 'Введите название категории' });
            return;
        }
        const next: BudgetCategory = {
            id: makeId(),
            name: trimmed,
            type,
            icon: icon.trim() || (type === 'expense' ? '📦' : '➕'),
            color
        };
        await saveCategories.mutateAsync([...list, next]);
        api.success({ placement: 'top', message: 'Категория добавлена' });
        resetForm();
    };

    const handleDelete = async (id: string) => {
        await saveCategories.mutateAsync(list.filter((c) => c.id !== id));
    };

    const renderGroup = (title: string, items: BudgetCategory[]) => (
        <div className='flex flex-col'>
            <Text type='secondary' className='mb-1 text-xs'>
                {title}
            </Text>
            {items.length ? (
                items.map((c) => (
                    <div
                        key={c.id}
                        className='flex items-center gap-2 border-b py-2 last:border-b-0'
                        style={{ borderColor: 'rgba(127,127,127,0.15)' }}
                    >
                        <span
                            style={{
                                width: 10,
                                height: 10,
                                borderRadius: 3,
                                background: c.color,
                                flexShrink: 0
                            }}
                        />
                        <span className='min-w-0 flex-1 truncate'>
                            {c.icon} {c.name}
                        </span>
                        <Popconfirm
                            title='Удалить категорию?'
                            description='Операции этой категории останутся без неё.'
                            okText='Удалить'
                            cancelText='Отмена'
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleDelete(c.id)}
                        >
                            <Button type='text' size='small' icon={<DeleteOutlined />} />
                        </Popconfirm>
                    </div>
                ))
            ) : (
                <Text type='secondary' className='py-2 text-xs'>
                    Пусто
                </Text>
            )}
        </div>
    );

    return (
        <Drawer
            title='Категории'
            open={open}
            onClose={onClose}
            width={420}
            destroyOnClose
            styles={{ body: { color: token.colorText } }}
        >
            {contextHolder}
            <div className='flex flex-col gap-5'>
                <div className='flex flex-col gap-3'>
                    <Text strong>Новая категория</Text>

                    <Segmented<TxType>
                        block
                        value={type}
                        onChange={setType}
                        options={[
                            { value: 'expense', label: 'Расход' },
                            { value: 'income', label: 'Доход' }
                        ]}
                    />

                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder='Название категории'
                        maxLength={24}
                        onPressEnter={handleAdd}
                    />

                    <div className='flex items-center gap-2'>
                        <Input
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                            placeholder='📦'
                            maxLength={2}
                            style={{ width: 56, textAlign: 'center' }}
                        />
                        <ColorPicker
                            value={color}
                            onChange={(value) =>
                                setColor((value as { toHexString(): string }).toHexString())
                            }
                            presets={[{ label: 'Палитра', colors: COLOR_PRESETS }]}
                        />
                        <Text type='secondary' className='text-xs'>
                            Значок и цвет
                        </Text>
                    </div>

                    <div className='flex flex-wrap gap-1'>
                        {EMOJI_SUGGESTIONS.map((e) => (
                            <Button
                                key={e}
                                size='small'
                                type={icon === e ? 'primary' : 'default'}
                                onClick={() => setIcon(e)}
                                style={{ padding: '0 8px' }}
                            >
                                {e}
                            </Button>
                        ))}
                    </div>

                    <Space>
                        <Button type='primary' loading={saveCategories.isPending} onClick={handleAdd}>
                            Добавить категорию
                        </Button>
                    </Space>
                </div>

                <Divider style={{ margin: 0 }} />

                {renderGroup('Расходы', expense)}
                {renderGroup('Доходы', income)}
            </div>
        </Drawer>
    );
};
export default CategoriesDrawer;
