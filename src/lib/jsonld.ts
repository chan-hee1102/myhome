import type { Guide } from "./guides";
import { GUIDE_HUB } from "./guides";
import { abs } from "./seo";
import { SITE } from "./site";

/**
 * 구조화 데이터(JSON-LD). 층 구조: 모든 페이지(Organization·WebSite) → 페이지별(WebApplication·Article·FAQ·Breadcrumb·Dataset).
 * 없는 사실(리뷰·평점·가짜 저자)은 넣지 않는다.
 */
type Node = Record<string, unknown>;

const ORG_ID = abs("/#org");
const SITE_ID = abs("/#website");
const APP_ID = abs("/#app");

export function orgNode(): Node {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE.name,
    alternateName: SITE.nameEn,
    url: abs("/"),
    logo: { "@type": "ImageObject", url: abs("/icon.svg") },
    description: SITE.description,
  };
}

export function websiteNode(): Node {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    name: SITE.name,
    url: abs("/"),
    inLanguage: "ko-KR",
    publisher: { "@id": ORG_ID },
  };
}

export function appNode(): Node {
  return {
    "@type": "WebApplication",
    "@id": APP_ID,
    name: `${SITE.name} 청약 자격 판정`,
    url: abs("/check"),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    browserRequirements: "JavaScript 필요",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" },
    featureList: ["여섯 가지 질문으로 조건 입력", "공고별 신청 가능·확인 필요·해당 없음 판정", "예상 순위 계산", "민영주택 가점 84점 계산"],
    inLanguage: "ko-KR",
    publisher: { "@id": ORG_ID },
  };
}

export function faqNode(qas: { q: string; a: string }[], id: string): Node {
  return {
    "@type": "FAQPage",
    "@id": `${id}#faq`,
    mainEntity: qas.map((x) => ({ "@type": "Question", name: x.q, acceptedAnswer: { "@type": "Answer", text: x.a } })),
  };
}

export function breadcrumbNode(items: { name: string; path: string }[]): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function guideNodes(g: Guide): Node[] {
  const url = abs(`/guide/${g.slug}`);
  const nodes: Node[] = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: g.title,
      isPartOf: { "@id": SITE_ID },
      inLanguage: "ko-KR",
      dateModified: g.updated,
      speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "#answer"] },
      primaryImageOfPage: { "@type": "ImageObject", url: `${url}/opengraph-image` },
    },
    {
      "@type": "Article",
      "@id": `${url}#article`,
      headline: g.h1,
      description: g.description,
      abstract: g.answer,
      datePublished: g.published,
      dateModified: g.updated,
      inLanguage: "ko-KR",
      author: { "@id": ORG_ID },
      publisher: { "@id": ORG_ID },
      mainEntityOfPage: { "@id": `${url}#webpage` },
      image: `${url}/opengraph-image`,
      articleSection: g.category,
      citation: g.sources.map((s) =>
        s.law
          ? { "@type": "Legislation", name: s.label, legislationIdentifier: s.law.id, legislationDate: s.law.date, legislationJurisdiction: "KR", url: s.url }
          : { "@type": "CreativeWork", name: s.label, url: s.url },
      ),
    },
    breadcrumbNode([
      { name: "홈", path: "/" },
      { name: "청약 가이드", path: GUIDE_HUB.path },
      { name: g.short, path: `/guide/${g.slug}` },
    ]),
  ];
  if (g.faq.length) nodes.push(faqNode(g.faq, url));
  if (g.dataset) {
    nodes.push({
      "@type": "Dataset",
      "@id": `${url}#dataset`,
      name: g.dataset.name,
      description: g.dataset.description,
      url: `${url}#${g.dataset.anchor}`,
      creator: { "@id": ORG_ID },
      isBasedOn: g.sources.map((s) => s.url),
      temporalCoverage: `${g.updated.slice(0, 4)}-01-01/${g.updated.slice(0, 4)}-12-31`,
      spatialCoverage: { "@type": "Place", name: "대한민국" },
      variableMeasured: g.dataset.variables.map((v) => ({ "@type": "PropertyValue", name: v })),
      dateModified: g.updated,
      inLanguage: "ko-KR",
    });
  }
  return nodes;
}

export function graph(nodes: Node[]) {
  return { "@context": "https://schema.org", "@graph": nodes };
}
