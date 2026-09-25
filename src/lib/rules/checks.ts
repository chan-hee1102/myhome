import type { Announcement, GroupParams, Profile, SupplyGroup } from "@/lib/domain";
import { CAPITAL_AREA } from "@/lib/domain";
import {
  ageText,
  bandAtLeast,
  bandAtMost,
  bandText,
  manwon,
  monthsBandText,
  rangeWithin,
  type Check,
  type Derived,
  type Tri,
} from "./core";
import { depositFor, income100, type Standards } from "./standards";

/** 템플릿이 받는 판정 재료 */
export interface Ctx {
  a: Announcement;
  g: SupplyGroup;
  p: Profile;
  d: Derived;
  std: Standards;
  params: GroupParams;
}

const NOT_YET = "아직 입력 안 함";

/* ───────────────────────── 인적 조건 ───────────────────────── */

export function age(ctx: Ctx, min: number, max: number): Check {
  const { d } = ctx;
  const lo = ctx.params.ageMin ?? min;
  const hi = ctx.params.ageMax ?? max;
  const tri: Tri = d.age ? rangeWithin(d.age[0], d.age[1], lo, hi) : "unknown";
  return {
    key: "age",
    label: "나이",
    need: hi >= 150 ? `만 ${lo}세 이상` : `만 ${lo}~${hi}세`,
    mine: ageText(d.age),
    tri,
    ask: d.age ? undefined : ["birthYear"],
    hint: d.age && tri === "unknown" ? "올해 생일이 지났는지에 따라 달라져요. 공고일 기준 만 나이로 따져요." : undefined,
  };
}

export function single(ctx: Ctx): Check {
  const m = ctx.p.marital;
  const tri: Tri = m === undefined ? "unknown" : m === "single" || m === "engaged" ? "pass" : "fail";
  return {
    key: "single",
    label: "혼인",
    need: "미혼",
    mine: m === undefined ? NOT_YET : m === "single" ? "미혼" : m === "engaged" ? "결혼 예정(미혼)" : "기혼",
    tri,
    ask: m === undefined ? ["marital"] : undefined,
  };
}

export function newlywed(ctx: Ctx, opts: { engagedOk: boolean; years?: number }): Check {
  const m = ctx.p.marital;
  let tri: Tri;
  if (m === undefined) tri = "unknown";
  else if (m === "newlywed") tri = "pass";
  else if (m === "engaged") tri = opts.engagedOk ? "pass" : "fail";
  else tri = "fail";
  return {
    key: "newlywed",
    label: "혼인",
    need: `혼인 ${opts.years ?? 7}년 이내${opts.engagedOk ? " 또는 예비부부" : ""}`,
    mine:
      m === undefined
        ? NOT_YET
        : { single: "미혼", engaged: "결혼 예정", newlywed: "결혼 7년 이내", married: "결혼 7년 넘음" }[m],
    tri,
    ask: m === undefined ? ["marital"] : undefined,
  };
}

export function elderly(ctx: Ctx): Check {
  return { ...age(ctx, 65, 200), key: "elderly", label: "나이" };
}

export function children(ctx: Ctx, min: number): Check {
  const c = ctx.p.children;
  const tri: Tri = c === undefined ? "unknown" : c >= min ? "pass" : "fail";
  return {
    key: "children",
    label: "자녀",
    need: `미성년 자녀 ${min}명 이상(태아 포함)`,
    mine: c === undefined ? NOT_YET : c === 0 ? "없음" : c >= 3 ? "3명 이상" : `${c}명`,
    tri,
    ask: c === undefined ? ["children"] : undefined,
  };
}

export function infant(ctx: Ctx): Check {
  const v = ctx.p.infant;
  return {
    key: "infant",
    label: "아기",
    need: "2세 미만 자녀(임신 중 포함)",
    mine: v === undefined ? NOT_YET : v ? "있음" : "없음",
    tri: v === undefined ? "unknown" : v ? "pass" : "fail",
    ask: v === undefined ? ["infant"] : undefined,
  };
}

export function marriedOrChild(ctx: Ctx): Check {
  const m = ctx.p.marital;
  const c = ctx.p.children;
  let tri: Tri = "unknown";
  if (m === "newlywed" || m === "married" || (c !== undefined && c > 0)) tri = "pass";
  else if (m !== undefined && c !== undefined) tri = "fail";
  return {
    key: "marriedOrChild",
    label: "가구",
    need: "혼인 중이거나 자녀가 있음",
    mine: m === undefined ? NOT_YET : m === "newlywed" || m === "married" ? "기혼" : c ? `자녀 ${c}명` : "미혼·자녀 없음",
    tri,
    ask: tri === "unknown" ? ["marital", "children"] : undefined,
  };
}

export function student(ctx: Ctx): Check {
  const v = ctx.p.student;
  return {
    key: "student",
    label: "신분",
    need: "대학생(재학·입학 예정·졸업 2년 이내)",
    mine: v === undefined ? NOT_YET : v ? "대학생" : "대학생 아님",
    tri: v === undefined ? "unknown" : v ? "pass" : "fail",
    ask: v === undefined ? ["student"] : undefined,
  };
}

export function parents(ctx: Ctx): Check {
  const v = ctx.p.livesWithParents;
  return {
    key: "parents",
    label: "부양",
    need: "만 65세 이상 부모님을 3년 이상 모심(같은 주민등록)",
    mine: v === undefined ? NOT_YET : v ? "모시고 있음" : "해당 없음",
    tri: v === undefined ? "unknown" : v ? "pass" : "fail",
    ask: v === undefined ? ["livesWithParents"] : undefined,
  };
}

export function head(ctx: Ctx): Check {
  const v = ctx.p.householdHead;
  return {
    key: "head",
    label: "세대주",
    need: "세대주",
    mine: v === undefined ? NOT_YET : v ? "세대주" : "세대원",
    tri: v === undefined ? "unknown" : v ? "pass" : "fail",
    ask: v === undefined ? ["householdHead"] : undefined,
  };
}

export function notWon(ctx: Ctx): Check {
  const v = ctx.p.wonRecently;
  return {
    key: "notWon",
    label: "당첨 이력",
    need: "최근 5년 안에 세대원 모두 당첨 사실 없음",
    mine: v === undefined ? NOT_YET : v ? "당첨된 적 있음" : "없음",
    tri: v === undefined ? "unknown" : v ? "fail" : "pass",
    ask: v === undefined ? ["wonRecently"] : undefined,
  };
}

export function neverOwned(ctx: Ctx): Check {
  const v = ctx.p.neverOwned;
  const home = ctx.p.home;
  let tri: Tri = v === undefined ? "unknown" : v ? "pass" : "fail";
  if (home && home !== "none") tri = "fail";
  return {
    key: "neverOwned",
    label: "주택 소유 이력",
    need: "세대원 모두 집을 가져 본 적 없음",
    mine: tri === "fail" ? "소유 이력 있음" : v === undefined ? NOT_YET : "없음",
    tri,
    ask: tri === "unknown" ? ["neverOwned"] : undefined,
  };
}

export function taxFive(ctx: Ctx): Check {
  const v = ctx.p.taxFiveYears;
  return {
    key: "taxFive",
    label: "소득세",
    need: "근로·사업소득세 5년 이상 납부",
    mine: v === undefined ? NOT_YET : v ? "5년 이상" : "5년 미만",
    tri: v === undefined ? "unknown" : v ? "pass" : "fail",
    ask: v === undefined ? ["taxFiveYears"] : undefined,
  };
}

const SPECIAL_LABEL = {
  recipient: "기초생활수급자",
  nearPoor: "차상위계층",
  singleParent: "한부모가족",
  disabled: "장애인",
  veteran: "국가유공자",
} as const;

export function specialAny(ctx: Ctx, list: (keyof typeof SPECIAL_LABEL)[], label = "대상 계층"): Check {
  const s = ctx.p.special;
  const tri: Tri = s === undefined ? "unknown" : s.some((x) => list.includes(x)) ? "pass" : "fail";
  return {
    key: "special",
    label,
    need: list.map((k) => SPECIAL_LABEL[k]).join(" · "),
    mine: s === undefined ? NOT_YET : s.length ? s.map((k) => SPECIAL_LABEL[k]).join(", ") : "해당 없음",
    tri,
    ask: s === undefined ? ["special"] : undefined,
  };
}

/* ───────────────────────── 주택 ───────────────────────── */

export function homelessHousehold(ctx: Ctx): Check {
  const v = ctx.d.homelessHousehold;
  return {
    key: "homeless",
    label: "주택",
    need: "세대원 모두 무주택",
    mine: ctx.p.home === undefined ? NOT_YET : { none: "모두 무주택", own: "본인 소유", familyOwn: "세대원 소유" }[ctx.p.home],
    tri: v === undefined ? "unknown" : v ? "pass" : "fail",
    ask: v === undefined ? ["home"] : undefined,
  };
}

export function homelessSelf(ctx: Ctx): Check {
  const v = ctx.d.homelessSelf;
  return {
    key: "homeless",
    label: "주택",
    need: "본인 무주택",
    mine: ctx.p.home === undefined ? NOT_YET : ctx.p.home === "own" ? "본인 소유" : "무주택",
    tri: v === undefined ? "unknown" : v ? "pass" : "fail",
    ask: v === undefined ? ["home"] : undefined,
  };
}

/* ───────────────────────── 소득·자산 ───────────────────────── */

export interface IncomeRule {
  kind: "rent" | "sale" | "median";
  pct: number;
  /** 맞벌이 기준 %(가산 전) */
  pctDual?: number;
  /** 1인 +20%p, 2인 +10%p 가산 여부(임대 계열) */
  bonus?: boolean;
  /** 가산 폭을 직접 지정(통합공공임대 등) */
  bonusBy?: { one: number; two: number };
}

const KIND_LABEL = { rent: "도시근로자 월평균소득", sale: "도시근로자 월평균소득", median: "기준 중위소득" };

export function incomeLimit(ctx: Ctx, rule: IncomeRule, dual = false): { limit: number; pct: number } | null {
  const size = ctx.d.householdSize;
  if (size === undefined) return null;
  let pct = dual && rule.pctDual ? rule.pctDual : (ctx.params.incomePct ?? rule.pct);
  if (size === 1 && ctx.params.incomePctSingle && !dual) pct = ctx.params.incomePctSingle;
  else if (rule.bonus || rule.bonusBy) {
    const by = rule.bonusBy ?? { one: 20, two: 10 };
    pct += size === 1 ? by.one : size === 2 ? by.two : 0;
  }
  return { limit: (income100(ctx.std, size, rule.kind) * pct) / 100, pct };
}

export function income(ctx: Ctx, rule: IncomeRule, label = "소득"): Check {
  const { p, d } = ctx;
  const base = incomeLimit(ctx, rule);
  if (!base) {
    return {
      key: "income",
      label,
      need: `${KIND_LABEL[rule.kind]} ${rule.pct}% 이하`,
      mine: p.income ? bandText(p.income) : NOT_YET,
      tri: "unknown",
      ask: ["marital", "children"],
      hint: "가족 수를 알아야 기준 금액이 정해져요.",
    };
  }
  let tri = bandAtMost(p.income, base.limit);
  let need = `월 ${manwon(base.limit)} 이하 · ${KIND_LABEL[rule.kind]} ${base.pct}%`;
  const ask: Check["ask"] = p.income ? [] : ["income"];
  let hint: string | undefined;

  if (rule.pctDual && d.married) {
    const dual = incomeLimit(ctx, rule, true)!;
    if (p.dualIncome) {
      tri = bandAtMost(p.income, dual.limit);
      need = `월 ${manwon(dual.limit)} 이하 · 맞벌이 ${dual.pct}%`;
    } else if (p.dualIncome === undefined && tri !== "pass" && p.income) {
      if (bandAtMost(p.income, dual.limit) !== "fail") {
        tri = "unknown";
        ask.push("dualIncome");
        hint = `맞벌이라면 기준이 월 ${manwon(dual.limit)}로 올라가요.`;
      }
    }
  }
  if (tri === "unknown" && p.income && !hint) hint = "고르신 소득 구간이 기준선에 걸쳐 있어요.";
  return {
    key: "income",
    label,
    need,
    mine: p.income ? `${bandText(p.income)} · ${d.householdSize}인 가구` : NOT_YET,
    tri,
    ask: tri === "unknown" && ask.length ? ask : undefined,
    hint,
  };
}

export function assets(ctx: Ctx, max: number, label = "총자산"): Check {
  const limit = ctx.params.assetsMax ?? max;
  const tri = bandAtMost(ctx.p.assets, limit);
  return {
    key: "assets",
    label,
    need: `${manwon(limit)} 이하`,
    mine: bandText(ctx.p.assets),
    tri,
    ask: tri === "unknown" ? ["assets"] : undefined,
    hint: tri === "unknown" && ctx.p.assets ? "고르신 자산 구간이 기준선에 걸쳐 있어요." : undefined,
  };
}

/**
 * 부동산 기준(공공분양·민영 특공 추첨분). 우리는 총자산만 묻는데 부동산 ≤ 총자산이므로
 * 총자산이 기준 이하면 확실히 통과, 넘으면 「부동산만 따지면 될 수도 있음」 → unknown(절대 fail로 치지 않는다).
 */
export function property(ctx: Ctx, max: number): Check {
  const limit = ctx.params.assetsMax ?? max;
  const t = bandAtMost(ctx.p.assets, limit);
  const tri: Tri = t === "pass" ? "pass" : "unknown";
  return {
    key: "property",
    label: "부동산",
    need: `${manwon(limit)} 이하 (토지·건물만)`,
    mine: ctx.p.assets ? `총자산 ${bandText(ctx.p.assets)}` : NOT_YET,
    tri,
    ask: ctx.p.assets ? undefined : ["assets"],
    hint:
      t === "fail" || (t === "unknown" && ctx.p.assets)
        ? "부동산만 따져요. 총자산이 많아도 예금·자동차를 빼면 기준 안쪽일 수 있어요."
        : undefined,
  };
}

export function car(ctx: Ctx, max: number): Check {
  const limit = ctx.params.carMax ?? max;
  const tri = limit === 0 ? bandAtMost(ctx.p.car, 0) : bandAtMost(ctx.p.car, limit);
  return {
    key: "car",
    label: "자동차",
    need: limit === 0 ? "자동차 없음" : `${manwon(limit)} 이하`,
    mine: bandText(ctx.p.car),
    tri,
    ask: tri === "unknown" ? ["car"] : undefined,
  };
}

/* ───────────────────────── 청약통장 ───────────────────────── */

export function hasAccount(ctx: Ctx): Check {
  const v = ctx.p.hasAccount;
  return {
    key: "hasAccount",
    label: "청약통장",
    need: "주택청약종합저축 가입",
    mine: v === undefined ? NOT_YET : v ? "있음" : "없음",
    tri: v === undefined ? "unknown" : v ? "pass" : "fail",
    ask: v === undefined ? ["hasAccount"] : undefined,
  };
}

function monthsText(m: number) {
  return m % 12 === 0 ? `${m / 12}년` : `${m}개월`;
}

export function accountPeriod(ctx: Ctx, months: number): Check {
  const { p } = ctx;
  const tri: Tri = p.hasAccount === false ? "fail" : bandAtLeast(p.accountMonths, months);
  return {
    key: "accountPeriod",
    label: "통장 가입 기간",
    need: `${monthsText(months)} 이상`,
    mine: p.hasAccount === false ? "통장 없음" : monthsBandText(p.accountMonths),
    tri,
    ask: tri === "unknown" ? ["hasAccount", "accountMonths"] : undefined,
  };
}

export function payments(ctx: Ctx, count: number): Check {
  const { p } = ctx;
  const tri: Tri = p.hasAccount === false ? "fail" : bandAtLeast(p.payments, count);
  return {
    key: "payments",
    label: "납입 횟수",
    need: `${count}회 이상`,
    mine: p.hasAccount === false ? "통장 없음" : p.payments ? (p.payments.max == null ? `${p.payments.min}회 이상` : `${p.payments.min}~${p.payments.max}회`) : "아직 입력 안 함",
    tri,
    ask: tri === "unknown" ? ["payments"] : undefined,
  };
}

export function deposit(ctx: Ctx, area: number): Check {
  const { p } = ctx;
  if (!p.sido) {
    return {
      key: "deposit",
      label: "예치금",
      need: "거주 지역·면적별 기준 이상",
      mine: bandText(p.deposit),
      tri: "unknown",
      ask: ["sido"],
    };
  }
  const need = depositFor(p.sido, area);
  const tri: Tri = p.hasAccount === false ? "fail" : bandAtLeast(p.deposit, need);
  return {
    key: "deposit",
    label: "예치금",
    need: `${manwon(need)} 이상 (${p.sido} 거주 · 전용 ${area <= 85 ? "85㎡ 이하" : `${area}㎡`})`,
    mine: p.hasAccount === false ? "통장 없음" : bandText(p.deposit),
    tri,
    ask: tri === "unknown" ? ["deposit"] : undefined,
  };
}

/* ───────────────────────── 지역 ───────────────────────── */

export const isCapital = (a: Announcement) => CAPITAL_AREA.includes(a.sido);
export const isRegulated = (a: Announcement) => !!(a.regulation?.speculative || a.regulation?.adjusted);

/** 신청 가능 지역 제한(청약 신청은 보통 해당 시·도나 수도권 거주자로 제한된다) */
export function applyRegion(ctx: Ctx): Check | null {
  const regions = ctx.params.applyRegions;
  if (!regions?.length) return null;
  const s = ctx.p.sido;
  return {
    key: "region",
    label: "거주지",
    need: `${regions.join("·")} 거주`,
    mine: s ?? NOT_YET,
    tri: s === undefined ? "unknown" : regions.includes(s) ? "pass" : "fail",
    ask: s === undefined ? ["sido"] : undefined,
  };
}
