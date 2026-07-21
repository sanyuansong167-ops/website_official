import type { Metadata } from "next";
import "@/styles/global.css";

export const metadata: Metadata = {
  title: {
    default: "云台数据",
    template: "%s | 云台数据",
  },
  description: "武汉云台数据有限公司官网",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
