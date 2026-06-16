import type { Metadata } from "next";
import { APP_NAME } from "@/lib/branding";

export const metadata: Metadata = {
  title: `Welcome | ${APP_NAME}`,
};

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
