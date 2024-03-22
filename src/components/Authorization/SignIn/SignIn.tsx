"use client";
import {
  Button,
  Checkbox,
  Flex,
  Input,
  Space,
  Typography,
  notification,
} from "antd";
import React, { useState } from "react";
import {
  useAuthState,
  useSignInWithEmailAndPassword,
  useSignInWithEmailLink,
} from "react-firebase-hooks/auth";
import { auth } from "../../../../configs/firebase/config";
import style from "./style.module.scss";
import { NotificationPlacement } from "antd/es/notification/interface";
import { BorderTopOutlined } from "@ant-design/icons";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

interface SignInProps {
  setActiveModal: Function;
}

const SignIn: React.FC<SignInProps> = ({ setActiveModal }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState(false);
  // const [user, loading] = useAuthState(auth);
  const auth = getAuth();
  const [api, contextHolder] = notification.useNotification();

  const openNotification = (placement: NotificationPlacement) => {
    api.error({
      message: `Error`,
      description: "Invalid Email or password, please, try again!",
      placement,
    });
  };
  const fetchData = async () => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      console.log(res);
      return res;
    } catch (error) {
      console.log(typeof error);
      throw error;
    }
  };
  // console.log(email, password, user);
  // const [SignInWithEmailAndPassword] = useSignInWithEmailAndPassword(auth);
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // const res = await SignInWithEmailAndPassword(email, password);
    // if (!res) {
    //   openNotification("top");
    //   setError(true);
    // }
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode)
      });
  };

  return (
    <>
      {contextHolder}

      <form onSubmit={(e) => handleSignIn(e)}>
        <Space direction="vertical">
          <Input
            status={error ? "error" : ""}
            value={email}
            placeholder="Basic usage"
            onChange={(e) => {
              setEmail(e.target.value);
              setError(false);
            }}
          />
          <Flex gap={10}>
            <Input.Password
              status={error ? "error" : ""}
              value={password}
              className={style.input_pass}
              placeholder="input password"
              visibilityToggle={{
                visible: passwordVisible,
                onVisibleChange: setPasswordVisible,
              }}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
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
          <Button type="primary" htmlType="submit">
            Sign in
          </Button>
        </Space>
      </form>
    </>
  );
};
export default SignIn;
