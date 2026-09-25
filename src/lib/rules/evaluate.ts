import { withJosa } from "@/lib/josa";
import type { Announcement, GroupId, Profile, ProfileKey, SupplyGroup } from "@/lib/domain";
import { sameBloc } from "@/lib/place";
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
  /** 이 대상의 「확인 필요」를 푸는 데 필요한 칸 — 아직 답하지 않은 칸만 */
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

/** 같은 조건이 두 번 들어가지 않게(예: 노부모부양 「세대주」 + 규제지역 1순위 「세대주」) — 먼저 나온 것을 남긴다 */
function dedupe(checks: Check[]): Check[] {
  const seen = new Set<string>();
  return checks.filter((c) => (seen.has(c.key) ? false : (seen.add(c.key), true)));
}

/** 이미 답한 칸은 「알려주세요」에서 뺀다(구간이 기준선에 걸쳐도 같은 질문을 다시 권하지 않는다) */
const unanswered = (p: Profile) => (k: ProfileKey) => p[k] === undefined;

function cleanAsk<T extends { ask?: ProfileKey[] }>(x: T, p: Profile): T {
  if (!x.ask) return x;
  const ask = x.ask.filter(unanswered(p));
  return { ...x, ask: ask.length ? [...new Set(ask)] : undefined };
}

export function evaluateGroup(a: Announcement, g: SupplyGroup, p: Profile, d: Derived): GroupResult {
  const tpl = TEMPLATES[a.program]?.[g.id];
  if (!tpl) {
    return {
      group: g,
      verdict: "maybe",
      checks: [],
      rankChecks: [],
      notes: ["이 공급 대상은 아직 자동으로 따져 볼 수 없어요. 공고문을 확인해 주세요."],
      asks: [],
    };
  }
  const out = tpl({ a, g, p, d, std: standardsFor(a.schedule.announced), params: g.params ?? {} });
  const checks = dedupe(out.checks).map((c) => cleanAsk(c, p));
  const rankChecks = dedupe(out.rankChecks ?? []).map((c) => cleanAsk(c, p));
  const rank = out.rank ? cleanAsk(out.rank, p) : undefined;
  const tri = all(checks.map((c) => c.tri));
  const verdict: Verdict = tri === "pass" ? "ok" : tri === "fail" ? "no" : "maybe";
  const asks = new Set<ProfileKey>();
  if (verdict !== "no") {
    for (const c of checks) if (c.tri === "unknown") c.ask?.forEach((k) => asks.add(k));
    for (const c of rankChecks) if (c.tri === "unknown") c.ask?.forEach((k) => asks.add(k));
    rank?.ask?.forEach((k) => asks.add(k));
    out.asks?.filter(unanswered(p)).forEach((k) => asks.add(k));
  }
  return {
    group: g,
    verdict,
    checks,
    rankChecks,
    rank,
    score: out.score,
    notes: out.notes,
    asks: [...asks],
  };
}

const VERDICT_ORDER: Record<Verdict, number> = { ok: 0, maybe: 1, no: 2 };

/** 한 공고의 여러 공급 대상 중 사용자에게 가장 유리한 결과 */
function pickBest(rs: GroupResult[]): GroupResult {
  return [...rs].sort(compareGroups)[0];
}

function compareGroups(x: GroupResult, y: GroupResult): number {
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

/* ───────────────────────── 공급 대상 요약(목록 카드용) ───────────────────────── */

export interface GroupLine {
  id: GroupId;
  /** 「신혼부부 특별공급」 */
  label: string;
  verdict: Verdict;
  /** 「1순위 · 해당지역」, 「추첨」 … (해당 없음이면 없음) */
  rankLabel?: string;
  /** 「청약 가점 32/84」 (해당 없음이면 없음, 모르는 칸이 있으면 「32+」) */
  scoreText?: string;
  /** 공고 대표 결과(best)인가 */
  best: boolean;
}

/**
 * 한 공고의 공급 대상별 한 줄 — 신청 가능 → 확인 필요 → 해당 없음, 같으면 순위 순.
 * 목록 카드에서 best 하나만 보이면 「신혼 특공도 가능」 같은 정보가 숨으므로 이걸 칩으로 그린다.
 */
export function groupLines(r: NoticeResult): GroupLine[] {
  return [...r.groups].sort(compareGroups).map((g) => ({
    id: g.group.id,
    label: g.group.label,
    verdict: g.verdict,
    rankLabel: g.verdict !== "no" ? g.rank?.label : undefined,
    scoreText:
      g.verdict !== "no" && g.score ? `${g.score.title} ${g.score.total}${g.score.partial ? "+" : ""}/${g.score.max}` : undefined,
    best: g === r.best,
  }));
}

/** 신청 가능·확인 필요인 공급 대상 수 */
export function groupCounts(r: NoticeResult): Record<Verdict, number> {
  const c: Record<Verdict, number> = { ok: 0, maybe: 0, no: 0 };
  for (const g of r.groups) c[g.verdict]++;
  return c;
}

/** 공급 대상 기준값 출처 안내 — basis=template(법령 기본값)일 때만 */
export function basisText(g: SupplyGroup): string | undefined {
  return g.basis === "template" ? "법령 기본 기준으로 계산했어요." : undefined;
}

/* ───────────────────────── 지역 관련성·정렬 ───────────────────────── */

/** local = 같은 시·도(같은 시·군·구 포함) · near = 같은 권역(수도권 등) · far = 그 밖. 사는 곳을 모르면 near */
export type RegionScope = "local" | "near" | "far";

export function regionScope(a: Pick<Announcement, "sido">, p: Profile): RegionScope {
  if (!p.sido) return "near";
  if (p.sido === a.sido) return "local";
  return sameBloc(p.sido, a.sido) ? "near" : "far";
}

const SCOPE_W: Record<RegionScope, number> = { local: 3, near: 2, far: 1 };
const VERDICT_W: Record<Verdict, number> = { ok: 3, maybe: 2, no: 1 };

/**
 * 정렬용 관련도(클수록 위). 지역 → 판정 → 순위 → 마감 순으로 비교한 것과 같다.
 * 마감된 공고는 늘 맨 아래.
 */
export function relevance(r: NoticeResult, p: Profile): number {
  const scope = SCOPE_W[regionScope(r.a, p)];
  const v = VERDICT_W[r.verdict];
  const rank = 10 - Math.min(9, Math.max(1, r.best.rank?.order ?? 5));
  // 접수 중이면 마감이 가까운 순, 접수 예정은 그 뒤에 시작이 가까운 순
  const wait = r.phase === "upcoming" ? 100 + r.daysToStart : r.daysLeft;
  const soon = 999 - Math.min(999, Math.max(0, wait));
  const score = scope * 1e8 + v * 1e6 + rank * 1e4 + soon;
  return r.phase === "closed" ? score - 1e10 : score;
}

/** list.sort(byRelevance(profile)) */
export function byRelevance(p: Profile) {
  return (x: NoticeResult, y: NoticeResult) => relevance(y, p) - relevance(x, p);
}

/* ───────────────────────── 「이것만 알려주시면」 ───────────────────────── */

/**
 * 질문 묶음 = 입력 화면의 단계. 토픽 id는 /check?topic=… 로 그대로 쓰인다.
 * 어떤 프로필 칸이든 정확히 한 토픽에 속한다(모든 칸이 어느 단계에선가 묻는다).
 * label은 명사만 — 문장은 askLine()이 만든다.
 */
export const ASK_TOPICS = [
  { id: "basics", label: "나이", keys: ["birthYear"] as ProfileKey[] },
  // infant·youngChildren은 자녀가 0명이면 화면이 묻지 않는다 — derive가 false/0으로 채워 이 칸을 ask하지 않는다
  { id: "family", label: "가족", keys: ["marital", "children", "infant", "youngChildren", "marriedYear"] as ProfileKey[] },
  { id: "region", label: "사는 곳", keys: ["sido", "sigungu"] as ProfileKey[] },
  { id: "home", label: "집", keys: ["home"] as ProfileKey[] },
  { id: "income", label: "소득", keys: ["income", "dualIncome"] as ProfileKey[] },
  { id: "assets", label: "재산", keys: ["assets", "car", "property"] as ProfileKey[] },
  {
    id: "account",
    label: "청약통장",
    keys: ["hasAccount", "accountMonths", "payments", "deposit", "spouseAccountMonths"] as ProfileKey[],
  },
  {
    id: "household",
    label: "세대",
    keys: ["householdHead", "livesWithParents", "residenceYears", "homelessYears", "neverOwned", "wonRecently"] as ProfileKey[],
  },
  { id: "special", label: "해당 계층", keys: ["special", "student", "taxFiveYears"] as ProfileKey[] },
] as const;

export type AskTopicId = (typeof ASK_TOPICS)[number]["id"];

/** 토픽 → 그 단계에서 묻는 프로필 칸 */
export const TOPIC_KEYS = Object.fromEntries(ASK_TOPICS.map((t) => [t.id, t.keys])) as Record<AskTopicId, ProfileKey[]>;

/** 프로필 칸 → 토픽 */
export function topicOf(k: ProfileKey): AskTopicId | undefined {
  return ASK_TOPICS.find((t) => t.keys.includes(k))?.id;
}

export interface AskSuggestion {
  topic: AskTopicId;
  label: string;
  /** 이 묶음에 답하면 판정이 바뀔 수 있는 진행 중 공고 수(다른 정보도 필요한 공고 포함) */
  count: number;
  /** 이 묶음 하나만 답하면 결과가 정해지는 공고 수 — 「N건이 정해져요」는 이 숫자로만 말한다 */
  settles: number;
  /** 이 묶음에서 아직 답하지 않았고 판정에 필요한 칸 */
  keys: ProfileKey[];
}

/** 이 공고의 「확인 필요」 대상이 아직 모르는 칸(프로필에 이미 있는 칸은 뺀다) */
function openAsks(r: NoticeResult, profile?: Profile): ProfileKey[][] {
  return r.groups.filter((g) => g.verdict === "maybe").map((g) => g.asks.filter((k) => !(profile && profile[k] !== undefined)));
}

/**
 * 주어진 묶음들만 답하면 결과가 정해지는 진행 중 「확인 필요」 공고 수.
 * 「확인 필요」인 대상마다, 모르는 칸이 전부 이 묶음 안에 있어야 한다(묶음 밖의 칸이 하나라도 남으면 답해도 그대로다).
 * 모르는 칸이 없는데 확인 필요인 대상(공고문을 직접 봐야 하는 조건)이 있으면 정해지지 않는다.
 */
export function settleCount(rs: NoticeResult[], topics: AskTopicId[], profile?: Profile): number {
  const keys = new Set(topics.flatMap((t) => TOPIC_KEYS[t]));
  return rs.filter((r) => {
    if (r.phase === "closed" || r.verdict !== "maybe") return false;
    const per = openAsks(r, profile);
    return per.length > 0 && per.every((ks) => ks.length > 0 && ks.every((k) => keys.has(k)));
  }).length;
}

/** 답할 것이 남지 않았는데도 「확인 필요」인 진행 중 공고 수 — 공고문에서 직접 확인할 조건만 남은 경우 */
export function manualCount(rs: NoticeResult[], profile?: Profile): number {
  return rs.filter((r) => r.phase !== "closed" && r.verdict === "maybe" && openAsks(r, profile).every((ks) => ks.length === 0)).length;
}

/**
 * 진행 중 공고의 「확인 필요」를 푸는 질문 묶음. 그 묶음만 답하면 정해지는 공고가 많은 순, 같으면 영향받는 공고가 많은 순.
 * GroupResult.asks에는 아직 답하지 않은 칸만 들어 있으므로, 다 답한 묶음은 추천되지 않는다.
 * profile을 넘기면 한 번 더 걸러낸다(evaluate 뒤에 프로필이 바뀐 경우 대비).
 */
export function suggestAsks(rs: NoticeResult[], profile?: Profile): AskSuggestion[] {
  const counts = new Map<AskTopicId, { ids: Set<string>; keys: Set<ProfileKey> }>();
  for (const r of rs) {
    if (r.phase === "closed") continue;
    for (const g of r.groups) {
      if (g.verdict === "no") continue;
      for (const k of g.asks) {
        if (profile && profile[k] !== undefined) continue;
        const topic = topicOf(k);
        if (!topic) continue;
        if (!counts.has(topic)) counts.set(topic, { ids: new Set(), keys: new Set() });
        const c = counts.get(topic)!;
        c.ids.add(r.a.id);
        c.keys.add(k);
      }
    }
  }
  return ASK_TOPICS.filter((t) => counts.has(t.id))
    .map((t) => ({
      topic: t.id,
      label: t.label,
      count: counts.get(t.id)!.ids.size,
      settles: settleCount(rs, [t.id], profile),
      keys: [...counts.get(t.id)!.keys],
    }))
    .sort((x, y) => y.settles - x.settles || y.count - x.count);
}

/**
 * 「청약통장을 알려주시면 공고 2건의 결과가 정해져요」 — 그 묶음만으로 정해지는 공고가 있을 때만 「정해져요」라고 말한다.
 * 없으면(다른 정보도 함께 필요하면) 「더 정확해져요」.
 */
export function askLine(s: Pick<AskSuggestion, "label" | "count" | "settles">): string {
  return s.settles > 0 ? `${s.label}만 답하면 ${s.settles}건이 정해져요` : `${withJosa(s.label, "을/를")} 답하면 ${s.count}건이 더 정확해져요`;
}
