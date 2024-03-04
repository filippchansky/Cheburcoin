"use client"
import { useSession } from "next-auth/react";
import Image from "next/image";
import React from "react";

interface HeaderProps {}

const Header: React.FC<HeaderProps> = ({}) => {
  const nav = [
    {
      id: 0,
      value: "About",
      path: "about/",
    },
    {
      id: 1,
      value: "Nav Link 2",
      path: "/",
    },
  ];

  const session = useSession()
  console.log(session)
  const {data, status} = session
  return (
    <header className="bg-slate-400 flex justify-between p-5">
      <nav>
        <ul className="flex gap-5">
          {nav.map((item) => (
            <li key={item.id}>{item.value}</li>
          ))}
        </ul>
      </nav>
      <div>
        {/* TODO разобраться с картинкой и добавить loader из какой-нибудь ui библиотеки  */}
        {/* <Image src={data?.user?.image!} width={50} height={50}/> */}
            <p>{data?.user?.name}</p>

      </div>
    </header>
  );
};
export default Header;
