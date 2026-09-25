"use client";

import { motion } from "motion/react";
import { LineReveal, Reveal } from "@/components/motion/Reveal";
import { br } from "@/lib/text";

const EASE = [0.16, 1, 0.3, 1] as const;

const PAINS = [
  {
    title: "공고가 떴는지도 몰랐어요",
    body: "LH, SH, GH, HUG, 청약홈… | 공고가 기관마다 따로 올라와요.",
    tint: "bg-tint-blue text-brand",
    icon: (
      <path d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2h-15L6 16ZM10 20.5a2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    title: "공고문 읽다가 포기했어요",
    body: "자격 조건이 | 수십 쪽짜리 PDF 안에 숨어 있어요.",
    tint: "bg-tint-orange text-maybe-ink",
    icon: (
      <>
        <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10.5A.5.5 0 0 1 6.5 20V4a.5.5 0 0 1 .5-.5Z" strokeLinejoin="round" />
        <path d="M13.5 3.5V8h4.5M9.5 12h5M9.5 15.5h5" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    title: "내가 되는지 모르겠어요",
    body: "나이, 소득, 자산, 무주택 기간. | 하나만 달라도 떨어져요.",
    tint: "bg-tint-green text-ok-ink",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.3M12 16.6v.2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

/** 흔히 겪는 불편 세 가지 → 청약핏이 대신 해 주는 일 */
export function Problem() {
  return (
    <section aria-labelledby="problem-title" className="bg-wash py-20 md:py-28">
      <div className="wrap">
        <div className="text-center">
          <p className="eyebrow">청약이 어려운 이유</p>
          <h2 id="problem-title" className="t-display-l mt-3">
            <LineReveal lines={[br("이런 적, | 있지 않나요?")]} />
          </h2>
        </div>
        <ul className="mt-10 grid gap-3 md:mt-14 md:grid-cols-3 md:gap-4">
          {PAINS.map((p, i) => (
            <motion.li
              key={p.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
              className="rounded-[24px] bg-page p-6 shadow-card md:p-8"
            >
              <span className={`grid size-12 place-items-center rounded-[14px] ${p.tint}`}>
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                  {p.icon}
                </svg>
              </span>
              <h3 className="t-title mt-5 text-ink">{p.title}</h3>
              <p className="t-body mt-2 text-sub">{br(p.body)}</p>
            </motion.li>
          ))}
        </ul>
        <Reveal className="mt-10 text-center md:mt-14">
          <p className="t-display-s">
            {br("청약핏이 | 대신 모으고, 대신 확인해 드려요")}
          </p>
          <svg viewBox="0 0 24 24" className="mx-auto mt-4 size-6 animate-bounce text-brand" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M12 5v14M6 13l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Reveal>
      </div>
    </section>
  );
}
