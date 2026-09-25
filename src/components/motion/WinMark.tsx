"use client";

import { motion, useReducedMotion } from "motion/react";
import { SPRING } from "./tokens";

export type Tri = "pass" | "unknown" | "fail";

const LABEL: Record<Tri, string> = { pass: "충족", unknown: "확인 필요", fail: "미달" };

/**
 * 조건 한 줄 앞의 작은 창 — 판정 표시도 창 문법을 따른다(체크박스처럼 보이지 않게).
 *   충족 = 꽉 찬 군청 창 · 확인 필요 = 아래 절반 주황 · 미달 = 회색 선만
 * play가 켜지면 delay 뒤에 불이 차오른다.
 */
export function WinMark({ tri, delay = 0, play = true, className = "" }: { tri: Tri; delay?: number; play?: boolean; className?: string }) {
  const reduce = useReducedMotion();
  const fill = tri === "pass" ? 1 : tri === "unknown" ? 0.5 : 0;
  const frame = tri === "pass" ? "ring-brand" : tri === "unknown" ? "ring-maybe" : "ring-no";
  return (
    <span role="img" aria-label={LABEL[tri]} className={`relative inline-block h-[18px] w-[14px] shrink-0 overflow-hidden rounded-[2px] ring-[1.5px] ring-inset ${frame} ${className}`}>
      <motion.span
        className={`absolute inset-0 origin-bottom ${tri === "unknown" ? "bg-maybe" : "bg-brand"}`}
        initial={reduce ? false : { scaleY: 0 }}
        animate={play ? { scaleY: fill } : undefined}
        transition={reduce ? { duration: 0 } : { ...SPRING.land, delay }}
      />
      <span aria-hidden className="absolute inset-x-0 top-[34%] h-px bg-white/70" />
    </span>
  );
}
