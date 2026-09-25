"use client";

import Link from "next/link";
import { LineReveal, Reveal } from "@/components/motion/Reveal";
import { GajeomCalc } from "@/components/guide/GajeomCalc";
import { br } from "@/lib/text";

/** 가점 84점을 슬라이더로 직접 계산해 보는 은색 패널 */
export function ScoreLab() {
  return (
    <section id="score" aria-labelledby="score-title" className="wrap-wide scroll-mt-10">
      <Reveal className="grain relative overflow-hidden rounded-[28px] bg-silver px-5 py-20 text-void md:px-16 md:py-32">
        <div className="mx-auto grid max-w-[1136px] items-center gap-12 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
          <div>
            <p className="text-[13px] font-semibold text-black/65">가점 계산기</p>
            <h2 id="score-title" className="t-display-l mt-4 text-void">
              <LineReveal lines={[br("가점 84점,"), br("직접 계산해 보세요")]} />
            </h2>
            <p className="t-body-l mt-6 max-w-[28em] text-black/75">
              {br("민영 아파트 일반공급은 | 무주택 기간·부양가족·통장 가입 기간 | 세 가지로 점수를 매겨요.")}
            </p>
            <p className="t-body mt-4 max-w-[28em] text-black/65">
              {br("무주택 기간은 만 30세부터 세요. | 그 전에 결혼했다면 혼인신고일부터예요. | 부양가족에는 본인이 빠져요.")}
            </p>
            <Link
              href="/guide/gajeom"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-[12px] bg-void px-5 text-[15px] font-semibold text-pure transition-colors hover:bg-black/80"
            >
              가점 점수표 전체 보기
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                <path d="M3 8h9.5M8.5 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
          <GajeomCalc tone="ink" />
        </div>
      </Reveal>
    </section>
  );
}
