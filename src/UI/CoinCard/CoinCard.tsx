import CardContent from "@/components/Cryptocurrency/CardContent/CardContent";
import { RedditOutlined, TwitterOutlined } from "@ant-design/icons";
import { Avatar, Card } from "antd";
import Link from "next/link";
import React from "react";
import { ICoin } from "../../../models/coinData";

interface CoinCardProps {
    item: ICoin
}

const CoinCard: React.FC<CoinCardProps> = ({item}) => {
  return (
    <Card
      key={item.id}
      title={
        <div className="flex items-center gap-3">
          <Avatar src={item.icon} />
          <p>{item.name}</p>
        </div>
      }
      extra={<Link href={`/${item.id}`}>More</Link>}
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
