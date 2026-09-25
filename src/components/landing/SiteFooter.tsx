import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { GUIDES } from "@/lib/guides";
import { SITE } from "@/lib/site";
import { br } from "@/lib/text";

const COLS: { title: string; links: [string, string][] }[] = [
  {
    title: "서비스",
    links: [
      ["내 조건 넣기", "/check"],
      ["내 결과 보기", "/results"],
      ["이용 방법", "/#how"],
      ["자주 묻는 질문", "/#faq"],
    ],
  },
  {
    title: "기준표",
    links: GUIDES.filter((g) => g.category === "기준표").map((g) => [g.short, `/guide/${g.slug}`] as [string, string]),
  },
  {
    title: "주택 유형",
    links: GUIDES.filter((g) => g.category === "주택 유형")
      .slice(0, 6)
      .map((g) => [g.short, `/guide/${g.slug}`] as [string, string]),
  },
  {
    title: "특별공급",
    links: GUIDES.filter((g) => g.category === "특별공급").map((g) => [g.short.replace(" 특별공급", ""), `/guide/${g.slug}`] as [string, string]),
  },
];

export function SiteFooter() {
  return (
    <footer className="bg-wash">
      <div className="wrap pb-12 pt-14 md:pb-16 md:pt-16">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
          <div className="max-w-[30em]">
            <Logo />
            <p className="t-small mt-5 text-muted">
              {br(`${SITE.name}의 결과는 | 공고문과 「주택공급에 관한 규칙」, | 「공공주택 특별법 시행규칙」 기준으로 | 계산한 참고용이에요. | 최종 자격과 순위는 | 공급기관의 서류 심사로 정해져요.`)}
            </p>
            {SITE.sampleData && <p className="t-small mt-3 font-medium text-maybe-ink">공고 화면은 예시 데이터예요. 실제 공고가 아니에요.</p>}
          </div>
          <nav aria-label="사이트 지도" className="grid grid-cols-2 content-start gap-x-8 gap-y-10 sm:grid-cols-4">
            {COLS.map((c) => (
              <div key={c.title}>
                <p className="text-[14px] font-bold text-ink">{c.title}</p>
                <ul className="mt-4 space-y-3">
                  {c.links.map(([label, href]) => (
                    <li key={href + label}>
                      <Link href={href} className="t-small text-sub transition-colors hover:text-brand">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>
        <div className="t-caption mt-12 flex flex-col gap-3 border-t border-line pt-6 text-muted md:flex-row md:items-center md:justify-between">
          <p>© 2026 {SITE.name} · 공고 출처 청약홈 · 마이홈포털 · LH · HUG (공공데이터포털)</p>
          <Link href="/privacy" className="font-semibold text-sub hover:text-ink">
            개인정보 처리 안내
          </Link>
        </div>
      </div>
    </footer>
  );
}
