import type { ReactNode } from "react";

/**
 * 뱃지·태그 규격
 *   StatusBadge  판정 상태(신청 가능·확인 필요·해당 없음·마감)와 마감 임박 — h-6, 색을 깐 알약
 *   Tag          정보 표시(유형·조건 요약·「예시」) — h-7, 테두리 알약
 *   CountPill    개수(탭·추천 질문) — h-5
 */
export type Status = "ok" | "maybe" | "no" | "closed" | "hot";

const STATUS: Record<Status, { cls: string; dot: string }> = {
  ok: { cls: "bg-ok/12 text-ok", dot: "bg-ok" },
  maybe: { cls: "bg-maybe/14 text-maybe", dot: "bg-maybe" },
  no: { cls: "bg-white/6 text-ash", dot: "bg-fog" },
  closed: { cls: "ring-1 ring-inset ring-white/12 text-dim", dot: "bg-steel" },
  hot: { cls: "bg-hot/12 text-hot", dot: "bg-hot" },
};

export function StatusBadge({ status, children, dot = true }: { status: Status; children: ReactNode; dot?: boolean }) {
  const s = STATUS[status];
  return (
    <span className={`inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-semibold whitespace-nowrap ${s.cls}`}>
      {dot && <span className={`size-1.5 rounded-full ${s.dot}`} aria-hidden />}
      {children}
    </span>
  );
}

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "onColor" | "sample" }) {
  const cls =
    tone === "onColor"
      ? "ring-current/25"
      : tone === "sample"
        ? "ring-maybe/30 text-maybe"
        : "ring-white/14 text-mist";
  return (
    <span className={`inline-flex h-7 w-fit shrink-0 items-center rounded-full px-3 text-[13px] font-medium whitespace-nowrap ring-1 ring-inset ${cls}`}>
      {children}
    </span>
  );
}

export function CountPill({ children, inverted = false }: { children: ReactNode; inverted?: boolean }) {
  return (
    <span
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold tabular-nums ${
        inverted ? "bg-black/10 text-black/60" : "bg-white/10 text-mist"
      }`}
    >
      {children}
    </span>
  );
}
