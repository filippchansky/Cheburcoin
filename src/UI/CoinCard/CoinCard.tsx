import CardContent from "@/components/Cryptocurrency/CardContent/CardContent";
import {
  RedditOutlined,
  StarOutlined,
  StarTwoTone,
  TwitterOutlined,
} from "@ant-design/icons";
import { Avatar, Card, Rate } from "antd";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ICoin } from "../../../models/coinData";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../../configs/firebase/config";
import style from "./style.module.scss";
import { useQuery } from "@tanstack/react-query";

interface CoinCardProps {
  item: ICoin;
}

const CoinCard: React.FC<CoinCardProps> = ({ item }) => {
  const [isFavorite, setIsFavorite] = useState(0);

  

  const addToFavorite = async () => {
    if (auth.currentUser) {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        coinList: arrayUnion(item.id),
      });
    }
  };

  return (
    <Card
      key={item.id}
      title={
        <Link href={`/${item.id}`}>
          <div className="flex items-center gap-3">
            <Avatar src={item.icon} />
            <p>{item.name}</p>
          </div>
        </Link>
      }
      extra={
        <div className="flex">
          <Rate defaultValue={isFavorite} count={1} />
        </div>
      }
      actions={[
        <a target="_blank" href={item.twitterUrl} key="twitter">
          <TwitterOutlined style={{ fontSize: "25px" }} />
        </a>,
        <a target="_blank" href={item.redditUrl} key="reddit">
          <RedditOutlined style={{ fontSize: "25px" }} />
        </a>,
      ]}
      style={{ width: 300 }}
    >
      <CardContent item={item} />
    </Card>
  );
};
export default CoinCard;
