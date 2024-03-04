"use client";
import { Avatar, Button, Popover, Skeleton } from "antd";
import SkeletonAvatar from "antd/es/skeleton/Avatar";
import { getServerSession } from "next-auth";
import { useSession, signOut, signIn } from "next-auth/react";
import Image from "next/image";
import React, { Suspense } from "react";
import { authConfig } from "../../../configs/auth";
import { useSearchParams } from "next/navigation";

interface HeaderProps {}

const Header = ({}) => {
  const nav = [
    {
      id: 0,
      value: "About",
      path: "#",
    },
    {
      id: 1,
      value: "Nav Link 2",
      path: "#",
    },
  ];

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || undefined;
  const session = useSession();
  const { data, status } = session;
  console.log(data);
  const content = (
    <div>
      <Button
        type="primary"
        onClick={() => signOut({ callbackUrl: "/" })}
        danger
      >
        Sign Out
      </Button>
    </div>
  );
  return (
    <>
      <nav>
        <ul className="flex gap-5">
          {nav.map((item) => (
            <li key={item.id}>{item.value}</li>
          ))}
        </ul>
      </nav>
      {status === "loading" && (
        <SkeletonAvatar
          active
          size={50}
          className="flex items-center h-[50px]"
          style={{ backgroundColor: "rgb(27 28 30)" }}
        />
      )}
      {status === "authenticated" && (
        <Popover content={content} title={data?.user?.name}>
          <Avatar src={data?.user?.image} size={50} />
        </Popover>
      )}
      {status === "unauthenticated" && (
        // <h1>qwe</h1>
        <Suspense>
          <Button
            type="primary"
            onClick={() => signIn("google", { callbackUrl })}
          >
            Sign In with Google
          </Button>
        </Suspense>
      )}
    </>
  );
};
export default Header;
