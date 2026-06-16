import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { FinanceProvider } from "@/hooks/useFinanceData";
import { HouseholdProvider } from "@/hooks/useHousehold";
import { Shell } from "@/components/Shell";
import { PwaProvider } from "@/components/PwaProvider";
import { PWA_CONFIG, PWA_ICON_PATHS } from "@/lib/pwa/config";
import { APP_NAME } from "@/lib/branding";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s | ${APP_NAME}`,
  },
  description: PWA_CONFIG.description,
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: PWA_ICON_PATHS.icon192, sizes: "192x192", type: "image/png" },
      { url: PWA_ICON_PATHS.icon512, sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: PWA_ICON_PATHS.appleTouch, sizes: "180x180", type: "image/png" }],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": APP_NAME,
    "application-name": APP_NAME,
  },
};

export const viewport: Viewport = {
  themeColor: PWA_CONFIG.themeColor,
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href={PWA_ICON_PATHS.appleTouch} />
        <meta name="application-name" content={APP_NAME} />
        <meta name="apple-mobile-web-app-title" content={APP_NAME} />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <PwaProvider>
          <FinanceProvider>
            <HouseholdProvider>
              <Shell>{children}</Shell>
            </HouseholdProvider>
          </FinanceProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
