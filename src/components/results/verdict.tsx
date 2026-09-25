import type { ProfileKey } from "@/lib/domain";
import { withJosa } from "@/lib/josa";
import { placeText } from "@/lib/place";
import { topicOf, type NoticeResult, type Verdict } from "@/lib/rules/evaluate";
import { PROGRAMS } from "@/lib/rules/programs";

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

/**
 * D-day 두 줄. 접수 시작 전과 마감 D-day가 헷갈리지 않게, 시작 전은 「D-」를 쓰지 않는다.
 * 큰 글자는 좁은 칸에서도 한 줄에 들어가게 짧게(최대 4자) — 「10일 뒤」는 두 줄로 꺾여서 「10일」 + 「접수 시작까지」로 나눈다.
 *   접수 예정 「10일 / 접수 시작까지」 · 「내일 / 접수 시작」
 *   접수 중   「D-6 / 마감까지」 · 「오늘 / 마감」
 *   마감      「마감 / 접수 끝」
 */
export function dayText(r: NoticeResult): { big: string; small: string } {
  if (r.phase === "closed") return { big: "마감", small: "접수 끝" };
  if (r.phase === "upcoming") return r.daysToStart === 1 ? { big: "내일", small: "접수 시작" } : { big: `${r.daysToStart}일`, small: "접수 시작까지" };
  if (r.daysLeft === 0) return { big: "오늘", small: "마감" };
  return { big: `D-${r.daysLeft}`, small: "마감까지" };
}

/** D-day 한 줄: 「2일 뒤 접수 시작」, 「D-6 마감」, 「오늘 마감」, 「접수 끝」 */
export function dayLine(r: NoticeResult): string {
  if (r.phase === "closed") return "접수 끝";
  if (r.phase === "upcoming") return `${r.daysToStart === 1 ? "내일" : `${r.daysToStart}일 뒤`} 접수 시작`;
  if (r.daysLeft === 0) return "오늘 마감";
  return `D-${r.daysLeft} 마감`;
}

export function shortDate(s?: string) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  if (!d) return `${y}년 ${Number(m)}월`;
  const date = new Date(Number(s.slice(0, 4)), Number(m) - 1, Number(d));
  const w = "일월화수목금토"[date.getDay()];
  return `${Number(m)}.${Number(d)} (${w})`;
}

const NOT_YET = "아직 입력 안 함";

/** 목록 카드의 한 줄 이유 */
export function reasonLine(r: NoticeResult): string | null {
  const b = r.best;
  if (r.verdict === "no") {
    const f = b.checks.find((c) => c.tri === "fail");
    return f ? `${f.label} 기준에 맞지 않아요 · ${f.need}` : null;
  }
  if (r.verdict === "maybe") {
    const us = b.checks.filter((c) => c.tri === "unknown");
    if (!us.length) return null;
    const noInput = [...new Set(us.filter((c) => c.mine === NOT_YET).map((c) => c.label))];
    if (noInput.length) return `${noInput.slice(0, 3).join("·")} 정보가 필요해요`;
    return us[0].hint ?? `${withJosa(us[0].label, "을/를")} 확인해야 해요`;
  }
  return b.rank?.detail ?? null;
}

export function programLine(r: NoticeResult) {
  return `${r.a.agency} · ${PROGRAMS[r.a.program].name}`;
}

/** 공고 지역 한 줄 — 「서울 강동구」, 「서울 전역」(시·도 이름이 겹치지 않게) */
export function placeLine(r: NoticeResult): string {
  return placeText(r.a);
}

/** 조건의 ask 칸 → 입력 단계(토픽 id). /check?topic=… 에 쓴다 */
export function topicFor(keys: ProfileKey[]): string | undefined {
  for (const k of keys) {
    const t = topicOf(k);
    if (t) return t;
  }
  return undefined;
}
