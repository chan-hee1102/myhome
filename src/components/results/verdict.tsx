import type { ProfileKey } from "@/lib/domain";
import { withJosa } from "@/lib/josa";
import { placeText } from "@/lib/place";
import { topicOf, type NoticeResult, type Verdict } from "@/lib/rules/evaluate";
import type { RankInfo } from "@/lib/rules/templates";
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
 * D-day — 이 사이트의 모든 날짜 문구는 여기서만 만든다(목록·상세·완료 화면·홈 접수 일정).
 * 접수 시작 전과 마감 D-day가 헷갈리지 않게, 시작 전은 「D-」를 쓰지 않는다.
 *   접수 예정 「3일 뒤 / 접수 시작」 · 「내일 / 접수 시작」
 *   접수 중   「D-6 / 마감」 · 「오늘 / 마감」
 *   마감      「마감 / 접수 끝」
 */
export function dday(phase: NoticeResult["phase"], daysToStart: number, daysLeft: number): { big: string; small: string; line: string } {
  if (phase === "closed") return { big: "마감", small: "접수 끝", line: "접수 끝" };
  if (phase === "upcoming") {
    const big = daysToStart === 1 ? "내일" : `${daysToStart}일 뒤`;
    return { big, small: "접수 시작", line: `${big} 접수 시작` };
  }
  const big = daysLeft === 0 ? "오늘" : `D-${daysLeft}`;
  return { big, small: "마감", line: `${big} 마감` };
}

export function dayText(r: NoticeResult) {
  return dday(r.phase, r.daysToStart, r.daysLeft);
}

/** 마감 3일 이내면 빨강 — 목록·완료 화면·홈이 같은 기준 */
export function isUrgent(r: Pick<NoticeResult, "phase" | "daysLeft">) {
  return r.phase === "open" && r.daysLeft <= 3;
}

/** 예상 순위 글자색: 군청은 「신청 가능」에만. 확인 필요이거나 순위가 아직 안 정해졌으면 주황 */
export function rankTone(verdict: Verdict, rank: RankInfo) {
  return verdict === "ok" && rank.tri !== "unknown" ? "text-brand-ink" : "text-maybe-ink";
}

/** 점수 한 줄: 「가점 12점 / 84점」, 모르는 항목이 있으면 「가점 12점 이상 / 84점」 */
export function scoreLine(s: { title: string; total: number; max: number; partial?: boolean }) {
  return `${s.title} ${s.total}점${s.partial ? " 이상" : ""} / ${s.max}점`;
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
