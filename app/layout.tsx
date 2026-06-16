import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FinanceProvider } from "@/hooks/useFinanceData";
import { Shell } from "@/components/Shell";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "WealthPlan — Personal Finance Dashboard",
  description: "Track income, expenses, savings, investments, and net worth.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <FinanceProvider>
          <Shell>{children}</Shell>
        </FinanceProvider>
      </body>
    </html>
  );
}
