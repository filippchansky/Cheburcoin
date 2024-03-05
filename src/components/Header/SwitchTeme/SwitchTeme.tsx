import { useDarkTheme } from "@/store/darkTheme";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Switch } from "antd";
import React, { useState } from "react";

interface SwitchTemeProps {}

const SwitchTeme: React.FC<SwitchTemeProps> = ({}) => {
  const {darkTheme, setTheme} = useDarkTheme()
  const handlerChange = (
    checked: boolean,
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    setTheme(checked)
  };

  return (
    <Switch
      checkedChildren={<MoonOutlined />}
      unCheckedChildren={<SunOutlined />}
      checked={darkTheme}
      onChange={(checked, e) => handlerChange(checked, e)}
    />
  );
};
export default SwitchTeme;
