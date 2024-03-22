"use client";
import {
  Button,
  Checkbox,
  Flex,
  Input,
  Space,
  Tooltip,
  notification,
} from "antd";
import style from "./style.module.scss";
import { FormEvent, useState } from "react";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth } from "../../../../configs/firebase/config";
import { NotificationPlacement } from "antd/es/notification/interface";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";

interface SignUpProps {}

const SignUp: React.FC<SignUpProps> = ({}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const [errorMessage, setErrorMessage] = useState("");
  const [error, setError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const auth = getAuth();
  const validRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const openNotification = (placement: NotificationPlacement) => {
    api.error({
      message: `Error`,
      description: "Email is exict!",
      placement,
    });
  };

  // const [createUserWithEmailAndPassword] =
  //   useCreateUserWithEmailAndPassword(auth);

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Signed up
        const user = userCredential.user;
        // ...
      })
      .catch((error) => {
        const errorCode = error.code;
        setErrorMessage(error.message);
        openNotification("top");
      });
  };

  return (
    <>
      {contextHolder}
      <form onSubmit={(e) => handleSignUp(e)}>
        <Space direction="vertical">
          <Tooltip
            trigger={["focus"]}
            title={emailError ? "Invalid email" : undefined}
            placement="topLeft"
            overlayClassName="numeric-input"
          >
            <Input
              status={emailError ? "error" : ""}
              defaultValue={email}
              placeholder="Basic usage"
              onChange={(e) => {
                setEmail(e.target.value);
                if (!e.target.value.toLowerCase().match(validRegex)) {
                  setEmailError(true);
                }
                if (e.target.value.toLowerCase().match(validRegex)) {
                  setEmailError(false);
                }
              }}
            />
          </Tooltip>
          <Flex gap={10}>
            <Input.Password
              defaultValue={password}
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
          <Flex gap={10}>
            <Input.Password
              status={confirmPassword === password ? "" : "error"}
              defaultValue={confirmPassword}
              className={style.input_pass}
              placeholder="Confirm password"
              visibilityToggle={{
                visible: confirmPasswordVisible,
                onVisibleChange: setConfirmPasswordVisible,
              }}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              type="default"
              style={{ width: 80 }}
              onClick={() =>
                setConfirmPasswordVisible((prevState) => !prevState)
              }
            >
              {confirmPasswordVisible ? "Hide" : "Show"}
            </Button>
          </Flex>
          <Checkbox onChange={() => console.log()}>Remember me</Checkbox>
          <Button
            type="primary"
            htmlType="submit"
            disabled={!(confirmPassword === password && !emailError)}
          >
            Sign in
          </Button>
        </Space>
      </form>
    </>
  );
};
export default SignUp;
