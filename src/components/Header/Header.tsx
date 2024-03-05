import { Avatar, Button, Popover, Skeleton, Switch } from "antd";
import SkeletonAvatar from "antd/es/skeleton/Avatar";
import { getServerSession } from "next-auth";
import { useSession, signOut, signIn } from "next-auth/react";
import Image from "next/image";
import React, { Suspense } from "react";
import { authConfig } from "../../../configs/auth";
import { useSearchParams } from "next/navigation";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import SwitchTeme from "./SwitchTeme/SwitchTeme";
import Account from "./Account/Account";
import Navigation from "./Navigation/Navigation";

interface HeaderProps {}

const Header = ({}) => {
  return (
    <>
      <Navigation />
      <Account />
    </>
  );
};
export default Header;
