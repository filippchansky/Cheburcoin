"use client";
import { useDarkTheme } from "@/store/darkTheme";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import { SessionProvider } from "next-auth/react";
import React from "react";

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers: React.FC<ProvidersProps> = ({ children }) => {

    const {darkTheme} = useDarkTheme()

  return (
    <AntdRegistry>
      <ConfigProvider theme={{
        token: {
            colorBgElevated: `${darkTheme ? '#2d2d31' : 'white' }`,
            colorTextHeading: `${darkTheme ? 'white' : '#2d2d31'}`
        },
        components: {
            Popover: {

            }
        }
      }}>
        <SessionProvider>{children}</SessionProvider>
      </ConfigProvider>
    </AntdRegistry>
  );
};
export default Providers;
