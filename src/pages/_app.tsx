import type { AppProps } from "next/app";
import MemberSession from "../components/MemberSession";

export default function App({ Component, pageProps, router }: AppProps) {
  if (["/LoginScreen", "/ForgotPasswordScreen", "/_error"].includes(router.pathname)) return <Component {...pageProps} />;
  return <MemberSession><Component {...pageProps} /></MemberSession>;
}
