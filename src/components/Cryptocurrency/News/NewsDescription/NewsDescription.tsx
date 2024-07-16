import React from 'react';
import style from './style.module.scss';
import { INewsData } from '../../../../../models/newsData';
import { Button } from 'antd';

interface NewsDescriptionProps {
  item: INewsData;
}

const NewsDescription: React.FC<NewsDescriptionProps> = ({ item }) => {
  return (
    <div>
      {item.coins.length !== 0 && (
        <div className='flex gap-2'>
          <h1 className={style.coinsTitle}>Coins:</h1>
          <ul className='flex gap-1'>
            {item.coins.map((item) => (
              <li key={item.coinIdKeyWords}>{item.coinNameKeyWords}</li>
            ))}
          </ul>
        </div>
      )}
      <div className=''>
        <div>
          <p>{item.description}</p>
        </div>
      </div>
    </div>
  );
};
export default NewsDescription;
