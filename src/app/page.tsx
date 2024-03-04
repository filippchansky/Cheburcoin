import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="">
      <Link href={'api/auth/signin'}>
        Sign In
      </Link>
    </main>
  );
}
