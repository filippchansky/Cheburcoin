"use client";
import React, { useEffect, useState } from "react";
import style from "./style.module.scss";
import News from "./News/News";
import Cryptoccurency from "./Cryptocurrency/Cryptoccurency";
import { Menu, MenuProps, Select } from "antd";

interface CryptoPageProps {
  TOKEN: string;
}

type MenuItem = Required<MenuProps>["items"][number];
function getItem(
  label: React.ReactNode,
  key: React.Key,
  icon?: React.ReactNode,
  children?: MenuItem[],
  type?: "group"
): MenuItem {
  return {
    key,
    icon,
    children,
    label,
    type,
  } as MenuItem;
}
const items: MenuProps["items"] = [
  getItem(
    "",
    "grp",
    null,
    [getItem("News", "news"), getItem("Coins", "coins")],
    "group"
  ),
];
const CryptoPage: React.FC<CryptoPageProps> = ({ TOKEN }) => {
  const [type, setType] = useState("coins");

  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);
  const onClick: MenuProps['onClick'] = (e) => {
    console.log('click ', e);
    setType(e.key)
  };
  return (
    <>
      <div className={style.wrapper}>
        <div className="flex justify-center min-[650px]:hidden">
          <Menu
            onClick={onClick}
            style={{ width: '170px' }}
            defaultSelectedKeys={["coins"]}
            defaultOpenKeys={["sub1"]}
            mode="horizontal"
            items={items}
          />
        </div>
        {width >= 650 && (
          <>
            <News TOKEN={TOKEN} />
            <Cryptoccurency TOKEN={TOKEN} />
          </>
        )}
        {width <= 650 && type === 'coins' && (
          <>
            <Cryptoccurency TOKEN={TOKEN} />
          </>
        )}
        {width <= 650 && type === 'news' && (
          <>
            <News TOKEN={TOKEN} />
          </>
        )}
      </div>
     
    </>
  );
};
export default CryptoPage;
