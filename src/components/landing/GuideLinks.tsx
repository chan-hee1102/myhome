import Link from "next/link";
import { LineReveal } from "@/components/motion/Reveal";
import { GUIDES } from "@/lib/guides";
import { br } from "@/lib/text";

/** 홈 → 가이드 내부 링크(가이드가 고아 페이지가 되지 않게). 앵커 텍스트는 설명형으로 */
export function GuideLinks() {
  const tables = GUIDES.filter((g) => g.category === "기준표");
  const types = GUIDES.filter((g) => g.category !== "기준표");
  return (
    <section aria-labelledby="guide-title" className="py-20 md:py-32">
      <div className="wrap">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">2026 기준표</p>
            <h2 id="guide-title" className="t-display-l mt-4 text-pure">
              <LineReveal lines={[br("판정 근거를"), br("그대로 공개해요")]} />
            </h2>
          </div>
          <Link href="/guide" className="t-body inline-flex items-center gap-2 font-semibold text-cloud hover:text-pure">
            청약 가이드 전체 보기
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M3 8h9.5M8.5 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 md:mt-16 lg:grid-cols-5 lg:gap-4">
          {tables.map((g) => (
            <Link
              key={g.slug}
              href={`/guide/${g.slug}`}
              className="flex min-h-[176px] flex-col rounded-[20px] bg-coal p-6 ring-1 ring-inset ring-line transition-colors hover:bg-graphite hover:ring-line-strong"
            >
              <span className="t-title text-cloud">{g.short}</span>
              <span className="t-small mt-auto pt-6 text-ash">{g.facts.join(" · ")}</span>
            </Link>
          ))}
        </div>
        <ul className="mt-6 flex flex-wrap gap-2">
          {types.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guide/${g.slug}`}
                className="inline-flex h-10 items-center rounded-full px-4 text-[14px] font-medium text-mist ring-1 ring-inset ring-white/14 transition-colors hover:bg-white/6 hover:text-pure"
              >
                {g.short} 자격 조건
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
