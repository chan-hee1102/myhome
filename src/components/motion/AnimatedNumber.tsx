"use client";

import { animate } from "motion/react";
import { useEffect, useRef, useState } from "react";

/** 값이 바뀔 때마다 이전 값에서 새 값까지 굴러가는 숫자 */
export function AnimatedNumber({ value, duration = 0.7 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const c = animate(from.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        from.current = v;
        setShown(Math.round(v));
      },
    });
    return () => c.stop();
  }, [value, duration]);
  return <span className="tabular">{shown}</span>;
}
