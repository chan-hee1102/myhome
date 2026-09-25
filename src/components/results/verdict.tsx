import type { NoticeResult, Verdict } from "@/lib/rules/evaluate";
import { PROGRAMS } from "@/lib/rules/programs";
import { ASK_TOPICS } from "@/lib/rules/evaluate";
import type { ProfileKey } from "@/lib/domain";

export const VERDICT: Record<Verdict | "closed", { label: string; dot: string; text: string; headline: string }> = {
  ok: { label: "신청 가능", dot: "bg-ok", text: "text-ok-ink", headline: "신청할 수 있어요" },
  maybe: { label: "확인 필요", dot: "bg-maybe", text: "text-maybe-ink", headline: "정보가 조금 더 필요해요" },
  no: { label: "해당 없음", dot: "bg-no", text: "text-no-ink", headline: "이 대상은 어려워요" },
  closed: { label: "접수 마감", dot: "bg-ghost", text: "text-muted", headline: "접수가 끝났어요" },
};

/** 판정 상태 → 뱃지 색 */
export function badgeStatus(r: NoticeResult): "ok" | "maybe" | "no" | "closed" {
  return r.phase === "closed" ? "closed" : r.verdict;
}

export function verdictKey(r: NoticeResult): Verdict | "closed" {
  return r.phase === "closed" ? "closed" : r.verdict;
}


/** "D-6", "오늘 마감", "3일 뒤 접수" */
export function dayText(r: NoticeResult): { big: string; small: string } {
  if (r.phase === "closed") return { big: "마감", small: "접수 끝" };
  if (r.phase === "upcoming") return { big: `D-${r.daysToStart}`, small: "접수 시작까지" };
  if (r.daysLeft === 0) return { big: "오늘", small: "마감" };
  return { big: `D-${r.daysLeft}`, small: "마감까지" };
}

export function shortDate(s?: string) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  if (!d) return `${y}년 ${Number(m)}월`;
  const date = new Date(Number(s.slice(0, 4)), Number(m) - 1, Number(d));
  const w = "일월화수목금토"[date.getDay()];
  return `${Number(m)}.${Number(d)} (${w})`;
}

/** 목록 카드의 한 줄 이유 */
export function reasonLine(r: NoticeResult): string | null {
  const b = r.best;
  if (r.verdict === "no") {
    const f = b.checks.find((c) => c.tri === "fail");
    return f ? `${f.label} — 기준 ${f.need}` : null;
  }
  if (r.verdict === "maybe") {
    const us = b.checks.filter((c) => c.tri === "unknown");
    if (!us.length) return null;
    const noInput = us.filter((c) => c.mine === "아직 입력 안 함").map((c) => c.label);
    if (noInput.length) return `${[...new Set(noInput)].slice(0, 3).join("·")} 정보가 필요해요`;
    return us[0].hint ?? `${us[0].label}이(가) 기준선에 걸쳐 있어요`;
  }
  return b.rank?.detail ?? null;
}

export function programLine(r: NoticeResult) {
  return `${r.a.agency} · ${PROGRAMS[r.a.program].name}`;
}

export function topicFor(keys: ProfileKey[]): string | undefined {
  for (const t of ASK_TOPICS) if (keys.some((k) => t.keys.includes(k))) return t.id;
  return undefined;
}
