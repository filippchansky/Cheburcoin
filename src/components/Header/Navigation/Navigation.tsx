"use client";
import React, { useState } from "react";
import { Button, Menu } from "antd";
import style from "./style.module.scss";
import { useDarkTheme } from "@/store/darkTheme";
import { useRouter, usePathname } from "next/navigation";

interface NavigationProps {}

const Navigation: React.FC<NavigationProps> = ({}) => {
  const { darkTheme } = useDarkTheme();
  const nav = [
    {
      id: 0,
      key: "/",
      label: "Home",
      path: "#",
    },
    {
      id: 1,
      key: "/about",
      label: "About Me",
      path: "#",
    },
    {
      id: 2,
      key: '/cryptocurrency',
      label: 'Crypto'
    }
  ];

  const { push } = useRouter();
  const path = usePathname();
  return (
    <>
      <div className="max-w-[500px] w-full max-[420px]:max-w-[200px]">
        <Menu
          // theme={darkTheme ? "dark" : "light"}
          mode="horizontal"
          defaultSelectedKeys={["/"]}
          selectedKeys={[`${path}`]}
          items={nav}
          style={{ flex: 1, minWidth: 0 }}
          onClick={(e) => push(e.key)}
        />
      </div>
      {/* <div className={style.btnWrapper}>
        <Button>Burger</Button>
      </div>
      <nav className={style.navWrapper}>
        <ul className="flex gap-5">
          {nav.map((item) => (
            <li className={style.navItem} key={item.id}>{item.value}</li>
          ))}
        </ul>
      </nav> */}
    </>
  );
};
export default Navigation;
