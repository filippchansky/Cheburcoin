import Cryptoccurency from "@/components/Cryptocurrency/Cryptocurrency/Cryptoccurency";
import News from "@/components/Cryptocurrency/News/News";
import React from "react";
import style from "./style.module.scss";
import CryptoPage from "@/components/Cryptocurrency/CryptoPage";

interface PageProps {}

const Page: React.FC<PageProps> = ({}) => {
  const TOKEN = process.env.COIN!;
  return (
    <CryptoPage TOKEN={TOKEN}/>
  );
};
export default Page;
