'use client';
import React, { useEffect } from 'react';

interface PortfolioPageProps {}

const PortfolioPage: React.FC<PortfolioPageProps> = ({}) => {
    useEffect(() => {
        const fetchAccounts = async () => {
            const res = await fetch('/api/getPortfolio');
            const data = await res.json();
            console.log(data);
          };
          
          fetchAccounts();
    }, []);

    return <>tinkofff</>;
};
export default PortfolioPage;
