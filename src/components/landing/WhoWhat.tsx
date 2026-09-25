"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { SPRING } from "@/components/motion/tokens";
import { Reveal } from "@/components/motion/Reveal";
import type { GroupId, ProgramId } from "@/lib/domain";
import { PROGRAMS } from "@/lib/rules/programs";
import { TEMPLATES } from "@/lib/rules/templates";

const COLS: { id: ProgramId; slug: string }[] = [
  { id: "happy", slug: "happy-housing" },
  { id: "national", slug: "national-rental" },
  { id: "permanent", slug: "permanent-rental" },
  { id: "integrated", slug: "integrated-rental" },
  { id: "purchase", slug: "purchase-rental" },
  { id: "jeonse", slug: "jeonse-rental" },
  { id: "youthSafe", slug: "youth-safe-housing" },
  { id: "deundeun", slug: "deundeun-jeonse" },
  { id: "publicSale", slug: "public-sale" },
  { id: "privateApt", slug: "private-apt" },
];

/** 대상 → 판정 엔진에 실제로 있는 (유형, 공급 계층). 엔진에 없는 칸은 그리지 않는다 */
const ROWS: { label: string; sub?: string; cells: [ProgramId, GroupId][] }[] = [
  {
    label: "청년",
    sub: "만 19~39세",
    cells: [["happy", "youth"], ["integrated", "youth"], ["purchase", "youth"], ["jeonse", "youth"], ["youthSafe", "youth"]],
  },
  { label: "대학생", cells: [["happy", "student"]] },
  {
    label: "신혼부부",
    sub: "예비부부 포함",
    cells: [
      ["happy", "newlywed"],
      ["integrated", "newlywed"],
      ["purchase", "newlywed"],
      ["jeonse", "newlywed"],
      ["youthSafe", "newlywed"],
      ["publicSale", "spNewlywed"],
      ["privateApt", "spNewlywed"],
    ],
  },
  { label: "아기 있는 가구", sub: "2세 미만·임신", cells: [["publicSale", "spNewborn"], ["privateApt", "spNewborn"]] },
  { label: "생애최초", sub: "집을 가져 본 적 없음", cells: [["publicSale", "spFirst"], ["privateApt", "spFirst"]] },
  { label: "다자녀", sub: "미성년 자녀 2명 이상", cells: [["publicSale", "spMultiChild"], ["privateApt", "spMultiChild"]] },
  { label: "노부모 부양", sub: "65세 이상 부모님 3년 부양", cells: [["publicSale", "spParents"], ["privateApt", "spParents"]] },
  { label: "고령자", sub: "만 65세 이상", cells: [["happy", "elderly"]] },
  { label: "수급자·한부모 등", sub: "저소득 가구", cells: [["happy", "benefit"], ["permanent", "benefit"], ["purchase", "general"], ["jeonse", "general"]] },
  { label: "무주택 세대", sub: "제한 없음", cells: [["national", "general"], ["integrated", "general"], ["deundeun", "general"], ["publicSale", "gen1"]] },
  { label: "청약통장 가입자", sub: "일반공급", cells: [["privateApt", "gen1"]] },
];

const has = (p: ProgramId, g: GroupId) => !!TEMPLATES[p]?.[g];
const ROWS_ON = ROWS.map((r) => ({ ...r, cells: r.cells.filter(([p, g]) => has(p, g)) })).filter((r) => r.cells.length);

/**
 * 「누가 어떤 공고에」 — 큰 표 대신 대상 알약을 누르면 그 대상이 신청할 수 있는 주택 유형 카드가 떠오른다.
 * 선택 알약은 layoutId로 미끄러지고, 카드는 순서대로 올라온다.
 */
export function WhoWhat() {
  const reduce = useReducedMotion();
  const [pick, setPick] = useState(ROWS_ON[0].label);
  const row = ROWS_ON.find((r) => r.label === pick) ?? ROWS_ON[0];

  return (
    <section aria-labelledby="who-title" className="py-10 md:py-16">
      <div className="wrap">
        <h2 id="who-title" className="t-h2">
          누가 어떤 공고에 넣을 수 있나요
        </h2>
        <p className="t-body-l mt-3 max-w-[40em] text-sub">대상을 고르면 신청할 수 있는 주택 유형이 나와요.</p>

        <Reveal className="card mt-8 p-4 md:mt-10 md:p-7">
          <div role="tablist" aria-label="대상" className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
            {ROWS_ON.map((r) => {
              const on = r.label === pick;
              return (
                <button
                  key={r.label}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setPick(r.label)}
                  className={`relative h-10 shrink-0 rounded-full px-4 text-[15px] font-semibold transition-colors ${on ? "text-white" : "bg-wash text-sub hover:text-ink"}`}
                >
                  {on && <motion.span layoutId="who-pill" className="absolute inset-0 rounded-full bg-brand" transition={reduce ? { duration: 0 } : SPRING.ui} />}
                  <span className="relative">{r.label}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-5 text-[15px] text-sub">
            <span className="font-semibold text-ink">{row.label}</span>
            {row.sub && <span> · {row.sub}</span>}
            <span> · 신청할 수 있는 유형 </span>
            <span className="data text-ink">{row.cells.length}</span>개
          </p>

          <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            <AnimatePresence mode="popLayout" initial={false}>
              {row.cells.map(([p], i) => {
                const col = COLS.find((c) => c.id === p)!;
                const prog = PROGRAMS[p];
                return (
                  <motion.li
                    key={`${row.label}-${p}`}
                    layout={reduce ? false : "position"}
                    initial={reduce ? false : { opacity: 0, y: 14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.12 } }}
                    transition={{ ...SPRING.land, delay: i * 0.05 }}
                  >
                    <Link
                      href={`/guide/${col.slug}`}
                      className="card-hover flex h-full flex-col rounded-[14px] border border-line bg-page p-3.5 hover:border-brand md:p-4"
                    >
                      <span className="text-[13px] font-semibold text-brand-ink">{prog.kind === "rent" ? "임대" : "분양"}</span>
                      <span className="mt-0.5 text-[17px] font-bold leading-snug tracking-[-0.02em] text-ink">{prog.name}</span>
                      <span className="mt-1.5 line-clamp-2 text-[14px] leading-snug text-sub">{prog.blurb}</span>
                    </Link>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
          <p className="t-small mt-5 text-muted">유형을 누르면 자격 기준을 볼 수 있어요. 소득·자산 기준은 유형마다 달라요.</p>
        </Reveal>
      </div>
    </section>
  );
}
