import React from "react";
import style from "./style.module.scss";
import { INewsData } from "../../../../../models/newsData";
import { Avatar } from "antd";

interface NewsTitleProps {
  item: INewsData;
}

const NewsTitle: React.FC<NewsTitleProps> = ({ item }) => {
  return (
    <div className="flex items-center gap-5">
      <Avatar className={style.avatar} src={item.imgUrl} />
      <div className="max-w-[500px]">
        <p className={style.title}>{item.title}</p>
        <div className="flex justify-between">
          <p className={style.source}>{item.source}</p>
        </div>
      </div>
    </div>
  );
};
export default NewsTitle;
