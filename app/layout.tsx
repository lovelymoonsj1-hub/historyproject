import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "역사탐험단 | 5학년 한국사", description: "시간을 건너 우리 역사를 만나는 한국사 학습 여행" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
