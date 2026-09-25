"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import type { WinState } from "@/components/ui/Window";
import { DUR, EASE, SPRING, STAGGER } from "./tokens";

export interface FacadeItem {
  id: string;
  state: WinState;
  /** 스크린리더·캡션용 「고덕 햇살마을 — 신청 가능」 */
  label: string;
  href?: string;
}

const FILL: Record<WinState, number> = { ok: 1, maybe: 0.5, no: 0, closed: 0, off: 0 };

const FRAME: Record<WinState, string> = {
  ok: "ring-brand",
  maybe: "ring-maybe",
  no: "ring-line-strong",
  closed: "ring-ghost bg-well",
  off: "ring-ghost",
};

/**
 * 창 한 칸. 켜질 때는 아래에서 위로 불이 차오르고(스프링), 꺼질 때는 짧게 내려간다(0.16초).
 * 꺼지는 동안에도 마지막으로 켜졌던 색을 유지한다 — 주황 반 칸이 꺼지면서 파랗게 번쩍이지 않게.
 * 가로 창살 하나가 불 켜진 창의 표시다.
 */
function Win({ it, delay, onActive }: { it: FacadeItem; delay: number; onActive?: (id: string | null) => void }) {
  const reduce = useReducedMotion();
  const fill = FILL[it.state];
  const want = it.state === "ok" ? "bg-brand" : it.state === "maybe" ? "bg-maybe" : null;
  const [color, setColor] = useState(want ?? "bg-brand");
  if (want && want !== color) setColor(want);
  const t = reduce ? { duration: 0 } : fill > 0 ? { ...SPRING.land, delay } : { duration: DUR.fast, ease: EASE.exit, delay: delay * 0.5 };
  const body = (
    <span
      className={`relative block aspect-[5/7] overflow-hidden rounded-[2px] ring-[1.5px] ring-inset transition-[box-shadow,background-color] duration-300 ${FRAME[it.state]}`}
    >
      <motion.span className={`absolute inset-0 origin-bottom ${want ?? color}`} initial={false} animate={{ scaleY: fill }} transition={t} />
      <span aria-hidden className="absolute inset-x-0 top-[34%] h-px bg-white/70" />
    </span>
  );
  const common = {
    onMouseEnter: () => onActive?.(it.id),
    onMouseLeave: () => onActive?.(null),
    onFocus: () => onActive?.(it.id),
    onBlur: () => onActive?.(null),
    "aria-label": it.label,
    title: it.label,
  };
  return it.href ? (
    <Link href={it.href} className="block rounded-[3px] outline-offset-2 transition-transform duration-150 hover:-translate-y-0.5" {...common}>
      {body}
    </Link>
  ) : (
    <span className="block" {...common} role="img">
      {body}
    </span>
  );
}

/**
 * 바뀐 창에만 순번 지연을 준다 — 직전 상태를 state에 두고, 상태 묶음이 바뀐 렌더에서 한 번 계산한다
 * (「prop이 바뀔 때 state 조정」 패턴. 렌더 중에 ref를 읽지 않는다).
 */
function useChangeDelays(items: FacadeItem[], gap: number): number[] {
  const key = items.map((it) => `${it.id}:${it.state}`).join("|");
  const [snap, setSnap] = useState(() => ({ key, map: Object.fromEntries(items.map((it) => [it.id, it.state])) as Record<string, WinState>, delays: items.map(() => 0) }));
  if (snap.key !== key) {
    let n = 0;
    const delays = items.map((it) => {
      const was = snap.map[it.id];
      return was !== undefined && was !== it.state ? n++ * gap : 0;
    });
    setSnap({ key, map: Object.fromEntries(items.map((it) => [it.id, it.state])), delays });
    return delays;
  }
  return snap.delays;
}

/**
 * 아파트 입면도. 창 1칸 = 공고 1건. 1.5px 잉크 선으로 옥탑·외벽·출입문·지면을 그린다.
 * 상태가 바뀐 창만, 바뀐 순서대로 조금씩 늦게 켜진다(층별로 불이 번지는 느낌).
 */
export function Facade({
  items,
  cols = 4,
  onActive,
  className = "",
  door = true,
}: {
  items: FacadeItem[];
  cols?: number;
  onActive?: (id: string | null) => void;
  className?: string;
  door?: boolean;
}) {
  const delays = useChangeDelays(items, STAGGER.micro * 2);

  return (
    <div className={className}>
      {/* 옥탑 */}
      <div aria-hidden className="mx-[10%] h-3 rounded-t-[2px] border-x-[1.5px] border-t-[1.5px] border-ink" />
      <div className="relative border-[1.5px] border-ink bg-page pt-[6%]">
        {Array.from({ length: Math.ceil(items.length / cols) }, (_, f) => (
          // 층마다 가는 슬래브 선
          <ul
            key={f}
            className="grid gap-x-[14%] border-b border-line px-[12%] py-[5%]"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {items.slice(f * cols, f * cols + cols).map((it, k) => (
              <li key={it.id}>
                <Win it={it} delay={delays[f * cols + k]} onActive={onActive} />
              </li>
            ))}
          </ul>
        ))}
        {door ? (
          <div aria-hidden className="mt-5 flex justify-center">
            <span className="block h-10 w-8 rounded-t-[16px] border-[1.5px] border-b-0 border-ink" />
          </div>
        ) : (
          <div className="h-[7%] min-h-4" />
        )}
      </div>
      {/* 지면 */}
      <div aria-hidden className="-mx-[5%] h-[1.5px] bg-ink" />
    </div>
  );
}
