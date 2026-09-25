import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/guide/GuideParts";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteNav } from "@/components/landing/SiteNav";
import { pageMeta } from "@/lib/seo";
import { PAGE_DATES, SITE } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "개인정보 처리 안내",
  description: `${SITE.name}은 입력한 조건을 서버로 보내지 않고 사용자의 브라우저에만 저장합니다.`,
  path: "/privacy",
});

const ITEMS = [
  {
    h: "무엇을 받나요?",
    p: "출생연도, 사는 시·도와 시·군·구, 혼인 상태, 자녀 수, 주택 소유 여부, 소득·자산·청약통장 구간 등 판정에 필요한 항목만 받습니다. 이름·주민등록번호·연락처·정확한 금액은 받지 않습니다.",
  },
  {
    h: "어디에 저장하나요?",
    p: `입력한 조건은 지금 쓰는 기기의 브라우저 저장소(localStorage)에만 저장하고, ${SITE.name} 서버로 보내지 않습니다. 판정 계산도 브라우저 안에서 합니다.`,
  },
  {
    h: "어떻게 지우나요?",
    p: "브라우저의 사이트 데이터를 지우면 입력한 조건이 모두 사라집니다. 다른 기기에는 남지 않습니다.",
  },
  {
    h: "제3자에게 제공하나요?",
    p: "받지 않은 정보는 제공할 수도 없습니다. 공고 정보는 공공데이터포털의 공식 API에서 가져오며, 이 과정에서 사용자 정보는 쓰이지 않습니다.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteNav />
      <main className="wrap pb-20 pt-28 md:pb-32 md:pt-40">
        <Breadcrumbs items={[{ name: "홈", href: "/" }, { name: "개인정보 처리 안내" }]} />
        <h1 className="t-display-l mt-8 text-pure">개인정보 처리 안내</h1>
        <p className="t-body-l mt-6 max-w-[38em] text-cloud">
          {SITE.name}은 입력한 조건을 서버로 보내지 않습니다. 모든 판정은 사용자의 브라우저 안에서 계산됩니다.
        </p>
        <div className="mt-12 max-w-[44em] space-y-10">
          {ITEMS.map((it) => (
            <section key={it.h}>
              <h2 className="t-title text-cloud">{it.h}</h2>
              <p className="t-body-l mt-3 text-mist">{it.p}</p>
            </section>
          ))}
        </div>
        <p className="t-small mt-16 text-dim">
          시행일 <time dateTime={PAGE_DATES.privacy}>{PAGE_DATES.privacy}</time>. 회원 가입·알림 같은 기능을 추가해 정보를 서버에 저장하게 되면 이 안내를 먼저 고치고 동의를 받습니다.
        </p>
      </main>
      <SiteFooter />
    </>
  );
}
