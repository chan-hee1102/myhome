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
      ["판정 결과", "/results"],
      ["판정 방식", "/#how"],
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
    <footer className="wrap pb-12 pt-16 md:pb-16 md:pt-20">
      <div className="grid gap-12 border-t border-line pt-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16">
        <div className="max-w-[30em]">
          <Logo />
          <p className="t-small mt-5 text-ash">
            {br(`${SITE.name}의 판정은 | 공고문과 「주택공급에 관한 규칙」·「공공주택 특별법 시행규칙」 기준을 | 바탕으로 한 참고용 계산이에요. | 최종 자격과 순위는 | 공급기관의 서류 심사로 정해져요.`)}
          </p>
          {SITE.sampleData && <p className="t-small mt-3 text-maybe">공고 화면은 예시 데이터예요. 실제 공고가 아니에요.</p>}
        </div>
        <nav aria-label="사이트 지도" className="grid grid-cols-2 content-start gap-x-8 gap-y-10 sm:grid-cols-4">
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="t-caption text-dim">{c.title}</p>
              <ul className="mt-4 space-y-3">
                {c.links.map(([label, href]) => (
                  <li key={href + label}>
                    <Link href={href} className="t-small text-mist transition-colors hover:text-pure">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="t-caption mt-14 flex flex-col gap-3 text-dim md:flex-row md:items-center md:justify-between">
        <p>© 2026 {SITE.name} · 공고 출처 청약홈 · 마이홈포털 · LH · HUG (공공데이터포털)</p>
        <Link href="/privacy" className="hover:text-cloud">
          개인정보 처리 안내
        </Link>
      </div>
    </footer>
  );
}
