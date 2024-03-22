"use client";
import { Button, Checkbox, Flex, Input, Space } from "antd";
import style from "./style.module.scss";
import { useState } from "react";
import { useCreateUserWithEmailAndPassword } from "react-firebase-hooks/auth";
import { auth } from "../../../../configs/firebase/config";

interface SignUpProps {}

const SignUp: React.FC<SignUpProps> = ({}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [createUserWithEmailAndPassword] =
    useCreateUserWithEmailAndPassword(auth);
  const handleSignUp = async () => {
    createUserWithEmailAndPassword(email, password)
      .then((res) => console.log(res))
      .catch((error) => console.log(error.message));
  };

  return (
    <Space direction="vertical">
      <Input
        defaultValue={email}
        placeholder="Basic usage"
        onChange={(e) => setEmail(e.target.value)}
      />
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
          defaultValue={confirmPassword}
          className={style.input_pass}
          placeholder="Confirm password"
          visibilityToggle={{
            visible: passwordVisible,
            onVisibleChange: setPasswordVisible,
          }}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
      <Button type="primary" onClick={handleSignUp}>
        Sign in
      </Button>
    </Space>
  );
};
export default SignUp;
