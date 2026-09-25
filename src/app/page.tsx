import type { Metadata } from "next";
import { AudienceTiles } from "@/components/landing/AudienceTiles";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { GuideLinks } from "@/components/landing/GuideLinks";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Problem } from "@/components/landing/Problem";
import { ScoreLab } from "@/components/landing/ScoreLab";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";
import { SourceMarquee } from "@/components/landing/SourceMarquee";
import { VerdictTrio } from "@/components/landing/VerdictTrio";
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
        <SourceMarquee />
        <Problem />
        <HowItWorks />
        <AudienceTiles />
        <VerdictTrio />
        <ScoreLab />
        <GuideLinks />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
