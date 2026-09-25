import type { ReactNode } from "react";
import { WinGlyph, type WinState } from "./Window";

/**
 * 뱃지 규격
 *   StatusBadge  판정 상태 — 창 글리프 + 글자. 바탕 알약 없음(한 카드에 색 면이 겹치지 않게)
 *   Tag          조건 요약 — 1px 테두리, 반경 4
 *   CountPill    개수 — 고정폭 숫자
 */
export type Status = "ok" | "maybe" | "no" | "closed" | "hot";

const TEXT: Record<Status, string> = {
  ok: "text-ok-ink",
  maybe: "text-maybe-ink",
  no: "text-no-ink",
  closed: "text-muted",
  hot: "text-hot-ink",
};

const GLYPH: Record<Status, WinState> = { ok: "ok", maybe: "maybe", no: "no", closed: "closed", hot: "ok" };

export function StatusBadge({ status, children, dot = true }: { status: Status; children: ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex w-fit shrink-0 items-center gap-1.5 text-[14px] font-semibold whitespace-nowrap ${TEXT[status]}`}>
      {dot && <WinGlyph state={GLYPH[status]} />}
      {children}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-8 w-fit shrink-0 items-center rounded-[4px] px-2.5 text-[14px] font-medium whitespace-nowrap text-body ring-1 ring-inset ring-line-strong">
      {children}
    </span>
  );
}

export function CountPill({ children, inverted = false }: { children: ReactNode; inverted?: boolean }) {
  return <span className={`tabular text-[13px] font-semibold ${inverted ? "text-white/75" : "text-muted"}`}>{children}</span>;
}
