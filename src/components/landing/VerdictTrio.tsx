"use client";

import { motion } from "motion/react";
import { LineReveal } from "@/components/motion/Reveal";
import { StatusBadge, type Status } from "@/components/ui/Badge";
import { br } from "@/lib/text";

const EASE = [0.16, 1, 0.3, 1] as const;

type Mark = "ok" | "maybe" | "no";
const MARK: Record<Mark, { sym: string; cls: string }> = {
  ok: { sym: "✓", cls: "text-ok" },
  maybe: { sym: "?", cls: "text-maybe" },
  no: { sym: "✕", cls: "text-fog" },
};

const CARDS: { status: Status; label: string; title: string; lines: [Mark, string, string][]; foot: string }[] = [
  {
    status: "ok",
    label: "신청 가능",
    title: "조건을 모두 맞췄어요",
    lines: [
      ["ok", "나이", "만 29세 · 기준 19~39세"],
      ["ok", "혼인", "미혼"],
      ["ok", "주택", "무주택"],
      ["ok", "소득", "월평균소득 80% · 기준 100%"],
    ],
    foot: "행복주택 청년 · 예상 1순위",
  },
  {
    status: "maybe",
    label: "확인 필요",
    title: "정보가 하나 모자라요",
    lines: [
      ["ok", "나이", "만 29세 · 기준 19~39세"],
      ["ok", "주택", "무주택"],
      ["ok", "소득", "월평균소득 80% · 기준 100%"],
      ["maybe", "자산", "아직 입력 안 함"],
    ],
    foot: "자산을 알려주시면 바로 확정돼요",
  },
  {
    status: "no",
    label: "해당 없음",
    title: "기준을 벗어났어요",
    lines: [
      ["no", "나이", "만 41세 · 기준 19~39세"],
      ["ok", "주택", "무주택"],
      ["ok", "소득", "월평균소득 80% · 기준 100%"],
    ],
    foot: "같은 공고의 다른 계층을 대신 볼 수 있어요",
  },
];

export function VerdictTrio() {
  return (
    <section aria-labelledby="verdict-title" className="py-20 md:py-32">
      <div className="wrap">
        <div className="text-center">
          <p className="eyebrow">판정 방식</p>
          <h2 id="verdict-title" className="t-display-l mt-4 text-pure">
            <LineReveal lines={[br("판정은"), br("세 가지로만 말해요")]} />
          </h2>
          <p className="t-body-l mx-auto mt-6 max-w-[30em] text-ash">
            {br("모르는 걸 아는 척하지 않아요. | 입력이 비어 있으면 「확인 필요」로 남기고, | 무엇을 알려주면 되는지 짚어 드려요.")}
          </p>
        </div>
        {/* 모바일: 가로로 넘겨 보는 카드 / 데스크탑: 3열 */}
        <div className="no-scrollbar -mx-5 mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 md:mx-0 md:mt-16 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
          {CARDS.map((c, i) => (
            <motion.article
              key={c.label}
              initial={{ opacity: 0, y: 40, rotateX: 12 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 1.1, delay: i * 0.12, ease: EASE }}
              style={{ transformPerspective: 900 }}
              className="flex w-[84vw] max-w-[320px] shrink-0 snap-center flex-col rounded-[20px] bg-coal p-6 ring-1 ring-inset ring-line md:w-auto md:max-w-none"
            >
              <StatusBadge status={c.status}>{c.label}</StatusBadge>
              <h3 className="t-display-s mt-5 text-pure">{c.title}</h3>
              <ul className="mt-6 divide-y divide-line border-y border-line">
                {c.lines.map(([m, k, v]) => (
                  <li key={k} className="grid grid-cols-[20px_40px_1fr] items-baseline gap-2 py-3 text-[14px]">
                    <span className={`text-center ${MARK[m].cls}`}>{MARK[m].sym}</span>
                    <span className="text-ash">{k}</span>
                    <span className={m === "no" ? "text-dim line-through decoration-fog/60" : "text-cloud"}>{v}</span>
                  </li>
                ))}
              </ul>
              <p className="t-small mt-auto pt-6 text-mist">{c.foot}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
