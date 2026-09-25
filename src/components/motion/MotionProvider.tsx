"use client";

import { MotionConfig } from "motion/react";

/** 시스템에서 「동작 줄이기」를 켠 사용자에게는 이동·확대 애니메이션을 끈다(투명도 전환만 남음). */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
