import type { Metadata } from "next";
import { APP_NAME } from "@/lib/branding";

export const metadata: Metadata = {
  title: `Sign up | ${APP_NAME}`,
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
