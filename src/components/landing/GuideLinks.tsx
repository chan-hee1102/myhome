import Link from "next/link";
import { LineReveal } from "@/components/motion/Reveal";
import { GUIDES } from "@/lib/guides";
import { br } from "@/lib/text";

/** 홈 → 가이드 내부 링크(가이드가 고아 페이지가 되지 않게). 앵커 텍스트는 설명형으로 */
export function GuideLinks() {
  const tables = GUIDES.filter((g) => g.category === "기준표");
  const types = GUIDES.filter((g) => g.category !== "기준표");
  return (
    <section aria-labelledby="guide-title" className="bg-wash py-20 md:py-28">
      <div className="wrap">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">2026 기준표</p>
            <h2 id="guide-title" className="t-display-l mt-3">
              <LineReveal lines={[br("자격 기준이"), br("궁금하다면")]} />
            </h2>
          </div>
          <Link href="/guide" className="t-body inline-flex items-center gap-1.5 font-semibold text-brand hover:text-brand-hover">
            청약 가이드 전체 보기
            <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d="M6 3.5 10.5 8 6 12.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 md:mt-12 lg:grid-cols-5 lg:gap-4">
          {tables.map((g) => (
            <Link
              key={g.slug}
              href={`/guide/${g.slug}`}
              className="group flex min-h-[156px] flex-col rounded-[20px] bg-page p-5 shadow-card transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lift md:p-6"
            >
              <span className="t-title text-ink">{g.short}</span>
              <span className="t-small mt-auto pt-5 text-muted">{g.facts.join(" · ")}</span>
            </Link>
          ))}
        </div>
        <ul className="mt-5 flex flex-wrap gap-2">
          {types.map((g) => (
            <li key={g.slug}>
              <Link
                href={`/guide/${g.slug}`}
                className="inline-flex h-10 items-center rounded-full bg-page px-4 text-[14px] font-medium text-body ring-1 ring-inset ring-line transition-colors hover:text-brand hover:ring-brand"
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
