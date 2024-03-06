import { AuthOptions } from "next-auth";
import Google from "next-auth/providers/google";
import Yandex from "next-auth/providers/yandex";

export const authConfig: AuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      authorization: {
        params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code",
          },
      },
    }),
    Yandex({
      clientId: process.env.YANDEX_CLIENT_ID!,
      clientSecret: process.env.YANDEX_SECRET!,
    })
  ],
};
