import type { Metadata, Viewport } from "next";
import { Noto_Serif_KR } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { graph, orgNode, websiteNode } from "@/lib/jsonld";
import { robotsFor } from "@/lib/seo";
import { SITE } from "@/lib/site";

// 헤드라인 세리프(Source Han Serif 계열). Google Fonts가 한글을 unicode-range 조각으로 나눠 주므로
// latin만 미리 불러오고 한글 조각은 쓰는 글자만 받는다. 본문은 Pretendard(동적 서브셋 CSS).
const serif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-serif-kr",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — ${SITE.tagline} | 청약·공공임대 자격 판정`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  robots: robotsFor(false),
  // canonical은 여기 두지 않는다(두면 선언 안 한 페이지가 전부 홈을 가리킨다) — 페이지마다 pageMeta로.
  alternates: { types: { "text/markdown": "/llms.txt", "application/rss+xml": "/guide/rss.xml" } },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "ko_KR",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: { card: "summary_large_image" },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: {
      ...(process.env.NAVER_SITE_VERIFICATION ? { "naver-site-verification": process.env.NAVER_SITE_VERIFICATION } : {}),
      ...(process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : {}),
    },
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0f1011",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={serif.variable}>
      <body className="min-h-dvh">
        <JsonLd data={graph([orgNode(), websiteNode()])} />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
