import AboutCurrency from '@/components/Cryptocurrency/About/AboutCurrency';
import Chart from '@/components/Cryptocurrency/About/Chart/Chart';
import React from 'react'

interface PageProps {
    
}

const Page = ({params} : {params: {slug: string}}) => {
    
    const TOKEN = process.env.COIN!

    return (
        <AboutCurrency TOKEN={TOKEN}/>
    )
}
export default Page;