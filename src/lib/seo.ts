import type { Metadata } from "next";
import { SITE } from "./site";

/**
 * 페이지 메타데이터 한 벌. Next metadata는 얕게 병합되므로(openGraph를 주면 통째로 교체)
 * siteName·locale·url을 매번 모두 넣는다. canonical은 루트 레이아웃에 두지 않는다 — 두면 선언 안 한 페이지가 전부 홈을 가리킨다.
 */
export function pageMeta({
  title,
  description,
  path,
  noindex = false,
  type = "website",
  modified,
}: {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
  type?: "website" | "article";
  modified?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: robotsFor(noindex),
    openGraph: {
      type,
      url: path,
      siteName: SITE.name,
      locale: "ko_KR",
      title,
      description,
      ...(type === "article" && modified ? { modifiedTime: modified } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function robotsFor(noindex: boolean): Metadata["robots"] {
  if (noindex || !SITE.indexable) return { index: false, follow: true };
  return {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large", "max-video-preview": -1 },
  };
}

export const abs = (path: string) => `${SITE.url}${path}`;
