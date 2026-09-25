import type { ReactNode } from "react";

/**
 * 뱃지·태그 규격
 *   StatusBadge  판정 상태(신청 가능·확인 필요·해당 없음·마감)와 마감 임박 — h-7, 연한 색 바탕 + 진한 글자
 *   Tag          정보 표시(유형·조건 요약) — h-8, 회색 바탕
 *   CountPill    개수(탭·추천 질문) — h-5
 */
export type Status = "ok" | "maybe" | "no" | "closed" | "hot";

const STATUS: Record<Status, { cls: string; dot: string }> = {
  ok: { cls: "bg-ok-soft text-ok-ink", dot: "bg-ok" },
  maybe: { cls: "bg-maybe-soft text-maybe-ink", dot: "bg-maybe" },
  no: { cls: "bg-no-soft text-no-ink", dot: "bg-no" },
  closed: { cls: "bg-page text-muted ring-1 ring-inset ring-line-strong", dot: "bg-ghost" },
  hot: { cls: "bg-hot-soft text-hot-ink", dot: "bg-hot" },
};

export function StatusBadge({ status, children, dot = true }: { status: Status; children: ReactNode; dot?: boolean }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex h-7 w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-semibold whitespace-nowrap ${s.cls}`}>
      {dot && <span className={`size-1.5 rounded-full ${s.dot}`} aria-hidden />}
      {children}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-8 w-fit shrink-0 items-center rounded-full bg-well px-3 text-[13px] font-medium whitespace-nowrap text-sub">
      {children}
    </span>
  );
}

export function CountPill({ children, inverted = false }: { children: ReactNode; inverted?: boolean }) {
  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[12px] font-semibold tabular-nums ${
        inverted ? "bg-white/20 text-white" : "bg-well text-muted"
      }`}
    >
      {children}
    </span>
  );
}
