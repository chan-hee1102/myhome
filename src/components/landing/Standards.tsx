import Link from "next/link";
import { FaqList } from "@/components/guide/GuideParts";
import { Reveal } from "@/components/motion/Reveal";
import { HOME_FAQ } from "@/lib/faq";
import { manwon } from "@/lib/rules/core";
import { depositFor, income100, standardsFor } from "@/lib/rules/standards";

const STD = standardsFor();

/** 숫자는 전부 standards.ts에서 계산한다(손으로 적지 않는다) */
const FIGURES = [
  { k: "1인 가구 소득 100%", v: `월 ${manwon(Math.round(income100(STD, 1, "rent")))}`, note: "공공임대 기준", href: "/guide/income" },
  { k: "청년 자산 상한", v: manwon(STD.assets.happyYouth), note: "행복주택·매입임대 청년", href: "/guide/assets" },
  { k: "자동차 상한", v: manwon(STD.assets.car), note: "공공임대 대부분", href: "/guide/assets" },
  { k: "서울 예치금", v: manwon(depositFor("서울", 85)), note: "민영 전용 85㎡ 이하 1순위", href: "/guide/deposit" },
];

/** 2026 기준 숫자 + 자주 묻는 질문 + 가이드 목록 */
export function Standards() {
  return (
    <section id="faq" aria-labelledby="std-title" className="scroll-mt-20 py-10 md:py-16">
      <div className="wrap">
        <h2 id="std-title" className="t-h2">
          {STD.year}년 기준 숫자
        </h2>
        <p className="t-body-l mt-3 text-sub">법령과 고시에 나온 값이에요. 누르면 근거를 볼 수 있어요.</p>

        <ul className="mt-8 grid grid-cols-2 gap-2.5 md:mt-10 md:grid-cols-4 md:gap-4">
          {FIGURES.map((f, i) => (
            <li key={f.k}>
              <Reveal delay={i * 0.07} className="h-full">
                <Link href={f.href} className="card card-hover group block h-full p-4 md:p-5">
                  <span className="block text-[14px] font-semibold text-sub md:text-[15px]">{f.k}</span>
                  <span className="num mt-1.5 block whitespace-nowrap text-[20px] leading-tight text-ink md:text-[28px]">{f.v}</span>
                  <span className="mt-1 block text-[14px] text-muted md:text-[15px]">{f.note}</span>
                  <span className="mt-3 block text-[14px] font-semibold text-brand-ink group-hover:underline md:text-[15px]">근거 보기 →</span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>

        <div className="mt-16 grid gap-10 md:mt-20 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <h3 className="t-h2">자주 묻는 질문</h3>
            <p className="t-body mt-4 text-sub">자격 기준이 더 궁금하면 유형별 가이드를 보세요. 숫자는 모두 2026년 법령·고시 값이에요.</p>
            <Link href="/guide" className="mt-4 inline-flex h-11 items-center text-[16px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              청약 가이드 전체 보기
            </Link>
          </div>
          <Reveal className="card px-5 py-1 md:px-7 lg:col-span-7 lg:col-start-6 [&>div]:border-t-0">
            <FaqList items={HOME_FAQ} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
