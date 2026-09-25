import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/guide/GuideParts";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";
import { pageMeta } from "@/lib/seo";
import { PAGE_DATES, SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "개인정보 처리 안내",
  description: `${SITE.name}은 입력한 조건을 서버로 보내지 않고 쓰는 사람의 브라우저에만 저장해요.`,
  path: "/privacy",
});

const ITEMS = [
  {
    h: "무엇을 받나요?",
    p: "출생연도, 사는 시·도와 시·군·구, 혼인 상태, 자녀 수, 주택 소유 여부, 소득·자산·청약통장 구간처럼 결과 계산에 필요한 항목만 받아요. 소득은 원할 때만 정확한 금액을 적을 수 있어요. 이름·주민등록번호·연락처는 받지 않아요.",
  },
  {
    h: "어디에 저장하나요?",
    p: `입력한 조건은 지금 쓰는 기기의 브라우저 저장소(localStorage)에만 저장하고, ${SITE.name} 서버로 보내지 않아요. 결과 계산도 브라우저 안에서 해요.`,
  },
  {
    h: "어떻게 지우나요?",
    p: "브라우저의 사이트 데이터를 지우면 입력한 조건이 모두 사라져요. 다른 기기에는 남지 않아요.",
  },
  {
    h: "제3자에게 제공하나요?",
    p: "받지 않은 정보는 제공할 수도 없어요. 공고 정보는 공공데이터포털의 공식 API로 가져오고, 이 과정에서 사용자 정보는 쓰이지 않아요.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <main className="wrap pb-20 pt-24 md:pb-28 md:pt-32">
        <Breadcrumbs items={[{ name: "홈", href: "/" }, { name: "개인정보 처리 안내" }]} />
        <h1 className="t-h1 mt-6">개인정보 처리 안내</h1>
        <p className="t-body-l mt-5 max-w-[38em] text-body">
          {SITE.name}은 입력한 조건을 서버로 보내지 않아요. 모든 결과는 쓰는 사람의 브라우저 안에서 계산돼요.
        </p>
        <div className="mt-10 max-w-[48em] border-t border-ink">
          {ITEMS.map((it) => (
            <section key={it.h} className="grid gap-2 border-b border-line py-5 md:grid-cols-[12em_minmax(0,1fr)] md:gap-6">
              <h2 className="t-h3 text-ink">{it.h}</h2>
              <p className="t-body text-body">{it.p}</p>
            </section>
          ))}
        </div>
        <p className="t-small mt-10 max-w-[56em] text-muted">
          시행일 <time dateTime={PAGE_DATES.privacy}>{PAGE_DATES.privacy}</time>. 회원 가입·알림 같은 기능을 더해 정보를 서버에 저장하게 되면 이 안내를 먼저 고치고 동의를 받을게요.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
