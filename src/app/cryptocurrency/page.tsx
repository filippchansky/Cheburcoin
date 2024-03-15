import Cryptoccurency from '@/components/Cryptocurrency/Cryptoccurency';
import News from '@/components/Cryptocurrency/News/News';
import React from 'react'
import style from "./style.module.scss"

interface PageProps {
    
}

const Page:React.FC<PageProps> = ({}) => {
    const TOKEN = process.env.COIN!
    return (
        <div className={style.wrapper}>
            <News TOKEN={TOKEN}/>
            <Cryptoccurency TOKEN={TOKEN}/>
        </div>
    )
}
export default Page;