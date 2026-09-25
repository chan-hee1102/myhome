import type { Metadata } from "next";
import { DeadlineBoard } from "@/components/landing/DeadlineBoard";
import { Hero } from "@/components/landing/Hero";
import { NoticeReader } from "@/components/landing/NoticeReader";
import { ScoreLab } from "@/components/landing/ScoreLab";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";
import { Standards } from "@/components/landing/Standards";
import { WhoWhat } from "@/components/landing/WhoWhat";
import { JsonLd } from "@/components/seo/JsonLd";
import { HOME_FAQ } from "@/lib/faq";
import { appNode, faqNode, graph } from "@/lib/jsonld";
import { abs, pageMeta } from "@/lib/seo";
import { PAGE_DATES, SITE } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMeta({
    title: `${SITE.name} — ${SITE.tagline} | 청약·공공임대 자격 판정`,
    description: SITE.description,
    path: "/",
  }),
  // 홈은 템플릿(「| 청약핏」)을 붙이지 않는다
  title: { absolute: `${SITE.name} — ${SITE.tagline} | 청약·공공임대 자격 판정` },
};

export default function Home() {
  return (
    <>
      <SiteNav />
      <JsonLd
        data={graph([
          {
            "@type": "WebPage",
            "@id": abs("/#webpage"),
            url: abs("/"),
            name: `${SITE.name} — ${SITE.tagline}`,
            description: SITE.description,
            inLanguage: "ko-KR",
            dateModified: PAGE_DATES.home,
            about: { "@id": abs("/#app") },
          },
          appNode(),
          faqNode(HOME_FAQ, abs("/")),
        ])}
      />
      <main>
        <Hero />
        <DeadlineBoard />
        <NoticeReader />
        <WhoWhat />
        <ScoreLab />
        <Standards />
      </main>
      <SiteFooter />
    </>
  );
}
