import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, CheckCta, FaqList, TableView } from "@/components/guide/GuideParts";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";
import { JsonLd } from "@/components/seo/JsonLd";
import { GUIDES, GUIDE_HUB, STD } from "@/lib/guides";
import { breadcrumbNode, faqNode, graph } from "@/lib/jsonld";
import { manwon } from "@/lib/rules/core";
import { abs, pageMeta } from "@/lib/seo";
import { br } from "@/lib/text";

export const metadata: Metadata = pageMeta({
  title: GUIDE_HUB.title,
  description: GUIDE_HUB.description,
  path: GUIDE_HUB.path,
});

const A = STD.assets;

const COMPARE = {
  caption: `표 1. ${STD.year}년 주택 유형별 자격 한눈에 보기`,
  head: ["유형", "주요 대상", "무주택", "소득 기준", "자산 기준"],
  wrap: true,
  rows: [
    ["행복주택", "청년·대학생·신혼부부·고령자", "청년 본인 / 그 외 세대", "월평균소득 100% (1인 120%)", `${manwon(A.happyYouth)} ~ ${manwon(A.rentGeneral)}`],
    ["국민임대", "무주택 세대", "세대", "70% (60㎡ 초과 100%)", manwon(A.rentGeneral)],
    ["영구임대", "수급자 등 · 소득 50% 이하", "세대", "50% (1인 70%)", `${manwon(A.permanent)} (확인 중)`],
    ["통합공공임대", "청년·신혼부부·고령자·일반", "청년 본인 / 그 외 세대", "기준 중위소득 150% (1인 170%)", manwon(A.rentGeneral)],
    ["매입임대", "청년·신혼부부·일반", "청년 본인 / 그 외 세대", "순위별 (청년 본인 100% 등)", "유형·순위별"],
    ["전세임대", "청년·신혼부부·일반", "청년 본인 / 그 외 세대", "신혼 Ⅱ 130% (맞벌이 200%)", `신혼 Ⅱ ${manwon(A.newhome)}`],
    ["청년안심주택", "만 19~39세 청년·신혼부부", "청년 본인 / 신혼 세대", "특별공급 120%", `청년 본인 ${manwon(A.happyYouth)}`],
    ["든든전세", "무주택 세대", "세대", "없음", "없음"],
    ["공공분양", "무주택 세대", "세대", "60㎡ 이하 100% (3인 이하 가구당)", `부동산 ${manwon(A.publicSaleSmall)}`],
    ["민영 아파트", "청약통장 가입자", "일반공급은 제한 약함", "없음 (특별공급 제외)", "없음"],
  ],
};

const SLUG_BY_NAME: Record<string, string> = {
  행복주택: "happy-housing",
  국민임대: "national-rental",
  영구임대: "permanent-rental",
  통합공공임대: "integrated-rental",
  매입임대: "purchase-rental",
  전세임대: "jeonse-rental",
  청년안심주택: "youth-safe-housing",
  든든전세: "deundeun-jeonse",
  공공분양: "public-sale",
  "민영 아파트": "private-apt",
};

const HUB_FAQ = [
  {
    q: "공공임대와 공공분양은 무엇이 다른가요?",
    a: "공공임대는 집을 빌려 살고(보증금·월세), 소득·자산 기준이 비교적 엄격합니다. 공공분양은 집을 사는 것으로, 청약통장 1순위 요건을 채워야 하고 전용 60㎡ 이하만 소득·자산을 봅니다.",
  },
  {
    q: "무주택은 본인 기준인가요, 세대 기준인가요?",
    a: "청년 계층(행복주택·통합공공임대·매입·전세임대 청년, 청년안심주택 청년형)은 본인만 무주택이면 됩니다. 신혼부부·고령자·일반 계층과 분양은 같은 주민등록의 세대원 모두가 무주택이어야 합니다.",
  },
  {
    q: "기준은 어느 날짜의 값을 쓰나요?",
    a: "입주자 모집공고일 기준입니다. 2026년 소득 기준은 2026년 1월 1일 이후 공고, 자산 기준은 2026년 2월 27일 이후 공고부터 새 값을 씁니다. 나이·혼인기간·거주기간도 공고일을 기준으로 셉니다.",
  },
];

function GuideCards({ category }: { category: "기준표" | "특별공급" }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
      {GUIDES.filter((g) => g.category === category).map((g) => (
        <Link
          key={g.slug}
          href={`/guide/${g.slug}`}
          className="flex min-h-[168px] flex-col rounded-[20px] bg-page p-6 shadow-card ring-1 ring-inset ring-line transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lift"
        >
          <span className="t-title text-ink">{g.short}</span>
          <span className="t-small mt-2 text-sub">{g.description.split(". ")[0]}.</span>
          <span className="t-caption mt-auto pt-4 text-muted">{g.facts.join(" · ")}</span>
        </Link>
      ))}
    </div>
  );
}

export default function GuideHub() {
  const url = abs(GUIDE_HUB.path);
  return (
    <>
      <SiteNav />
      <JsonLd
        data={graph([
          {
            "@type": "CollectionPage",
            "@id": `${url}#webpage`,
            url,
            name: GUIDE_HUB.title,
            description: GUIDE_HUB.description,
            inLanguage: "ko-KR",
            dateModified: GUIDE_HUB.updated,
            hasPart: GUIDES.map((g) => ({ "@type": "Article", name: g.h1, url: abs(`/guide/${g.slug}`) })),
          },
          breadcrumbNode([
            { name: "홈", path: "/" },
            { name: "청약 가이드", path: GUIDE_HUB.path },
          ]),
          faqNode(HUB_FAQ, url),
        ])}
      />
      <main className="wrap pb-20 pt-24 md:pb-28 md:pt-32">
        <Breadcrumbs items={[{ name: "홈", href: "/" }, { name: "청약 가이드" }]} />
        <header className="mt-8 max-w-[52em]">
          <p className="eyebrow">청약 가이드</p>
          <h1 className="t-display-l mt-3">{br("2026 청약·공공임대 | 자격 기준 한눈에 보기")}</h1>
          <p id="answer" className="t-body-l mt-5 max-w-[38em] text-body">
            {GUIDE_HUB.answer}
          </p>
          <p className="t-small mt-5 text-muted">
            최종 확인 <time dateTime={GUIDE_HUB.updated}>{GUIDE_HUB.updated}</time> · 법령·고시 원문 기준 · 공고문의 값이 우선합니다
          </p>
        </header>

        <section id="tables" className="mt-14 scroll-mt-24 md:mt-20">
          <h2 className="t-display-s">기준표와 계산기</h2>
          <div className="mt-8">
            <GuideCards category="기준표" />
          </div>
        </section>

        <section id="types" className="mt-14 scroll-mt-24 md:mt-20">
          <h2 className="t-display-s">{br("주택 유형별 자격은 | 어떻게 다른가요?")}</h2>
          <TableView table={COMPARE} />
          <ul className="mt-6 flex flex-wrap gap-2">
            {Object.entries(SLUG_BY_NAME).map(([name, slug]) => (
              <li key={slug}>
                <Link
                  href={`/guide/${slug}`}
                  className="inline-flex h-10 items-center rounded-full bg-page px-4 text-[14px] font-medium text-body ring-1 ring-inset ring-line transition-colors hover:text-brand hover:ring-brand"
                >
                  {name} 자격 조건
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section id="special" className="mt-14 scroll-mt-24 md:mt-20">
          <h2 className="t-display-s">특별공급</h2>
          <p className="t-body-l mt-4 max-w-[38em] text-body">
            신혼부부·생애최초·신생아·노부모부양 특별공급은 공공분양과 민영주택의 기준이 달라 나란히 비교했습니다. 다자녀 특별공급은 배점표 원문을 다시 확인한 뒤 공개합니다.
          </p>
          <div className="mt-8">
            <GuideCards category="특별공급" />
          </div>
        </section>

        <section id="faq" className="mt-14 scroll-mt-24 md:mt-20">
          <h2 className="t-display-s">자주 묻는 질문</h2>
          <div className="mt-5">
            <FaqList items={HUB_FAQ} />
          </div>
        </section>

        <div className="mt-14 md:mt-20">
          <CheckCta />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
