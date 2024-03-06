import {
  Avatar,
  Button,
  Checkbox,
  Flex,
  Input,
  Modal,
  Popover,
  Space,
} from "antd";
import style from "./style.module.scss";
import SkeletonAvatar from "antd/es/skeleton/Avatar";
import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import SwitchTeme from "../SwitchTeme/SwitchTeme";
import googleIconDark from "@public/Icon/google_auth_dark.png";
import googleIconLight from "@public/Icon/google_auth_light.png";
import yandexIcon from "@public/Icon/yandex.png"
import Image from "next/image";
import { useDarkTheme } from "@/store/darkTheme";

interface AccountProps {}

const Account: React.FC<AccountProps> = ({}) => {
  const { darkTheme } = useDarkTheme();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || undefined;
  const session = useSession();
  const { data, status } = session;
  console.log({session});
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  const handlerSignOut = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    e.preventDefault();
    signOut({ callbackUrl: "/" });
  };

  const content = (
    <div>
      <Button type="primary" onClick={(e) => handlerSignOut(e)} danger>
        Sign Out
      </Button>
    </div>
  );

  return (
    <div className="flex items-center gap-5">
      <SwitchTeme />
      {status === "loading" && (
        <SkeletonAvatar
          active
          size={50}
          className="flex items-center h-[50px]"
          style={{ backgroundColor: "rgb(27 28 30)" }}
        />
      )}
      {status === "authenticated" && (
        <Popover content={content} title={data?.user?.name} trigger="click">
          <Avatar
            className="cursor-pointer"
            src={data?.user?.image}
            size={50}
          />
        </Popover>
      )}
      {status === "unauthenticated" && (
        // <h1>qwe</h1>
        <>
          <Suspense>
            <Button
              type="primary"
              //   onClick={() => signIn("google", { callbackUrl })}
              onClick={showModal}
            >
              Sign In
            </Button>
          </Suspense>
          <Modal
            title="Sign In"
            open={isModalOpen}
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
              <Space direction="vertical">
                <Input placeholder="Basic usage" />
                <Flex gap={10}>
                  <Input.Password
                    className={style.input_pass}
                    placeholder="input password"
                    visibilityToggle={{
                      visible: passwordVisible,
                      onVisibleChange: setPasswordVisible,
                    }}
                  />

                  <Button
                    type="default"
                    style={{ width: 80 }}
                    onClick={() =>
                      setPasswordVisible((prevState) => !prevState)
                    }
                  >
                    {passwordVisible ? "Hide" : "Show"}
                  </Button>
                </Flex>
                <Checkbox onChange={() => console.log()}>Remember me</Checkbox>
                <Button type="primary" disabled>
                  Sign in
                </Button>
              </Space>
              <Flex vertical gap={19}>
                <h2>Or sign in with</h2>
                <div className={style.signIn_with}>
                  <button
                    onClick={() => signIn("google", { callbackUrl: "/about" })}
                  >
                    <Image
                      src={darkTheme ? googleIconDark : googleIconLight}
                      alt={""}
                      width={32}
                      height={32}
                    />
                  </button>
                  <button onClick={() => signIn("yandex", {callbackUrl: '/'})}>
                    <Image
                      src={darkTheme ? yandexIcon : yandexIcon}
                      alt={""}
                      width={32}
                      height={32}
                    />
                  </button>
                </div>
              </Flex>
            </div>
          </Modal>
        </>
      )}
    </div>
  );
};
export default Account;
