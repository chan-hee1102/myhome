"use client";

import { Pane, WIN_LABEL, type WinState } from "@/components/ui/Window";

export type Tri = "pass" | "unknown" | "fail";

const STATE: Record<Tri, WinState> = { pass: "ok", unknown: "maybe", fail: "no" };
const LABEL: Record<Tri, string> = { pass: "충족", unknown: WIN_LABEL.maybe, fail: "미달" };

/**
 * 조건 한 줄 앞의 작은 창(14×20) — 판정 표시도 창 부품(Pane)을 그대로 쓴다.
 *   충족 = 꽉 찬 군청 창 · 확인 필요 = 아래 창만 주황 · 미달 = 틀과 창살만
 * 처음 그릴 때 빈 창에서 차오르고, play가 false면 true가 될 때까지 기다린다.
 */
export function WinMark({ tri, delay = 0, play = true, className = "" }: { tri: Tri; delay?: number; play?: boolean; className?: string }) {
  return (
    <span role="img" aria-label={LABEL[tri]} className={`inline-block ${className}`}>
      <Pane state={STATE[tri]} size="md" delay={delay} enter play={play} />
    </span>
  );
}
