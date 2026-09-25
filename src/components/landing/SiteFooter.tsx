import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { GUIDES } from "@/lib/guides";
import { SITE } from "@/lib/site";

const COLS: { title: string; links: [string, string][] }[] = [
  {
    title: "서비스",
    links: [
      ["내 조건 넣기", "/check"],
      ["내 결과 보기", "/results"],
      ["자주 묻는 질문", "/#faq"],
      ["개인정보 처리 안내", "/privacy"],
    ],
  },
  {
    title: "기준표",
    links: GUIDES.filter((g) => g.category === "기준표").map((g) => [g.short, `/guide/${g.slug}`] as [string, string]),
  },
  {
    title: "주택 유형",
    links: GUIDES.filter((g) => g.category === "주택 유형").map((g) => [g.short, `/guide/${g.slug}`] as [string, string]),
  },
  {
    title: "특별공급",
    links: GUIDES.filter((g) => g.category === "특별공급").map((g) => [g.short.replace(" 특별공급", ""), `/guide/${g.slug}`] as [string, string]),
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-ink">
      <div className="wrap pb-12 pt-10 md:pb-16 md:pt-12">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <Logo />
            <p className="t-small mt-4 max-w-[26em] text-sub">
              공고문과 「주택공급에 관한 규칙」, 「공공주택 특별법 시행규칙」 기준으로 계산한 참고용 결과예요. 최종 자격과 순위는 공급기관의 서류 심사로
              정해져요.
            </p>
            {SITE.sampleData && <p className="t-small mt-3 font-semibold text-maybe-ink">공고 화면은 예시 데이터예요. 실제 공고가 아니에요.</p>}
          </div>
          <nav aria-label="사이트 지도" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:col-span-8">
            {COLS.map((c) => (
              <div key={c.title}>
                <p className="text-[13px] font-semibold text-muted">{c.title}</p>
                <ul className="mt-3 space-y-2">
                  {c.links.map(([label, href]) => (
                    <li key={href + label}>
                      <Link href={href} className="t-small text-body hover:text-ink hover:underline">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <p className="t-caption mt-12 border-t border-line pt-5 text-muted">
          © 2026 {SITE.name} · {SITE.sampleData ? "지금은 예시 공고예요. 공공데이터포털 연결 후 청약홈·마이홈포털·LH·HUG 공고로 바뀌어요" : "공고 출처 청약홈·마이홈포털·LH·HUG(공공데이터포털)"}
        </p>
      </div>
    </footer>
  );
}
