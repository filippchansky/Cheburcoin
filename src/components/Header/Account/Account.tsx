import { Avatar, Button, Input, Modal, Popover, Space } from "antd";
import SkeletonAvatar from "antd/es/skeleton/Avatar";
import { signIn, signOut, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import React, { Suspense, useState } from "react";
import SwitchTeme from "../SwitchTeme/SwitchTeme";

interface AccountProps {}

const Account: React.FC<AccountProps> = ({}) => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || undefined;
  const session = useSession();
  const { data, status } = session;
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
            <Space direction="vertical">
              <Input placeholder="Basic usage" />
              <Space>
                <Input.Password
                  placeholder="input password"
                  visibilityToggle={{
                    visible: passwordVisible,
                    onVisibleChange: setPasswordVisible,
                  }}
                />

                <Button
                  type="primary"
                  style={{ width: 80 }}
                  onClick={() => setPasswordVisible((prevState) => !prevState)}
                >
                  {passwordVisible ? "Hide" : "Show"}
                </Button>
              </Space>
            </Space>
            <p>Some contents...</p>
          </Modal>
        </>
      )}
    </div>
  );
};
export default Account;
