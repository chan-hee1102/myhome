import type { Profile, ProfileKey } from "@/lib/domain";
import { derive, type Derived } from "./core";

/**
 * 민영주택 청약가점 84점 — 주택공급에 관한 규칙 [별표 1] 가점제 적용기준.
 *   무주택기간 32 + 부양가족 수 35 + 청약통장 가입기간 17
 *
 * 무주택기간: 만 30세부터 센다. 만 30세 전에 혼인했다면 혼인신고일부터.
 *            무주택자인데 1년 미만이면 2점, 이후 1년마다 2점씩, 15년 이상 32점. 집이 있으면 0점.
 * 부양가족: 배우자·직계존속(3년 이상 같은 주민등록)·미혼 자녀. 0명 5점, 1명당 5점, 6명 이상 35점.
 * 통장 가입기간: 6개월 미만 1점, 6개월~1년 2점, 이후 1년마다 1점, 15년 이상 17점.
 *               (2024-03-25부터 배우자 통장 가입기간의 50%를 최대 3점까지 합산 — spouseBonus)
 */

export const GAJEOM_MAX = { homeless: 32, dependents: 35, account: 17, total: 84 } as const;

/** 무주택기간(년, 소수 가능) → 점수. homeless=false면 0점 */
export function homelessPoints(years: number, homeless = true): number {
  if (!homeless) return 0;
  if (years < 1) return 2;
  return Math.min(32, 2 + Math.floor(years) * 2);
}

/** 부양가족 수 → 점수 */
export function dependentPoints(count: number): number {
  return Math.min(35, 5 + Math.max(0, Math.floor(count)) * 5);
}

/** 청약통장 가입기간(개월) → 점수. 가입 안 했으면 0점 */
export function accountPoints(months: number | null): number {
  if (months == null || months < 0) return 0;
  if (months < 6) return 1;
  if (months < 12) return 2;
  return Math.min(17, 2 + Math.floor(months / 12));
}

/** 배우자 통장 가입기간 합산 가점(가입기간 점수의 50%, 최대 3점). 본인 점수와 합쳐도 17점을 넘지 않는다 */
export function spouseAccountBonus(spouseMonths: number | null): number {
  if (spouseMonths == null || spouseMonths < 0) return 0;
  return Math.min(3, Math.floor(accountPoints(spouseMonths) / 2));
}

export interface GajeomInput {
  homeless: boolean;
  /** 가점 산정 기준 무주택기간(년). 만 30세·혼인일 기산을 이미 반영한 값 */
  homelessYears: number;
  dependents: number;
  accountMonths: number | null;
  spouseAccountMonths?: number | null;
  /**
   * 무주택이지만 아직 기간을 세기 시작하지 않음(만 30세 전 미혼) → 무주택 0점.
   * homeless=false(집 있음)와 함께 「1년 미만 2점」보다 낮은 0점을 표현한다.
   */
  notCounting?: boolean;
}

export interface GajeomLine {
  key: "homeless" | "dependents" | "account";
  label: string;
  points: number;
  max: number;
  note: string;
}

export function computeGajeom(input: GajeomInput): { total: number; lines: GajeomLine[] } {
  const zero = !input.homeless || !!input.notCounting;
  const h = zero ? 0 : homelessPoints(input.homelessYears, true);
  const d = dependentPoints(input.dependents);
  const own = accountPoints(input.accountMonths);
  const bonus = spouseAccountBonus(input.spouseAccountMonths ?? null);
  const a = Math.min(17, own + bonus);
  const lines: GajeomLine[] = [
    {
      key: "homeless",
      label: "무주택 기간",
      points: h,
      max: 32,
      note: !input.homeless
        ? "집이 있으면 0점"
        : input.notCounting
          ? "만 30세 전 미혼이라 0점"
          : input.homelessYears < 1
            ? "1년 미만"
            : `${Math.floor(input.homelessYears)}년${input.homelessYears >= 15 ? " 이상" : ""}`,
    },
    {
      key: "dependents",
      label: "부양가족",
      points: d,
      max: 35,
      note: `${Math.min(6, input.dependents)}명${input.dependents >= 6 ? " 이상" : ""}`,
    },
    {
      key: "account",
      label: "청약통장 가입 기간",
      points: a,
      max: 17,
      note:
        (input.accountMonths == null
          ? "통장 없음"
          : input.accountMonths < 12
            ? `${input.accountMonths}개월`
            : `${Math.floor(input.accountMonths / 12)}년${input.accountMonths >= 180 ? " 이상" : ""}`) +
        (bonus ? ` + 배우자 통장 ${bonus}점${own + bonus > 17 ? "(17점까지)" : ""}` : ""),
    },
  ];
  return { total: h + d + a, lines };
}

/* ───────────────────────── 프로필 → 가점 (결과 화면·계산기 공용) ───────────────────────── */

export interface HomelessBasis {
  /** own=세대에 집 있음(0점) · notCounting=만 30세 전 미혼(0점) · counting=기간을 셈 · unknown=입력 부족 */
  state: "own" | "notCounting" | "counting" | "unknown";
  /** 가점에 쓰는 무주택 기간(년) — counting이고 무주택 기간을 알 때만 */
  years?: number;
  points: number | null;
  /** 산식 한 줄. 예) 「1980년생 → 만 30세(2010년)부터 16년 · 무주택 12년 중 짧은 쪽 12년」 */
  text: string;
  ask?: ProfileKey[];
}

const yrs = (n: number) => (n < 1 ? "1년 미만" : `${Math.floor(n)}년`);

/**
 * 가점 무주택 기간 — 만 30세가 된 해와 혼인신고 연도(만 30세 전 혼인) 중 빠른 해부터,
 * 무주택이 된 뒤로만 센다(둘 중 짧은 쪽). 만 30세 전 미혼·집이 있으면 0점.
 * 날짜 대신 연도로 세므로 생일·신고일에 따라 1년 적을 수 있다.
 */
export function homelessBasis(p: Profile, d: Derived = derive(p)): HomelessBasis {
  const homeless = d.homelessHousehold;
  if (homeless === undefined) return { state: "unknown", points: null, text: "집이 있는지 알려주세요", ask: ["home"] };
  if (homeless === false) return { state: "own", points: 0, text: "세대에 집이 있으면 0점이에요" };
  if (!p.birthYear) return { state: "unknown", points: null, text: "출생연도가 필요해요", ask: ["birthYear"] };
  const by = p.birthYear;
  const turn30 = by + 30;
  // 혼인 이력: 지금 혼인 중이거나, 혼자(이혼·사별)라도 혼인신고 연도를 알려준 경우
  const my = p.marriedYear && (d.married || d.solo) ? p.marriedYear : undefined;
  const marriedBefore30 = my !== undefined && my < turn30;
  if (!marriedBefore30 && d.year < turn30) {
    if (d.married && my === undefined) {
      // 만 30세 전인데 혼인 중 — 혼인신고일부터 세지만 연도를 모른다
      return {
        state: "counting",
        points: p.homelessYears !== undefined ? homelessPoints(0) : null,
        years: 0,
        text: `만 30세 전에 결혼했다면 혼인신고일부터 세요. 혼인신고 연도를 알려주시면 정확해져요`,
        ask: ["marriedYear"],
      };
    }
    return { state: "notCounting", points: 0, text: `${by}년생 · 만 30세(${turn30}년)부터 세요. 지금은 0점이에요` };
  }
  const start = marriedBefore30 ? my! : turn30;
  const since = Math.max(0, d.year - start);
  const head = marriedBefore30
    ? `${by}년생 · ${my}년 혼인신고 → 혼인신고(${my}년)부터 ${yrs(since)}`
    : `${by}년생 → 만 30세(${turn30}년)부터 ${yrs(since)}`;
  // 혼인 중인데 신고 연도를 모르면 만 30세 기준(더 짧은 쪽)으로 센다
  const tail = d.married && my === undefined ? " (30세 전에 혼인신고했다면 더 길어요)" : "";
  // 연도로만 세므로, 올해 생일(또는 신고일)이 아직이면 1년 짧다 — 점수가 한 칸 낮을 수 있음을 밝힌다
  const edge = since >= 1 ? ` (올해 ${marriedBefore30 ? "신고일" : "생일"}이 아직이면 1년 짧아요)` : "";
  if (p.homelessYears === undefined)
    return { state: "counting", points: null, text: `${head} · 무주택이 된 지 알려주시면 짧은 쪽으로 세요${tail}`, ask: ["homelessYears"] };
  if (p.homelessYears >= 99) return { state: "counting", years: since, points: homelessPoints(since), text: `${head} (쭉 무주택)${tail || edge}` };
  const years = Math.min(since, p.homelessYears);
  return {
    state: "counting",
    years,
    points: homelessPoints(years),
    text:
      (since === p.homelessYears ? `${head} · 무주택 ${yrs(p.homelessYears)}` : `${head} · 무주택 ${yrs(p.homelessYears)} 중 짧은 쪽 ${yrs(years)}`) +
      (since < p.homelessYears ? tail || edge : since === p.homelessYears ? edge : ""),
  };
}

/** 계산기 초기값. 모르는 칸은 비워 두고(undefined) 계산기 기본값을 쓰게 한다 */
export interface GajeomPrefill {
  homeless?: boolean;
  notCounting?: boolean;
  /** 규칙(만 30세·혼인·무주택 중 짧은 쪽)을 적용한 뒤의 무주택 기간(년) */
  homelessYears?: number;
  dependents?: number;
  /** null = 통장 없음 */
  accountMonths?: number | null;
  spouseAccountMonths?: number | null;
  /** 무주택 기간 산식 한 줄 */
  explain?: string;
}

export function gajeomInputsFromProfile(p: Profile, today = new Date()): GajeomPrefill {
  const d = derive(p, today);
  const hb = homelessBasis(p, d);
  const out: GajeomPrefill = {};
  if (hb.state === "own") out.homeless = false;
  else if (hb.state === "notCounting") {
    out.homeless = true;
    out.notCounting = true;
  } else if (hb.state === "counting") {
    out.homeless = true;
    if (hb.years !== undefined) out.homelessYears = hb.years;
  }
  if (hb.state !== "unknown") out.explain = hb.text;
  if (d.dependents !== undefined) out.dependents = d.dependents;
  if (p.hasAccount === false) out.accountMonths = null;
  else if (p.accountMonths) out.accountMonths = p.accountMonths.min;
  if (d.married && p.spouseAccountMonths) out.spouseAccountMonths = p.spouseAccountMonths.min;
  return out;
}

/** 결과 화면 가점 한 줄(모르면 points=null) — templates.ts ScoreLine과 같은 모양 */
export interface GajeomProfileLine {
  label: string;
  points: number | null;
  max: number;
  note: string;
}

/** 프로필로 가점 세 줄. 결과 화면과 계산기(gajeomInputsFromProfile)가 같은 규칙을 쓴다 */
export function gajeomLinesFromProfile(p: Profile, d: Derived = derive(p)): GajeomProfileLine[] {
  const hb = homelessBasis(p, d);
  const deps = d.dependents;
  const acc = p.hasAccount === false ? null : p.accountMonths?.min;
  const own = p.hasAccount === false ? 0 : acc === undefined ? null : accountPoints(acc);
  const bonus = d.married && p.spouseAccountMonths ? spouseAccountBonus(p.spouseAccountMonths.min) : 0;
  const accNote =
    p.hasAccount === false
      ? "통장 없음"
      : acc == null
        ? "가입 기간을 알려주세요"
        : acc < 12
          ? acc < 6
            ? "6개월 미만"
            : "6개월~1년"
          : `${Math.floor(acc / 12)}년${acc >= 180 ? " 이상" : ""}`;
  return [
    { label: "무주택 기간", points: hb.points, max: 32, note: hb.text },
    {
      label: "부양가족",
      points: deps === undefined ? null : dependentPoints(deps),
      max: 35,
      note:
        deps === undefined
          ? "가족 정보를 알려주세요"
          : deps === 0
            ? "0명 · 배우자·자녀·3년 넘게 같이 산 부모님이 있으면 1명씩 늘어요"
            : `${deps}명 · ${[d.married && "배우자", p.children ? `자녀 ${p.children}명` : "", p.livesWithParents && "부모님"].filter(Boolean).join(" · ")}`,
    },
    {
      label: "통장 가입 기간",
      points: own === null ? null : Math.min(17, own + bonus),
      max: 17,
      note: bonus ? `${accNote} + 배우자 통장 ${bonus}점` : accNote,
    },
  ];
}

/**
 * 가점 산정용 무주택기간(년).
 * 만 30세 생일과 혼인일 중 빠른 날부터 오늘까지(단, 무주택이 된 날 이후만). 만 30세 전 미혼이면 0.
 */
export function homelessYearsForScore(opts: {
  birthYear: number;
  today: Date;
  /** 혼인한 해. 미혼이면 undefined */
  marriageYear?: number;
  /** 무주택이 된 해. 태어나서 쭉 무주택이면 undefined */
  homelessSinceYear?: number;
}): number {
  const { birthYear, today, marriageYear, homelessSinceYear } = opts;
  const y = today.getFullYear() + today.getMonth() / 12;
  const turned30 = birthYear + 30;
  let start = marriageYear != null ? Math.min(turned30, marriageYear) : turned30;
  if (homelessSinceYear != null) start = Math.max(start, homelessSinceYear);
  return Math.max(0, y - start);
}
