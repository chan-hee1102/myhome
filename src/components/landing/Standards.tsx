import Link from "next/link";
import { FaqList } from "@/components/guide/GuideParts";
import { HOME_FAQ } from "@/lib/faq";
import { manwon } from "@/lib/rules/core";
import { depositFor, income100, standardsFor } from "@/lib/rules/standards";

const STD = standardsFor();

/** 숫자는 전부 standards.ts에서 계산한다(손으로 적지 않는다) */
const FIGURES = [
  { k: "1인 가구 소득 100%", v: `월 ${manwon(Math.round(income100(STD, 1, "rent")))}`, note: "공공임대 기준 · 도시근로자 월평균소득", href: "/guide/income" },
  { k: "청년 자산 상한", v: manwon(STD.assets.happyYouth), note: "행복주택·매입임대 청년", href: "/guide/assets" },
  { k: "자동차 상한", v: manwon(STD.assets.car), note: "공공임대 대부분", href: "/guide/assets" },
  { k: "서울 예치금", v: manwon(depositFor("서울", 85)), note: "민영 전용 85㎡ 이하 1순위", href: "/guide/deposit" },
];

/** 2026 기준 숫자 + 자주 묻는 질문 + 가이드 목록 */
export function Standards() {
  return (
    <section id="faq" aria-labelledby="std-title" className="scroll-mt-20 py-14 md:py-20">
      <div className="wrap">
        <div className="section-head">
          <span>{STD.year} 기준</span>
          <Link href="/guide" className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
            청약 가이드 전체
          </Link>
        </div>
        <h2 id="std-title" className="sr-only">
          {STD.year}년 청약·공공임대 기준 숫자와 자주 묻는 질문
        </h2>

        <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          {FIGURES.map((f) => (
            <Link key={f.k} href={f.href} className="group block border-l border-line pl-4">
              <dt className="text-[13px] font-semibold text-sub">{f.k}</dt>
              <dd className="num mt-1.5 whitespace-nowrap text-[20px] leading-tight text-ink group-hover:underline md:text-[30px]">{f.v}</dd>
              <dd className="mt-1 text-[13px] text-muted">{f.note}</dd>
            </Link>
          ))}
        </dl>

        <div className="mt-16 grid gap-10 md:mt-20 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <h3 className="t-h2">자주 묻는 질문</h3>
            <p className="t-body mt-4 text-sub">자격 기준이 더 궁금하면 유형별 가이드를 보세요. 숫자는 모두 2026년 법령·고시 값이에요.</p>
            <Link href="/guide" className="mt-4 inline-flex h-11 items-center text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              청약 가이드 전체 보기
            </Link>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <FaqList items={HOME_FAQ} />
          </div>
        </div>
      </div>
    </section>
  );
}
