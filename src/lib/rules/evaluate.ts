import type { Announcement, Profile, ProfileKey, SupplyGroup } from "@/lib/domain";
import { all, derive, type Check, type Derived } from "./core";
import { standardsFor } from "./standards";
import { TEMPLATES, type RankInfo, type ScoreInfo } from "./templates";

export type Verdict = "ok" | "maybe" | "no";

export interface GroupResult {
  group: SupplyGroup;
  verdict: Verdict;
  checks: Check[];
  rankChecks: Check[];
  rank?: RankInfo;
  score?: ScoreInfo;
  notes: string[];
  /** 이 대상의 「확인 필요」를 푸는 데 필요한 칸 */
  asks: ProfileKey[];
}

export type Phase = "upcoming" | "open" | "closed";

export interface NoticeResult {
  a: Announcement;
  verdict: Verdict;
  phase: Phase;
  /** 접수 마감까지 남은 날(오늘 마감이면 0) */
  daysLeft: number;
  /** 접수 시작까지 남은 날(접수 예정일 때만) */
  daysToStart: number;
  best: GroupResult;
  groups: GroupResult[];
}

const DAY = 86_400_000;

function dayStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function parseDay(s: string) {
  const [y, m, dd] = s.split("-").map(Number);
  return new Date(y, m - 1, dd).getTime();
}

export function phaseOf(a: Announcement, today: Date): { phase: Phase; daysLeft: number; daysToStart: number } {
  const t = dayStart(today);
  const start = parseDay(a.schedule.applyStart);
  const end = parseDay(a.schedule.applyEnd);
  const daysLeft = Math.round((end - t) / DAY);
  const daysToStart = Math.round((start - t) / DAY);
  if (daysLeft < 0) return { phase: "closed", daysLeft, daysToStart };
  if (daysToStart > 0) return { phase: "upcoming", daysLeft, daysToStart };
  return { phase: "open", daysLeft, daysToStart };
}

export function evaluateGroup(a: Announcement, g: SupplyGroup, p: Profile, d: Derived): GroupResult {
  const tpl = TEMPLATES[a.program]?.[g.id];
  if (!tpl) {
    return {
      group: g,
      verdict: "maybe",
      checks: [],
      rankChecks: [],
      notes: ["이 공급 대상은 아직 자동 판정을 지원하지 않아요. 공고 원문을 확인해 주세요."],
      asks: [],
    };
  }
  const out = tpl({ a, g, p, d, std: standardsFor(a.schedule.announced), params: g.params ?? {} });
  const tri = all(out.checks.map((c) => c.tri));
  const verdict: Verdict = tri === "pass" ? "ok" : tri === "fail" ? "no" : "maybe";
  const asks = new Set<ProfileKey>();
  if (verdict !== "no") {
    for (const c of out.checks) if (c.tri === "unknown") c.ask?.forEach((k) => asks.add(k));
    for (const c of out.rankChecks ?? []) if (c.tri === "unknown") c.ask?.forEach((k) => asks.add(k));
    out.rank?.ask?.forEach((k) => asks.add(k));
  }
  return {
    group: g,
    verdict,
    checks: out.checks,
    rankChecks: out.rankChecks ?? [],
    rank: out.rank,
    score: out.score,
    notes: out.notes,
    asks: [...asks],
  };
}

const VERDICT_ORDER: Record<Verdict, number> = { ok: 0, maybe: 1, no: 2 };

/** 한 공고의 여러 공급 대상 중 사용자에게 가장 유리한 결과 */
function pickBest(rs: GroupResult[]): GroupResult {
  return [...rs].sort((x, y) => {
    const v = VERDICT_ORDER[x.verdict] - VERDICT_ORDER[y.verdict];
    if (v) return v;
    if (x.verdict === "no") {
      // 미달이면 못 맞춘 조건이 적은 쪽이 「가까운」 결과
      return x.checks.filter((c) => c.tri === "fail").length - y.checks.filter((c) => c.tri === "fail").length;
    }
    const r = (x.rank?.order ?? 5) - (y.rank?.order ?? 5);
    if (r) return r;
    const sx = x.score ? x.score.total / x.score.max : 0;
    const sy = y.score ? y.score.total / y.score.max : 0;
    return sy - sx;
  })[0];
}

export function evaluate(a: Announcement, p: Profile, today = new Date()): NoticeResult {
  const d = derive(p, today);
  const groups = a.groups.map((g) => evaluateGroup(a, g, p, d));
  const best = pickBest(groups);
  const ph = phaseOf(a, today);
  return { a, verdict: best.verdict, best, groups, ...ph };
}

export function evaluateAll(list: Announcement[], p: Profile, today = new Date()): NoticeResult[] {
  return list.map((a) => evaluate(a, p, today));
}

export function countVerdicts(rs: NoticeResult[]) {
  const live = rs.filter((r) => r.phase !== "closed");
  return {
    ok: live.filter((r) => r.verdict === "ok").length,
    maybe: live.filter((r) => r.verdict === "maybe").length,
    no: live.filter((r) => r.verdict === "no").length,
    closed: rs.length - live.length,
    total: rs.length,
  };
}

/* ───────────────────────── 「이것만 알려주시면」 ───────────────────────── */

/** 질문 묶음. 프로필 칸을 사용자가 한 번에 답하는 단위로 모은다 */
export const ASK_TOPICS = [
  { id: "basics", label: "기본 정보", keys: ["birthYear", "sido", "marital", "children", "home"] as ProfileKey[] },
  { id: "income", label: "소득", keys: ["income", "dualIncome"] as ProfileKey[] },
  { id: "account", label: "청약통장", keys: ["hasAccount", "accountMonths", "payments", "deposit"] as ProfileKey[] },
  { id: "assets", label: "자산·자동차", keys: ["assets", "car"] as ProfileKey[] },
  { id: "region", label: "시·군·구와 거주 기간", keys: ["sigungu", "residenceYears"] as ProfileKey[] },
  {
    id: "household",
    label: "세대 정보",
    keys: ["householdHead", "livesWithParents", "homelessYears", "neverOwned", "wonRecently", "infant"] as ProfileKey[],
  },
  { id: "special", label: "해당 계층", keys: ["special", "student", "taxFiveYears"] as ProfileKey[] },
] as const;

export type AskTopicId = (typeof ASK_TOPICS)[number]["id"];

export interface AskSuggestion {
  topic: AskTopicId;
  label: string;
  /** 이 묶음에 답하면 판정이 바뀔 수 있는 진행 중 공고 수 */
  count: number;
}

export function suggestAsks(rs: NoticeResult[]): AskSuggestion[] {
  const counts = new Map<AskTopicId, Set<string>>();
  for (const r of rs) {
    if (r.phase === "closed") continue;
    for (const g of r.groups) {
      if (g.verdict === "no") continue;
      for (const k of g.asks) {
        const topic = ASK_TOPICS.find((t) => t.keys.includes(k));
        if (!topic) continue;
        if (!counts.has(topic.id)) counts.set(topic.id, new Set());
        counts.get(topic.id)!.add(r.a.id);
      }
    }
  }
  return ASK_TOPICS.filter((t) => counts.has(t.id))
    .map((t) => ({ topic: t.id, label: t.label, count: counts.get(t.id)!.size }))
    .sort((x, y) => y.count - x.count);
}
