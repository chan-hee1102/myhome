"use client";

import { LineReveal, Reveal } from "@/components/motion/Reveal";
import { GajeomCalc } from "@/components/guide/GajeomCalc";
import { ButtonLink } from "@/components/ui/Button";
import { br } from "@/lib/text";

/** 가점 84점을 슬라이더로 직접 계산해 보는 구역 */
export function ScoreLab() {
  return (
    <section id="score" aria-labelledby="score-title" className="scroll-mt-16 bg-tint-blue py-20 md:py-28">
      <div className="wrap grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
        <div>
          <p className="eyebrow">가점 계산기</p>
          <h2 id="score-title" className="t-display-l mt-3">
            <LineReveal lines={[br("청약 가점,"), br("바로 계산해 보세요")]} />
          </h2>
          <p className="t-body-l mt-5 max-w-[28em] text-sub">
            {br("민영 아파트는 | 무주택 기간·부양가족·통장 가입 기간, | 세 가지로 점수를 매겨요. | 84점이 만점이에요.")}
          </p>
          <ul className="mt-6 space-y-2.5">
            {["무주택 기간은 만 30세부터 세요", "그 전에 결혼했다면 혼인신고일부터예요", "부양가족에 본인은 빠져요"].map((t) => (
              <li key={t} className="t-body flex items-center gap-2.5 text-body">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand text-white" aria-hidden>
                  <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {t}
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <ButtonLink href="/guide/gajeom" variant="outline" arrow>
              가점 점수표 전체 보기
            </ButtonLink>
          </div>
        </div>
        <Reveal>
          <GajeomCalc />
        </Reveal>
      </div>
    </section>
  );
}
