import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/QueryProvider";

export const metadata: Metadata = {
  title: "SmartInvest | 智能投资终端",
  description: "股票与基金智能推荐及分析 Dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body suppressHydrationWarning><QueryProvider>{children}</QueryProvider></body></html>;
}
