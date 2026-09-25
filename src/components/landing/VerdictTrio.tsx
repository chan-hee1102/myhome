"use client";

import { motion } from "motion/react";
import { LineReveal } from "@/components/motion/Reveal";
import { StatusBadge, type Status } from "@/components/ui/Badge";
import { MarkDot, type Mark } from "@/components/ui/MarkDot";
import { br } from "@/lib/text";

const EASE = [0.16, 1, 0.3, 1] as const;

const CARDS: { status: Status; label: string; title: string; lines: [Mark, string, string][]; foot: string }[] = [
  {
    status: "ok",
    label: "신청 가능",
    title: "조건을 모두 맞췄어요",
    lines: [
      ["ok", "나이", "만 29세 (기준 19~39세)"],
      ["ok", "혼인", "미혼"],
      ["ok", "주택", "무주택"],
      ["ok", "소득", "기준의 80% (100%까지)"],
    ],
    foot: "행복주택 청년 · 예상 1순위",
  },
  {
    status: "maybe",
    label: "확인 필요",
    title: "정보가 하나 모자라요",
    lines: [
      ["ok", "나이", "만 29세 (기준 19~39세)"],
      ["ok", "주택", "무주택"],
      ["ok", "소득", "기준의 80% (100%까지)"],
      ["maybe", "자산", "아직 입력 안 함"],
    ],
    foot: "자산만 알려주시면 바로 확정돼요",
  },
  {
    status: "no",
    label: "해당 없음",
    title: "기준을 벗어났어요",
    lines: [
      ["no", "나이", "만 41세 (기준 19~39세)"],
      ["ok", "주택", "무주택"],
      ["ok", "소득", "기준의 80% (100%까지)"],
    ],
    foot: "같은 공고의 다른 대상을 대신 볼 수 있어요",
  },
];

export function VerdictTrio() {
  return (
    <section aria-labelledby="verdict-title" className="py-20 md:py-28">
      <div className="wrap">
        <div className="text-center">
          <p className="eyebrow">결과 보는 법</p>
          <h2 id="verdict-title" className="t-display-l mt-3">
            <LineReveal lines={[br("결과는"), br("세 가지로 알려 드려요")]} />
          </h2>
          <p className="t-body-l mx-auto mt-5 max-w-[30em] text-sub">
            {br("모르는 건 짐작하지 않아요. | 정보가 비어 있으면 「확인 필요」로 두고, | 무엇만 알려주면 되는지 짚어 드려요.")}
          </p>
        </div>
        {/* 모바일: 가로로 넘겨 보는 카드 / 데스크탑: 3열 */}
        <div className="no-scrollbar -mx-5 mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-4 md:mx-0 md:mt-14 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
          {CARDS.map((c, i) => (
            <motion.article
              key={c.label}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: EASE }}
              className="flex w-[82vw] max-w-[320px] shrink-0 snap-center flex-col rounded-[24px] bg-page p-6 shadow-card ring-1 ring-inset ring-line md:w-auto md:max-w-none"
            >
              <StatusBadge status={c.status}>{c.label}</StatusBadge>
              <h3 className="t-display-s mt-4">{c.title}</h3>
              <ul className="mt-5 space-y-3 rounded-[16px] bg-wash p-4">
                {c.lines.map(([m, k, v]) => (
                  <li key={k} className="grid grid-cols-[20px_36px_1fr] items-center gap-2 text-[14px]">
                    <MarkDot m={m} />
                    <span className="font-medium text-sub">{k}</span>
                    <span className={m === "no" ? "text-muted line-through decoration-ghost" : m === "maybe" ? "font-medium text-maybe-ink" : "text-body"}>{v}</span>
                  </li>
                ))}
              </ul>
              <p className="t-small mt-auto pt-5 font-medium text-body">{c.foot}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
