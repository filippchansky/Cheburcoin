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
            // colorBgElevated: `${darkTheme ? '#2d2d31' : 'white' }`,
            colorTextHeading: `${darkTheme ? 'white' : '#2d2d31'}`,
            colorText: `${darkTheme ? 'white' : 'black'}`,
            // colorText: `${darkTheme ? 'red' : 'black'}`,
        },
        components: {
            Modal: {
                headerBg: `${darkTheme? '#1B1C1E' : '#ffffff'}`,
                contentBg: `${darkTheme? 'rgb(27 28 30)' : '#ffffff'}`
            },
            Menu: {
                darkItemBg: '',
                itemBg: '',
                horizontalItemBorderRadius: 10,
            },
            Layout: {
                headerBg: `${darkTheme? 'black' : '#e0e0e0'}`,
                bodyBg: `${darkTheme? 'rgb(27 28 30)' : 'white'}`,
                colorFillContent: `${darkTheme? 'rgb(27 28 30)' : '#e0e0e0'}`
            },
            Input: {
                activeBg: `${darkTheme ? '#3a3a3d' : 'white' }`,
                colorBgContainer: `${darkTheme ? '#3a3a3d' : 'white' }`,
                warningActiveShadow	: `${darkTheme ? '#3a3a3d' : 'white' }`,
            }
        }
      }}>
        <SessionProvider>{children}</SessionProvider>
      </ConfigProvider>
    </AntdRegistry>
  );
};
export default Providers;
