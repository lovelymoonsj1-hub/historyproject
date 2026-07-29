import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "역주행 | 역사를 주도하는 시간 여행",
  description: "초등 5학년 한국사를 시대·인물·사건·문화유산의 연결로 탐색하는 학습 웹앱",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
