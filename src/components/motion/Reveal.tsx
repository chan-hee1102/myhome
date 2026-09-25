"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { DUR, EASE } from "./tokens";

/**
 * 화면에 들어올 때 한 번 아래에서 떠오르는 카드(0.64초). 첫 화면 밖 구역에만 쓴다 —
 * 히어로 제목처럼 처음부터 보여야 하는 글자에는 쓰지 않는다. 동작 줄이기 설정이면 그대로 보인다.
 */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: DUR.slow, ease: EASE.out, delay }}
    >
      {children}
    </motion.div>
  );
}
