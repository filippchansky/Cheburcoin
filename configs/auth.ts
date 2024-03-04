import { AuthOptions } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig: AuthOptions = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
        },
      },
    }),
  ],
};
