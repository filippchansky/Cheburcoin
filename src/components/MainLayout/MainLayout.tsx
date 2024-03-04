"use client";
import React from "react";
import { Layout, Flex } from "antd";
import Header from "../Header/Header";

const { Header: HeaderLayout, Footer, Sider, Content } = Layout;

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between', 
  color: "#fff",
  height: '100px',
  paddingInline: 48,
  lineHeight: "64px",
  backgroundColor: "black",
};

const contentStyle: React.CSSProperties = {
  textAlign: "center",
  minHeight: 'calc(100vh - 100px)',
  lineHeight: "120px",
  color: "#fff",
  backgroundColor: "rgb(27 28 30)",
};

const layoutStyle = {
  borderRadius: 8,
  overflow: "hidden",
  width: "100vw",
  maxWidth: "100vw",
};

interface MainLayoutProps {
    children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({children}) => {
  return (
    <Flex gap="middle" wrap="wrap">
      <Layout style={layoutStyle}>
        <HeaderLayout style={headerStyle}><Header/></HeaderLayout>
        <Content style={contentStyle}>{children}</Content>
      </Layout>
    </Flex>
  );
};
export default MainLayout;
