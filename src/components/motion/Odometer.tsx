"use client";

import { motion, useReducedMotion } from "motion/react";
import { SPRING } from "./tokens";

/**
 * 자릿수가 굴러가는 숫자. 값이 바뀌면 바뀐 자리만 위아래로 굴러 새 숫자에 앉는다.
 * SSR에서도 최종 숫자가 그대로 보인다(스크린리더는 sr-only 숫자를 읽는다).
 */
export function Odometer({ value, className = "" }: { value: number; className?: string }) {
  const reduce = useReducedMotion();
  const digits = String(Math.max(0, Math.round(value))).split("").map(Number);
  return (
    <span className={`relative inline-flex tabular ${className}`}>
      <span className="sr-only">{value}</span>
      {digits.map((d, i) => (
        <span key={digits.length - i} aria-hidden className="relative inline-block h-[1em] w-[0.62em] overflow-hidden leading-none">
          <motion.span
            className="absolute inset-x-0 top-0 flex flex-col"
            initial={false}
            animate={{ y: `${-d}em` }}
            transition={reduce ? { duration: 0 } : SPRING.ui}
          >
            {Array.from({ length: 10 }, (_, n) => (
              <span key={n} className="block h-[1em] text-center leading-none">
                {n}
              </span>
            ))}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
