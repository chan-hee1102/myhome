import type { Announcement, Band, GroupParams, Profile, ProfileKey, SupplyGroup } from "@/lib/domain";
import { CAPITAL_AREA } from "@/lib/domain";
import { blocOf, isCityLevel, isWideArea } from "@/lib/place";
import {
  ageText,
  bandAtLeast,
  bandAtMost,
  bandText,
  incomeText,
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

/** 혼인 상태 글자. 혼인신고 연도가 있으면 「2021년 혼인신고」 */
export function maritalText(p: Profile): string {
  const m = p.marital;
  if (m === undefined) return NOT_YET;
  if ((m === "newlywed" || m === "married") && p.marriedYear) return `${p.marriedYear}년 혼인신고`;
  return { single: "미혼", engaged: "결혼 예정", newlywed: "결혼 7년 이내", married: "결혼 7년 넘음", solo: "혼자(이혼·사별)" }[m];
}

/** 청년 계층의 「미혼」 — 지금 혼인 중이 아니면 된다(이혼·사별 포함, 예비부부도 아직 미혼) */
export function single(ctx: Ctx): Check {
  const m = ctx.p.marital;
  const tri: Tri = m === undefined ? "unknown" : m === "single" || m === "engaged" || m === "solo" ? "pass" : "fail";
  return {
    key: "single",
    label: "혼인",
    need: "미혼(지금 혼인 중이 아님)",
    mine: maritalText(ctx.p),
    tri,
    ask: m === undefined ? ["marital"] : undefined,
  };
}

/**
 * 만 6세 이하 자녀가 있는가 — 「만 6세 이하 자녀 수」 답으로만 따진다.
 * 「2세 미만 아기」 칸은 임신 중도 포함하므로 그것만으로 6세 이하 자녀가 있다고 치지 않는다.
 */
export function youngChildTri(d: Derived): Tri {
  if (d.youngChildren !== undefined) return d.youngChildren > 0 ? "pass" : "fail";
  return "unknown";
}

function youngChildMine(d: Derived): string {
  const y = d.youngChildren;
  return y === undefined ? NOT_YET : y === 0 ? "없음" : y >= 3 ? "3명 이상" : `${y}명`;
}

/**
 * 신혼부부 계층. 혼인신고 연도가 있으면 7년 이내를 그 값으로 따진다(7년 전 해에 신고했으면 날짜에 따라 갈려 unknown).
 * singleParentOk: 만 6세 이하 자녀를 둔 한부모가족도 같은 계층으로 받는 유형(행복주택·공공분양 신혼 특공·매입·전세임대 신혼)
 * youngChildOk:   결혼 7년이 넘었어도 만 6세 이하 자녀를 둔 혼인 가구를 받는 유형(행복주택 신혼·매입·전세임대 신혼)
 */
export function newlywed(
  ctx: Ctx,
  opts: { engagedOk: boolean; years?: number; singleParentOk?: boolean; youngChildOk?: boolean },
): Check {
  const { p, d } = ctx;
  const m = p.marital;
  let tri: Tri;
  let hint: string | undefined;
  let ask: ProfileKey[] | undefined;
  let mine = maritalText(p);
  const youngAsk: ProfileKey[] = p.children === undefined ? ["children", "youngChildren"] : ["youngChildren"];
  if (m === undefined) {
    tri = "unknown";
    ask = ["marital"];
  } else if (m === "engaged") tri = opts.engagedOk ? "pass" : "fail";
  else if (d.married) {
    tri = d.within7 === undefined ? "unknown" : d.within7 ? "pass" : "fail";
    if (tri === "unknown") hint = "혼인신고한 날짜에 따라 7년 이내인지 갈려요. 공고일 기준으로 따져요.";
    if (tri !== "pass" && opts.youngChildOk) {
      // 결혼 7년이 넘었어도 만 6세 이하 자녀가 있으면 같은 계층
      const y = youngChildTri(d);
      if (y === "pass") {
        tri = "pass";
        hint = undefined;
        mine = `${mine} · 6세 이하 자녀 ${youngChildMine(d)}`;
      } else if (y === "unknown") {
        const wasFail = tri === "fail";
        tri = "unknown";
        ask = youngAsk;
        hint = wasFail ? "결혼 7년이 넘었어도 만 6세 이하 자녀가 있으면 신청할 수 있어요." : hint;
      }
      // y === "fail"(6세 이하 자녀 없음)이면 혼인 기간만으로 갈린다
    }
  } else if (opts.singleParentOk && (p.children ?? 0) > 0) {
    // 미혼·혼자(이혼·사별)라도 만 6세 이하 자녀를 키우는 한부모가족이면 같은 계층
    const sp = p.special;
    const isSp: Tri = sp === undefined ? "unknown" : sp.includes("singleParent") ? "pass" : "fail";
    const y = youngChildTri(d);
    tri = isSp === "fail" || y === "fail" ? "fail" : isSp === "pass" && y === "pass" ? "pass" : "unknown";
    if (tri === "unknown") {
      ask = [...(isSp === "unknown" ? (["special"] as ProfileKey[]) : []), ...(y === "unknown" ? youngAsk : [])];
      hint = "만 6세 이하 자녀를 둔 한부모가족이라면 이 계층으로 신청할 수 있어요.";
    } else if (tri === "fail" && isSp === "pass") {
      hint = "한부모가족은 만 6세 이하 자녀가 있어야 이 계층으로 신청할 수 있어요.";
    }
    if (isSp === "pass") mine = `한부모가족 · 6세 이하 자녀 ${youngChildMine(d)}`;
  } else tri = "fail";
  const parts = [`혼인 ${opts.years ?? 7}년 이내`];
  if (opts.engagedOk) parts.push("예비부부");
  const who = [opts.singleParentOk && "한부모", opts.youngChildOk && "부부"].filter(Boolean).join("·");
  if (who) parts.push(`6세 이하 자녀를 둔 ${who}`);
  return {
    key: "newlywed",
    label: "혼인",
    need: parts.join(" · "),
    mine,
    tri,
    ask,
    hint,
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
  // 자녀 0명이면 derive가 false로 채운다(따로 묻지 않음)
  const v = ctx.d.infant;
  return {
    key: "infant",
    label: "아기",
    need: "2세 미만 자녀(임신 중 포함)",
    mine: v === undefined ? NOT_YET : v ? "있음" : ctx.p.children === 0 ? "없음(자녀 없음)" : "없음",
    tri: v === undefined ? "unknown" : v ? "pass" : "fail",
    ask: v === undefined ? (ctx.p.children === undefined ? ["children", "infant"] : ["infant"]) : undefined,
    hint: v === false ? "태아도 자녀로 쳐요. 임신 중이면 신청할 수 있어요." : undefined,
  };
}

export function marriedOrChild(ctx: Ctx): Check {
  const m = ctx.p.marital;
  const c = ctx.p.children;
  const married = !!ctx.d.married;
  let tri: Tri = "unknown";
  if (married || (c !== undefined && c > 0)) tri = "pass";
  else if (m !== undefined && c !== undefined) tri = "fail";
  return {
    key: "marriedOrChild",
    label: "가구",
    need: "혼인 중이거나 자녀가 있음",
    mine:
      m === undefined
        ? NOT_YET
        : married
          ? "혼인 중"
          : c
            ? `자녀 ${c >= 3 ? "3명 이상" : `${c}명`}`
            : c === undefined
              ? maritalText(ctx.p)
              : `${m === "solo" ? "혼자" : "미혼"} · 자녀 없음`,
    tri,
    ask: tri === "unknown" ? ["marital", "children"] : undefined,
  };
}

export function student(ctx: Ctx): Check {
  const v = ctx.p.student;
  return {
    key: "student",
    label: "대학생 여부",
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
    label: "집을 가졌던 적",
    need: "세대원 모두 집을 가져 본 적 없음",
    mine: tri === "fail" ? "있음" : v === undefined ? NOT_YET : "없음",
    tri,
    // 화면은 「집」에서 무주택을 고른 뒤에만 이 질문을 보여 준다 — 집 칸이 비었으면 그것부터
    ask: tri === "unknown" ? (home === undefined ? ["home"] : ["neverOwned"]) : undefined,
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
    mine: ctx.p.home === undefined ? NOT_YET : { none: "모두 무주택", own: "본인 집 있음", familyOwn: "같은 세대 가족 집 있음" }[ctx.p.home],
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
    mine: ctx.p.home === undefined ? NOT_YET : ctx.p.home === "own" ? "본인 집 있음" : "본인 무주택",
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
      mine: incomeText(p.income),
      tri: "unknown",
      ask: ["marital", "children"],
      hint: "가족 수를 알아야 기준 금액이 정해져요.",
    };
  }
  let tri = bandAtMost(p.income, base.limit);
  let limit = base.limit;
  let need = `월 ${manwon(base.limit)} 이하 · ${KIND_LABEL[rule.kind]} ${base.pct}%`;
  const ask: Check["ask"] = p.income ? [] : ["income"];
  let hint: string | undefined;

  if (rule.pctDual && d.married) {
    const dual = incomeLimit(ctx, rule, true)!;
    if (p.dualIncome) {
      tri = bandAtMost(p.income, dual.limit);
      limit = dual.limit;
      need =`월 ${manwon(dual.limit)} 이하 · 맞벌이 ${dual.pct}%`;
    } else if (p.dualIncome === undefined && tri !== "pass" && p.income) {
      if (bandAtMost(p.income, dual.limit) !== "fail") {
        tri = "unknown";
        ask.push("dualIncome");
        hint = `맞벌이라면 기준이 월 ${manwon(dual.limit)}로 올라가요.`;
      }
    }
  }
  if (tri === "unknown" && p.income && !hint) hint = straddleHint("소득", limit, true);
  return {
    key: "income",
    label,
    need,
    mine: p.income ? `${incomeText(p.income)} · ${d.householdSize}인 가구` : NOT_YET,
    tri,
    ask: tri === "unknown" && ask.length ? ask : undefined,
    hint,
  };
}

/** 구간이 기준선에 걸쳤을 때 한 줄 */
export function straddleHint(what: string, limit: number, monthly = false): string {
  return `기준(${monthly ? "월 " : ""}${manwon(limit)})이 고르신 ${what} 구간 안에 있어요. 정확한 금액을 알려주시면 가려져요.`;
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
    hint: tri === "unknown" && ctx.p.assets ? straddleHint("자산", limit) : undefined,
  };
}

/**
 * 부동산 기준 판정만(공공분양·민영 특공 추첨분).
 * 부동산(property)을 답했으면 그 값으로 따진다. 안 답했으면 총자산으로 추정하는데, 부동산 ≤ 총자산이므로
 * 총자산이 기준 이하면 확실히 통과, 넘으면 「부동산만 따지면 될 수도 있음」 → unknown(절대 fail로 치지 않는다).
 */
export function propertyTri(p: Profile, limit: number): Tri {
  if (p.property) return bandAtMost(p.property, limit);
  return bandAtMost(p.assets, limit) === "pass" ? "pass" : "unknown";
}

export function property(ctx: Ctx, max: number): Check {
  const limit = ctx.params.assetsMax ?? max;
  const { p } = ctx;
  const need = `${manwon(limit)} 이하 (토지·건물만)`;
  if (p.property) {
    const tri = bandAtMost(p.property, limit);
    return {
      key: "property",
      label: "부동산",
      need,
      mine: bandText(p.property),
      tri,
      hint: tri === "unknown" ? straddleHint("부동산", limit) : undefined,
    };
  }
  const t = bandAtMost(p.assets, limit);
  const tri: Tri = t === "pass" ? "pass" : "unknown";
  return {
    key: "property",
    label: "부동산",
    need,
    mine: p.assets ? `총자산 ${bandText(p.assets)}` : NOT_YET,
    tri,
    ask: tri === "unknown" ? ["property"] : undefined,
    hint:
      t === "fail" || (t === "unknown" && p.assets)
        ? "부동산(토지·건물)만 따져요. 예금·자동차를 빼면 기준 안쪽일 수 있어요. 부동산만 따로 알려주시면 정확해져요."
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
    hint: tri === "unknown" && ctx.p.car ? straddleHint("자동차", limit) : undefined,
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

/** 납입 횟수 구간 표기: 정확한 횟수면 「30회」 */
export function countBandText(b: Band | undefined): string {
  if (!b) return NOT_YET;
  if (b.max == null) return `${b.min}회 이상`;
  if (b.min === b.max) return `${b.min}회`;
  if (b.min === 0) return `${b.max + 1}회 미만`;
  return `${b.min}~${b.max}회`;
}

/** 통장 칸 ask — 화면은 「통장 있음」을 고른 뒤에만 가입 기간·횟수·금액을 묻는다 */
export function accountAsk(p: Profile, k: ProfileKey): ProfileKey[] {
  return p.hasAccount === undefined ? ["hasAccount", k] : [k];
}

export function payments(ctx: Ctx, count: number): Check {
  const { p } = ctx;
  const tri: Tri = p.hasAccount === false ? "fail" : bandAtLeast(p.payments, count);
  return {
    key: "payments",
    label: "납입 횟수",
    need: `${count}회 이상`,
    mine: p.hasAccount === false ? "통장 없음" : countBandText(p.payments),
    tri,
    ask: tri === "unknown" ? accountAsk(p, "payments") : undefined,
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
  const short = p.hasAccount === false ? null : depositShortfall(p.deposit, need);
  return {
    key: "deposit",
    label: "예치금",
    need: `${manwon(need)} 이상 (${p.sido} 거주 · 전용 ${area <= 85 ? "85㎡ 이하" : `${area}㎡`})`,
    mine: p.hasAccount === false ? "통장 없음" : bandText(p.deposit),
    tri,
    ask: tri === "unknown" ? accountAsk(p, "deposit") : undefined,
    hint:
      tri === "fail" && short
        ? `약 ${manwon(short)} 더 있어야 해요. 공고일 전에 채워야 인정돼요.`
        : tri === "unknown" && p.deposit
          ? straddleHint("예치금", need)
          : undefined,
  };
}

/**
 * 예치금 최소 부족분(만원). 구간 위 끝(「250만 원 미만」이면 250만)까지 있다고 보고 모자란 만큼 —
 * 실제로는 이보다 더 모자랄 수 있다. 충분하거나 모르면 null.
 */
export function depositShortfall(band: Band | undefined, need: number): number | null {
  if (!band || band.max == null) return null;
  const top = band.max % 10 === 9 ? band.max + 1 : band.max;
  const short = need - top;
  return short > 0 ? short : null;
}

/* ───────────────────────── 지역 ───────────────────────── */

export const isCapital = (a: Announcement) => CAPITAL_AREA.includes(a.sido);
export const isRegulated = (a: Announcement) => !!(a.regulation?.speculative || a.regulation?.adjusted);

/** 신청 가능 지역 제한(공고에 적힌 시·도 목록) */
export function applyRegion(ctx: Ctx): Check | null {
  const regions = ctx.params.applyRegions;
  if (!regions?.length) return null;
  const s = ctx.p.sido;
  return {
    key: "region",
    label: "사는 곳",
    need: `${regions.join("·")} 거주`,
    mine: s ?? NOT_YET,
    tri: s === undefined ? "unknown" : regions.includes(s) ? "pass" : "fail",
    ask: s === undefined ? ["sido"] : undefined,
  };
}

/**
 * 「해당 주택건설지역」 거주인가 — 특별시·광역시·특별자치시(와 제주)는 그 시·도, 나머지 도는 시·군이 같아야 한다
 * (주택공급에 관한 규칙). 도 지역인데 시·군을 모르면 unknown.
 */
export function sameLocal(ctx: Pick<Ctx, "a" | "p">): Tri {
  const { p, a } = ctx;
  if (!p.sido) return "unknown";
  if (p.sido !== a.sido) return "fail";
  if (isCityLevel(a.sido) || isWideArea(a)) return "pass";
  if (!p.sigungu) return "unknown";
  return p.sigungu === a.sigungu ? "pass" : "fail";
}

/**
 * 분양(민영·공공분양) 신청 가능 지역. 공고가 정한 값(params.applyRegions)이 있으면 그걸 쓰고,
 * 없으면 대체로 해당 시·도와 같은 권역(수도권·충청권·부울경·대구경북·호남·강원·제주) 거주자만 신청한다.
 */
export function saleRegion(ctx: Ctx): Check {
  const byNotice = applyRegion(ctx);
  if (byNotice) return byNotice;
  const { p, a } = ctx;
  const bloc = blocOf(a.sido);
  const s = p.sido;
  const tri: Tri = s === undefined ? "unknown" : bloc.sido.includes(s) ? "pass" : "fail";
  return {
    key: "region",
    label: "사는 곳",
    need: bloc.sido.length > 1 ? `${bloc.name}(${bloc.sido.join("·")}) 거주` : `${a.sido} 거주`,
    mine: s ?? NOT_YET,
    tri,
    ask: s === undefined ? ["sido"] : undefined,
    hint: tri === "fail" ? "대규모 택지처럼 더 넓은 지역에서 받는 예외도 있어요. 공고문에서 확인하세요." : undefined,
  };
}

/**
 * 「수급자 등 또는 소득 ○% 이하」처럼 둘 중 하나면 되는 대상 계층(영구임대·매입·전세임대 일반).
 * 해당 계층이 아니라고 답했는데 소득이 기준선에 걸치면, 그 이유를 소득 쪽으로 설명한다.
 */
export function tierCheck(tier1: Check, tier2: Check, need: string): Check {
  const tri: Tri =
    tier1.tri === "pass" || tier2.tri === "pass" ? "pass" : tier1.tri === "fail" && tier2.tri === "fail" ? "fail" : "unknown";
  const ask = [...(tier1.tri === "unknown" ? (tier1.ask ?? []) : []), ...(tier2.tri === "unknown" ? (tier2.ask ?? []) : [])];
  let mine: string;
  if (tier1.tri === "pass") mine = tier1.mine;
  else if (tier1.tri === "fail") mine = `해당 계층 없음 · 소득 ${tier2.mine}`;
  else mine = tier2.mine === NOT_YET ? NOT_YET : `소득 ${tier2.mine}`;
  let hint: string | undefined;
  if (tri === "unknown") {
    if (tier1.tri === "fail") hint = tier2.hint ?? "소득이 기준 안쪽인지 알려주시면 가려져요.";
    else if (tier2.tri === "fail") hint = `소득은 기준(${tier2.need})을 넘어요. 수급자·한부모 등에 해당하면 신청할 수 있어요.`;
    else hint = "해당 계층이나 소득을 알려주시면 가려져요.";
  }
  return { key: "tier", label: "대상 계층", need, mine, tri, ask: tri === "unknown" && ask.length ? ask : undefined, hint };
}
