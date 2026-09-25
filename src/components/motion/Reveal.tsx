"use client";

import { motion, type HTMLMotionProps } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** 화면에 들어올 때 한 번 아래에서 떠오른다 */
export function Reveal({
  delay = 0,
  y = 24,
  duration = 0.8,
  amount = 0.25,
  children,
  ...rest
}: HTMLMotionProps<"div"> & { delay?: number; y?: number; duration?: number; amount?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * 헤드라인을 줄 단위로 가려 두었다가 아래에서 밀어 올린다.
 * 한글은 자동 줄바꿈 위치를 예측할 수 없어서 줄을 직접 나눠 넘긴다.
 * 가려진 줄(overflow:hidden 밖으로 밀린 글자)은 IntersectionObserver가 「안 보임」으로 보므로
 * 화면 진입 감지는 바깥 상자에서 하고, 줄에는 variants로 전달한다.
 */
export function LineReveal({
  lines,
  className = "",
  lineClassName = "",
  delay = 0,
  stagger = 0.1,
  immediate = false,
}: {
  lines: React.ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  /** true면 스크롤과 무관하게 마운트 즉시 재생(히어로용) */
  immediate?: boolean;
}) {
  const container = {
    hidden: {},
    show: { transition: { staggerChildren: stagger, delayChildren: delay } },
  };
  const item = {
    hidden: { y: "105%", opacity: 0 },
    show: { y: "0%", opacity: 1, transition: { duration: 0.9, ease: EASE } },
  };
  const trigger = immediate
    ? { animate: "show" }
    : { whileInView: "show", viewport: { once: true, amount: 0.35 } };
  return (
    <motion.span className={`block ${className}`} variants={container} initial="hidden" {...trigger}>
      {lines.map((line, i) => (
        <span key={i} className={`block overflow-hidden pb-[0.1em] ${lineClassName}`}>
          <motion.span className="block will-change-transform" variants={item}>
            {line}
          </motion.span>
          {/* 줄 사이 공백 — 검색엔진·스크린리더가 두 줄을 붙여 읽지 않게 */}{" "}
        </span>
      ))}
    </motion.span>
  );
}
