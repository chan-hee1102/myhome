import type { Metadata, Viewport } from "next";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import { MotionProvider } from "@/components/motion/MotionProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { graph, orgNode, websiteNode } from "@/lib/jsonld";
import { robotsFor } from "@/lib/seo";
import { SITE } from "@/lib/site";

// 글꼴은 Pretendard 한 벌(동적 서브셋 CSS — 쓰는 글자 조각만 받는다).
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
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko">
      <body className="min-h-dvh">
        <JsonLd data={graph([orgNode(), websiteNode()])} />
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
