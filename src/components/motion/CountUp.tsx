"use client";

import { animate, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** 화면에 들어오면 0에서 목표값까지 올라간다. 값이 바뀌면 이전 값에서 이어서 움직인다 */
export function CountUp({
  to,
  duration = 1.4,
  className = "",
  format = (n: number) => String(Math.round(n)),
}: {
  to: number;
  duration?: number;
  className?: string;
  format?: (n: number) => string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [value, setValue] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(from.current, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        from.current = v;
        setValue(v);
      },
    });
    return () => controls.stop();
  }, [inView, to, duration]);

  return (
    <span ref={ref} className={`tabular ${className}`}>
      {format(value)}
    </span>
  );
}
