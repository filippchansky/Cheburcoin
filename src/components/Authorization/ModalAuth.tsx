"use client";
import {
  Button,
  Checkbox,
  Flex,
  Input,
  Modal,
  Space,
  Tabs,
  TabsProps,
} from "antd";
import googleIconDark from "@public/Icon/google_auth_dark.png";
import googleIconLight from "@public/Icon/google_auth_light.png";
import yandexIcon from "@public/Icon/yandex.png";
import Image from "next/image";
import { useDarkTheme } from "@/store/darkTheme";
import style from "./style.module.scss";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth } from "../../../configs/firebase/config";
import SignIn from "./SignIn/SignIn";
import SignUp from "./SignUp/SignUp";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

interface ModalAuthProps {
  active: boolean;
  setActive: Function;
}

const ModalAuth: React.FC<ModalAuthProps> = ({ active, setActive }) => {
  const { darkTheme } = useDarkTheme();

  const onChange = (key: string) => {
    console.log(key);
  };

  const items: TabsProps["items"] = [
    {
      key: "1",
      label: "Sign In",
      children: <SignIn setActiveModal={setActive} />,
    },
    {
      key: "2",
      label: "Sign Up",
      children: <SignUp />,
    },
  ];

  //   console.log({ email }, { password });
  const handleOk = () => {
    setActive(false);
  };

  const googleAuth = async () => {
    const provider = await new GoogleAuthProvider()

    return signInWithPopup(auth, provider)
  }

  const handleCancel = () => {
    setActive(false);
  };
  return (
    <Modal
      title="Sign In"
      open={active}
      onOk={handleOk}
      onCancel={handleCancel}
      footer={null}
      centered
    >
      <div
        className={
          darkTheme
            ? [style.modal_content, style.darkMode].join(" ")
            : [style.modal_content, style.lightMode].join(" ")
        }
      >
        <Tabs defaultActiveKey="1" items={items} onChange={onChange} />
        {/* signin */}
        <Flex vertical gap={19}>
          <h2>Or sign in with</h2>
          <div className={style.signIn_with}>
            <button onClick={() => googleAuth()}>
              <Image
                src={darkTheme ? googleIconDark : googleIconLight}
                alt={""}
                width={32}
                height={32}
              />
            </button>
            {/* <button onClick={() => signIn("yandex", { callbackUrl: "/" })}>
              <Image
                src={darkTheme ? yandexIcon : yandexIcon}
                alt={""}
                width={32}
                height={32}
              />
            </button> */}
          </div>
        </Flex>
      </div>
    </Modal>
  );
};
export default ModalAuth;
