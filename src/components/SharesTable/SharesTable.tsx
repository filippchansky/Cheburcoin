'use client';
import React, { useEffect } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Paper } from '@mui/material';
import { IFilteredShares } from '@models/filteredShares';
import { getPercentageChange, intToRub } from '@/utils/formatCurrency';
import style from './style.module.scss';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface SharesTableProps {
    data: IFilteredShares[];
}

const SharesTable: React.FC<SharesTableProps> = ({ data }) => {
    const router = useRouter();
    const columns: GridColDef[] = [
        {
            field: 'title',
            headerName: 'Наименование',
            headerClassName: style.name,
            cellClassName: [style.col, style.name].join(' '),
            renderCell: ({ row }) => {
                let image = `https://mybroker.storage.bcs.ru/FinInstrumentLogo/${row.icon}.png`;
                return (
                    <div className='flex items-center gap-2'>
                        <div>
                            <Image
                                className='rounded-[50px]'
                                alt=''
                                width={40}
                                height={40}
                                src={image}
                            />
                        </div>
                        <div className='flex flex-col gap-2'>
                            <h3>{row.title}</h3>
                            <p className={style.ticker}>{row.ticker}</p>
                        </div>
                    </div>
                );
            }
        },
        {
            field: 'price',
            headerName: 'Цена',
            align: 'center',
            headerAlign: 'center',
            cellClassName: [style.col, style.price].join(' '),
            headerClassName: style.price,
            renderCell: ({ row }) => {
                return (
                    <>
                        <p>{intToRub(row.price)}</p>
                    </>
                );
            }
        },
        {
            field: 'openPrice',
            headerName: 'Цена открытия',
            width: 150,
            align: 'center',
            headerAlign: 'center',
            cellClassName: [style.col, style.none].join(' '),
            headerClassName: style.none,
            renderCell: ({ row }) => {
                return (
                    <>
                        <p>{intToRub(row.openPrice)}</p>
                    </>
                );
            }
        },
        {
            field: 'lowPrice',
            headerName: 'Минимум',
            width: 100,
            align: 'center',
            headerAlign: 'center',
            cellClassName: [style.col, style.none].join(' '),
            headerClassName: style.none
        },
        {
            field: 'highPrice',
            headerName: 'Максимум',
            width: 100,
            align: 'center',
            headerAlign: 'center',
            cellClassName: [style.col, style.none].join(' '),
            headerClassName: style.none
        },
        {
            field: 'dayDiff',
            headerName: 'За день',
            width: 100,
            align: 'center',
            headerAlign: 'center',
            cellClassName: [style.col, style.none].join(' '),
            headerClassName: style.none,
            renderCell: ({ row }) => {
                // const formate = intToRub((row.price - row.openPrice).toFixed(2))
                const formate =
                    row.dayDiff > 0 ? '+' + intToRub(row.dayDiff) : intToRub(row.dayDiff);
                return (
                    <div className='flex flex-col gap-2'>
                        <h3 style={{ color: `${row.dayDiff > 0 ? 'green' : 'red'}` }}>{formate}</h3>
                        <p
                            style={{
                                color: `${row.dayDiff > 0 ? 'green' : 'red'}`,
                                fontSize: '12px',
                                opacity: '1'
                            }}
                        >
                            {getPercentageChange(row.price, row.openPrice)}
                        </p>
                    </div>
                );
            }
        },
        {
            field: 'capitalization',
            headerName: 'Капитализация',
            width: 200,
            align: 'center',
            headerAlign: 'center',
            cellClassName: [style.col, style.none].join(' '),
            headerClassName: style.none
        }
    ];

    const rows = data?.map((item) => ({
        id: item.id,
        ticker: item.ticker,
        title: item.title,
        price: item.price,
        capitalization: intToRub(item.capitalization),
        openPrice: item.openPrice,
        lowPrice: intToRub(item.lowPrice),
        highPrice: intToRub(item.highPrice),
        dayDiff: item.price - item.openPrice,
        icon: item.icon
    }));

    const paginationModel = { page: 0, pageSize: 20 };

    return (
        <div>
            <div className={style.wrapper}>
                <Paper sx={{ height: '100%', width: '100%' }}>
                    <DataGrid
                        rows={rows}
                        showColumnVerticalBorder={false}
                        columns={columns}
                        initialState={{ pagination: { paginationModel } }}
                        pageSizeOptions={[5, 10, 50, 100]}
                        onRowClick={(a) => router.push(`/moex/${a.id}`)}
                        rowHeight={70}
                        //   checkboxSelection
                        sx={{
                            '& .MuiDataGrid-row': { borderBottom: 'none', width: '100%' }, // Убираем границы между строками
                            '& .MuiDataGrid-cell': { borderTop: '0px', display: 'none' },
                            '& .MuiDataGrid-cell:focus': { outline: 'none' },
                            '& .MuiDataGrid-filler': { display: 'none' },
                            '& .MuiDataGrid-columnHeaders': { width: '100%' },
                            '& .MuiDataGrid-virtualScrollerContent': { width: '100% !important' },
                            '& .MuiDataGrid-scrollbar': { display: 'none' },
                            '& .MuiDataGrid-menuIcon': { display: 'none' },
                            '& .MuiDataGrid-columnSeparator': { display: 'none' }
                        }}
                    />
                </Paper>
            </div>
        </div>
    );
};
export default SharesTable;
