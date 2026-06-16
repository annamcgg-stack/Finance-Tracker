import type { Metadata } from "next";
import { APP_NAME } from "@/lib/branding";

export const metadata: Metadata = {
  title: APP_NAME,
};

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
