import CryptoPage from "@/components/Cryptocurrency/CryptoPage";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const TOKEN = process.env.COIN!;
  return (
    <main>
    <CryptoPage TOKEN={TOKEN}/>
    </main>
  );
}
