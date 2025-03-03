import Image from 'next/image';
import React from 'react'
import style from "./style.module.scss"
import Link from 'next/link';

interface TableNameProps {
    title: string,
    ticker: string
    icon: string
}

const TableName:React.FC<TableNameProps> = ({title, ticker, icon}) => {
    
    let image = `https://mybroker.storage.bcs.ru/FinInstrumentLogo/${icon}.png`;
                return (
                    <div className='flex items-center gap-5'>
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
                            <Link href={`/moex/${ticker}`}><h3>{title}</h3></Link>
                            <p className={style.ticker}>{ticker}</p>
                        </div>
                    </div>
                );
}
export default TableName;