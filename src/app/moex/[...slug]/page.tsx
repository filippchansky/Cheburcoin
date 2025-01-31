import React from 'react'

interface PageProps {
    
}

const Page = ({ params }: { params: { slug: string } }) => {
    
    return (
        <>
            данные об акции {params.slug}
        </>
    )
}
export default Page;