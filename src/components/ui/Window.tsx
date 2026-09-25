"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { DUR, EASE, SPRING } from "@/components/motion/tokens";

/**
 * 창 — 청약핏의 유일한 그래픽 단위. 창 1칸은 언제나 공고 1건(또는 조건 1줄)이다. 데이터 없는 창은 그리지 않는다.
 *   ok     꽉 찬 창(군청)        신청 가능
 *   maybe  아래 창만 켜짐(주황)  확인 필요
 *   no     틀과 창살만           해당 없음
 *   closed 회색 면               접수 마감
 *   off    옅은 틀               아직 모름(입력 전)
 *
 * 입면·조건 표시·뱃지·범례·하단 띠가 모두 이 부품 하나(Pane)를 쓴다 — 비율 5:7, 가운데 창살 하나.
 * 창살은 틀 안쪽에만 그어 틀을 끊지 않고, 반 칸 창의 채움 경계와 같은 높이(50%)라 선이 두 줄로 보이지 않는다.
 */
export type WinState = "ok" | "maybe" | "no" | "closed" | "off";

export const WIN_LABEL: Record<WinState, string> = {
  ok: "신청 가능",
  maybe: "확인 필요",
  no: "해당 없음",
  closed: "마감",
  off: "아직 모름",
};

const FILL: Record<WinState, number> = { ok: 1, maybe: 0.5, no: 0, closed: 0, off: 0 };

/**
 * 크기별 규격. 작은 창은 틀이 묻히지 않게 「해당 없음」 틀을 한 단계 진하게 쓰고(광학 보정),
 * 켜진 창의 창살은 옅게 한다 — 14px 이하에선 흰 가로줄이 「−」 아이콘처럼 읽힌다.
 */
const SIZE = {
  lg: { box: "w-full rounded-[2px]", no: "ring-line-strong", noBar: "bg-line-strong", okBar: "bg-white/70" },
  md: { box: "w-3.5 rounded-[2px]", no: "ring-faint", noBar: "bg-faint", okBar: "bg-white/35" },
  sm: { box: "w-2.5 rounded-[1.5px]", no: "ring-faint", noBar: "bg-faint", okBar: "bg-white/35" },
} as const;

type Size = keyof typeof SIZE;

function frameOf(s: WinState, size: Size) {
  return s === "ok" ? "ring-brand" : s === "maybe" ? "ring-maybe" : s === "no" ? SIZE[size].no : s === "closed" ? "ring-[#b0b8c2] bg-closed" : "ring-ghost";
}

function barOf(s: WinState, size: Size) {
  return s === "ok" ? SIZE[size].okBar : s === "maybe" ? "bg-maybe" : s === "no" ? SIZE[size].noBar : s === "closed" ? "bg-[#b0b8c2]" : "bg-ghost";
}

/**
 * 창 한 칸. 켜질 때는 아래에서 위로 불이 차오르고(스프링), 꺼질 때는 짧게 내려간다(0.16초).
 * 꺼지는 동안에도 마지막으로 켜졌던 색을 유지한다 — 주황 반 칸이 꺼지면서 파랗게 번쩍이지 않게.
 *   enter  처음 그릴 때 빈 창에서 차오른다(조건 줄). 끄면 처음부터 최종 상태(입면·뱃지)
 *   play   false면 빈 창으로 기다리다가 true가 되는 순간 차오른다(화면에 들어올 때)
 */
export function Pane({
  state,
  size = "lg",
  delay = 0,
  enter = false,
  play = true,
  className = "",
}: {
  state: WinState;
  size?: Size;
  delay?: number;
  enter?: boolean;
  play?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const fill = play ? FILL[state] : 0;
  const want = state === "ok" ? "bg-brand" : state === "maybe" ? "bg-maybe" : null;
  const [color, setColor] = useState(want ?? "bg-brand");
  if (want && want !== color) setColor(want);
  const t = reduce ? { duration: 0 } : fill > 0 ? { ...SPRING.land, delay } : { duration: DUR.fast, ease: EASE.exit, delay: delay * 0.5 };
  return (
    <span
      aria-hidden
      className={`relative block aspect-[5/7] shrink-0 overflow-hidden ring-[1.5px] ring-inset transition-[box-shadow,background-color] duration-300 ${SIZE[size].box} ${frameOf(state, size)} ${className}`}
    >
      <motion.span
        className={`absolute inset-0 origin-bottom ${want ?? color}`}
        initial={enter && !reduce ? { scaleY: 0 } : false}
        animate={{ scaleY: fill }}
        transition={t}
      />
      <span className={`absolute inset-x-[1.5px] top-1/2 h-px -translate-y-1/2 transition-colors duration-300 ${barOf(state, size)}`} />
    </span>
  );
}

/** 글자 옆에 붙는 작은 창(10×14). 뱃지·범례·목록에 쓴다 */
export function WinGlyph({ state, className = "" }: { state: WinState; className?: string }) {
  return <Pane state={state} size="sm" className={className} />;
}

/** 범례 한 줄 */
export function WinLegend({ className = "", states = ["ok", "maybe", "no"] }: { className?: string; states?: WinState[] }) {
  return (
    <ul className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-[14px] md:text-[15px] text-sub ${className}`}>
      {states.map((s) => (
        <li key={s} className="inline-flex items-center gap-1.5">
          <WinGlyph state={s} />
          {WIN_LABEL[s]}
        </li>
      ))}
    </ul>
  );
}
