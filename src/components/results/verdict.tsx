import type { ProfileKey } from "@/lib/domain";
import { withJosa } from "@/lib/josa";
import { placeText } from "@/lib/place";
import { topicOf, type NoticeResult, type Verdict } from "@/lib/rules/evaluate";
import { PROGRAMS } from "@/lib/rules/programs";

export const VERDICT: Record<Verdict | "closed", { label: string; dot: string; text: string; headline: string }> = {
  ok: { label: "신청 가능", dot: "bg-ok", text: "text-ok-ink", headline: "신청할 수 있어요" },
  maybe: { label: "확인 필요", dot: "bg-maybe", text: "text-maybe-ink", headline: "정보가 조금 더 필요해요" },
  no: { label: "해당 없음", dot: "bg-no", text: "text-no-ink", headline: "이 대상으로는 신청할 수 없어요" },
  closed: { label: "마감", dot: "bg-ghost", text: "text-muted", headline: "접수가 끝났어요" },
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
 * 「마감」은 접수가 끝난 공고에만 쓴다 — 「D-10 마감」이 끝난 공고처럼 읽히지 않게, 남은 공고는 「10.6 (화)까지」.
 *   접수 예정 「3일 뒤 / 9.29 (화) 시작」
 *   접수 중   「D-6 / 10.6 (화)까지」 · 「오늘 / 오늘 마감」
 *   끝남      「마감 / 9.20 (일) 끝남」
 */
export function dday(
  phase: NoticeResult["phase"],
  daysToStart: number,
  daysLeft: number,
  dates: { start?: string; end?: string } = {},
): { big: string; small: string; line: string } {
  if (phase === "closed") return { big: "마감", small: dates.end ? `${shortDate(dates.end)} 끝남` : "접수 끝", line: "접수 끝" };
  if (phase === "upcoming") {
    const big = daysToStart === 1 ? "내일" : `${daysToStart}일 뒤`;
    return { big, small: dates.start ? `${shortDate(dates.start)} 시작` : "접수 시작", line: `${big} 접수 시작` };
  }
  if (daysLeft === 0) return { big: "오늘", small: "오늘 마감", line: "오늘 마감" };
  const big = `D-${daysLeft}`;
  return { big, small: dates.end ? `${shortDate(dates.end)}까지` : "접수 중", line: dates.end ? `${big} · ${shortDate(dates.end)}까지` : big };
}

export function dayText(r: NoticeResult) {
  return dday(r.phase, r.daysToStart, r.daysLeft, { start: r.a.schedule.applyStart, end: r.a.schedule.applyEnd });
}

/** 마감 3일 이내면 빨강 — 목록·완료 화면·홈이 같은 기준 */
export function isUrgent(r: Pick<NoticeResult, "phase" | "daysLeft">) {
  return r.phase === "open" && r.daysLeft <= 3;
}

/**
 * 예상 순위 글자색. 파랑은 줄마다 「신청 가능」 뱃지 하나에만 — 순위는 잉크, 결과가 확인 필요일 때만 주황.
 * (신청 가능 옆에 주황 순위가 붙으면 신호가 엇갈린다)
 */
export function rankTone(verdict: Verdict) {
  return verdict === "maybe" ? "text-maybe-ink" : "text-ink";
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

const NOT_YET = "입력 전";

/** 목록 카드의 한 줄 이유 */
export function reasonLine(r: NoticeResult): string | null {
  const b = r.best;
  if (r.verdict === "no") {
    const f = b.checks.find((c) => c.tri === "fail");
    return f ? `${f.label} 기준에 맞지 않아요.` : null;
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
