import CardContent from "@/components/Cryptocurrency/CardContent/CardContent";
import {
  RedditOutlined,
  StarOutlined,
  StarTwoTone,
  TwitterOutlined,
} from "@ant-design/icons";
import { Avatar, Card, Rate, Skeleton, notification } from "antd";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ICoin } from "../../../models/coinData";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { auth, db } from "../../../configs/firebase/config";
import style from "./style.module.scss";
import { useQuery } from "@tanstack/react-query";
import { NotificationPlacement } from "antd/es/notification/interface";
import { useAuthState } from "react-firebase-hooks/auth";
import { useFavoriteCoins } from "@/store/FavoriteCoins";

interface CoinCardProps {
  item: ICoin;
  favorite: boolean | undefined;
}

const CoinCard: React.FC<CoinCardProps> = ({ item, favorite }) => {
  const { addCoins } = useFavoriteCoins();
  const [isFavorite, setIsFavorite] = useState(favorite);
  const [user, loading] = useAuthState(auth);
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    setIsFavorite(favorite);
  }, [favorite]);

  const openNotification = (type: "deleted" | "added") => {
    if (type === "added") {
      api.info({
        message: `you have successfully added ${item.name} to your favorites`,
        placement: "topRight",
      });
    } else if (type === "deleted") {
      api.info({
        message: `you have successfully deleted  ${item.name} from your favorites`,
        placement: "topRight",
      });
    }
  };

  const addToFavorite = async () => {
    if (!isFavorite) {
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          coinList: arrayUnion(item.id),
        });
        addCoins();
        setIsFavorite(true);
        openNotification("added");
      }
    }
    if (isFavorite) {
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          coinList: arrayRemove(item.id),
        });
        addCoins();
        setIsFavorite(false);
        openNotification("deleted");
      }
    }
  };

  return (
    <>
      {contextHolder}
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
          user ? (
            isFavorite !== undefined ? (
              <div className="flex">
                {isFavorite ? (
                  <Rate onChange={addToFavorite} defaultValue={1} count={1} />
                ) : (
                  <Rate onChange={addToFavorite} count={1} />
                )}
              </div>
            ) : (
              <Skeleton.Button size="small" active style={{ width: "11px" }} />
            )
          ) : (
            <Rate count={1} disabled />
          )
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
    </>
  );
};
export default CoinCard;
