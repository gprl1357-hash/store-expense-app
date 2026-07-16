import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { APP_TITLE, APP_TITLE_SHORT } from "@/lib/constants";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: APP_TITLE,
  description: `${APP_TITLE} - 함께 기록하고 관리하는 앱`,
  manifest: "/manifest.json",
  icons: {
    apple: "/icon-192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_TITLE_SHORT,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full`}>
      <body className="min-h-full bg-gray-50 font-sans text-xl antialiased">
        {children}
      </body>
    </html>
  );
}
