"use client";
import { Button, Checkbox, Flex, Input, Space } from "antd";
import React, { useState } from "react";
import {
  useAuthState,
  useSignInWithEmailAndPassword,
} from "react-firebase-hooks/auth";
import { auth } from "../../../../configs/firebase/config";
import style from "./style.module.scss";

interface SignInProps {
  setActiveModal: Function;
}

const SignIn: React.FC<SignInProps> = ({ setActiveModal }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  //   const [error, setError] = useState("");
  //   console.log(error);
  const [user, loading] = useAuthState(auth);
  const [SignInWithEmailAndPassword] = useSignInWithEmailAndPassword(auth);
  const handleSignIn = async () => {
    await SignInWithEmailAndPassword(email, password)
      .then((res) => console.log(res))
      .catch((err) => console.error({ err }));

    if (user) {
      console.log("object");
      setActiveModal(false);
    }
  };

  return (
    <Space direction="vertical">
      <Input
        value={email}
        placeholder="Basic usage"
        onChange={(e) => setEmail(e.target.value)}
      />
      <Flex gap={10}>
        <Input.Password
          value={password}
          className={style.input_pass}
          placeholder="input password"
          visibilityToggle={{
            visible: passwordVisible,
            onVisibleChange: setPasswordVisible,
          }}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          type="default"
          style={{ width: 80 }}
          onClick={() => setPasswordVisible((prevState) => !prevState)}
        >
          {passwordVisible ? "Hide" : "Show"}
        </Button>
      </Flex>
      <Checkbox onChange={() => console.log()}>Remember me</Checkbox>
      <Button type="primary" onClick={handleSignIn}>
        Sign in
      </Button>
    </Space>
  );
};
export default SignIn;
