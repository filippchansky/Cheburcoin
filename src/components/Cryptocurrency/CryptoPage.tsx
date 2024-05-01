"use client";
import React, { useEffect, useState } from "react";
import style from "./style.module.scss";
import News from "./News/News";
import Cryptoccurency from "./Cryptocurrency/Cryptoccurency";
import { Affix, Menu, MenuProps, Select } from "antd";
import { DollarOutlined, ReadOutlined } from "@ant-design/icons";

interface CryptoPageProps {}

const items: MenuProps["items"] = [
  {
    label: "News",
    key: "news",
    icon: <ReadOutlined />,
  },
  {
    label: "Coins",
    key: "coins",
    icon: <DollarOutlined />,
  },
];
const CryptoPage: React.FC<CryptoPageProps> = ({}) => {
  const [type, setType] = useState("coins");

  const [width, setWidth] = useState(window.innerWidth); // TODO window is not defined (window.innerWidth)

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
  const onClick: MenuProps["onClick"] = (e) => {
    setType(e.key);
  };
  return (
    <>
      <div className={style.wrapper}>
        <div className="flex justify-center min-[650px]:hidden">
          <Menu
            onClick={onClick}
            style={{ width: "190px" }}
            defaultSelectedKeys={["coins"]}
            defaultOpenKeys={["sub1"]}
            mode="horizontal"
            items={items}
          />
        </div>
        {width > 650 && width > 1520 && (
          <>
            <News />
            <Affix offsetTop={50}>
              <Cryptoccurency />
            </Affix>
          </>
        )}
        {width >= 650 && width <= 1520 &&(
          <>
            <News />
            <Cryptoccurency />
          </>
        )}
        {width <= 650 && type === "coins" && (
          <>
            <Cryptoccurency />
          </>
        )}
        {width <= 650 && type === "news" && (
          <>
            <News />
          </>
        )}
      </div>
    </>
  );
};
export default CryptoPage;
