"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { LineReveal, Reveal } from "@/components/motion/Reveal";
import { br } from "@/lib/text";

// 단어 사이 공백 중 「묶어야 하는 말」은 nbsp로 이어 두었다 — 스크롤 점등은 일반 공백 단위로 나뉜다.
const PARAGRAPH = [
  "공고는 LH, SH, GH, HUG, 청약홈, 구청 게시판에 따로 올라와요.",
  "자격 조건은 수십 쪽짜리 PDF 안에 숨어 있고요.",
  "나이, 소득, 자산, 무주택 기간, 통장 납입 횟수.",
  "하나만 어긋나도 서류 단계에서 떨어집니다.",
  "그래서 청약핏은 공고를 모으는 데서 멈추지 않고,",
  "조건을 하나씩 대조해서 되는지부터 알려 드려요.",
].join(" ");

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.18, 1]);
  return (
    <motion.span style={{ opacity }} className="inline">
      {children}{" "}
    </motion.span>
  );
}

/** 스크롤에 맞춰 문단 단어가 하나씩 켜진다 */
function ScrollLitParagraph() {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const words = PARAGRAPH.split(" ");
  return (
    <p
      ref={ref}
      className="mx-auto max-w-[30em] text-left text-[19px] leading-[1.7] text-cloud md:text-center md:text-[28px] md:leading-[1.6]"
    >
      {words.map((w, i) => {
        const start = i / words.length;
        return (
          <Word key={i} progress={scrollYProgress} range={[start, start + 1 / words.length]}>
            {w}
          </Word>
        );
      })}
    </p>
  );
}

export function Problem({ facts }: { facts: { sources: number; programs: number } }) {
  return (
    <section className="wrap-wide pt-2 md:pt-4">
      <div className="relative overflow-hidden rounded-[28px] bg-coal px-5 py-20 md:px-16 md:py-32">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[420px]"
          style={{
            background:
              "radial-gradient(60% 90% at 50% 120%, rgba(144,184,240,0.5), rgba(132,125,255,0.26) 38%, rgba(15,16,17,0) 72%)",
          }}
        />
        <div aria-hidden className="grain pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-[1040px] text-center">
          <h2 className="t-display-l text-pure">
            <LineReveal lines={[br("청약이 어려운 건"), br("정보가 | 흩어져 있어서예요")]} />
          </h2>
          <div className="mt-12 md:mt-16">
            <ScrollLitParagraph />
          </div>

          <Reveal className="mt-16 grid grid-cols-3 md:mt-24">
            {[
              { n: facts.sources, unit: "곳", label: "공고 출처" },
              { n: facts.programs, unit: "종", label: "판정 유형" },
              { n: 0, unit: "건", label: "남기는 개인정보" },
            ].map((f) => (
              <div key={f.label} className="flex flex-col items-center gap-2 border-l border-line px-2 first:border-l-0">
                <p className="leading-none text-pure">
                  <span className="num text-[44px] md:text-[64px]">{f.n}</span>
                  <span className="ml-1 font-[family-name:var(--font-display)] text-[18px] md:text-[26px]">{f.unit}</span>
                </p>
                <p className="t-small whitespace-nowrap text-ash">{f.label}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
