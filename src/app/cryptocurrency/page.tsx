import Cryptoccurency from '@/components/Cryptocurrency/Cryptoccurency';
import React from 'react'

interface PageProps {
    
}

const Page:React.FC<PageProps> = ({}) => {
    const TOKEN = process.env.COIN
    return (
        <>
            <Cryptoccurency TOKEN={TOKEN!}/>
        </>
    )
}
export default Page;