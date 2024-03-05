"use client";
import React, { useEffect, useState } from "react";
import { Layout, Flex } from "antd";
import Header from "../Header/Header";
import { useDarkTheme } from "@/store/darkTheme";

const { Header: HeaderLayout, Footer, Sider, Content } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { darkTheme } = useDarkTheme();
  const [colors, setColors] = useState({
    text: "#fff",
    bgHeader: "black",
    bgContent: "rgb(27 28 30)",
  });

  useEffect(() => {
    if (!darkTheme) {
      setColors({
        ...colors,
        bgContent: "white",
        text: "black",
        bgHeader: "#e0e0e0",
      });
    } else {
      setColors({
        ...colors,
        text: "#fff",
        bgHeader: "black",
        bgContent: "rgb(27 28 30)",
      });
    }
  }, [darkTheme]);

  const headerStyle: React.CSSProperties = {
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    color: colors.text,
    height: "100px",
    paddingInline: 48,
    lineHeight: "64px",
    backgroundColor: colors.bgHeader,
    transition: 'background ease-out .5s, color ease-out 1s',
  };

  const contentStyle: React.CSSProperties = {
    textAlign: "center",
    minHeight: "calc(100vh - 100px)",
    lineHeight: "120px",
    color: colors.text,
    backgroundColor: colors.bgContent,
    transition: 'background ease-out .5s, color ease-out .5s',
  };

  const layoutStyle = {
    borderRadius: 8,
    overflow: "hidden",
    width: "100vw",
    maxWidth: "100vw",
  };

  return (
    <Flex gap="middle" wrap="wrap">
      <Layout style={layoutStyle}>
        <HeaderLayout style={headerStyle}>
          <Header />
        </HeaderLayout>
        <Content style={contentStyle}>{children}</Content>
      </Layout>
    </Flex>
  );
};
export default MainLayout;
