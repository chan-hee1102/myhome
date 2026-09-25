import type { GroupId, ProfileKey, ProgramId } from "@/lib/domain";
import { CAPITAL_AREA } from "@/lib/domain";
import { all, bandAtLeast, bandAtMost, type Check, type Tri } from "./core";
import * as C from "./checks";
import type { IncomeRule } from "./checks";
import { AGE, INCOME } from "./criteria";
import { accountPoints, dependentPoints, homelessPoints } from "./gajeom";
import { income100 } from "./standards";

/**
 * 주택 유형 × 공급 대상별 판정 템플릿.
 * 기본값은 법령·지침(2026-09 조사, docs/DESIGN.md 4장)이고, 공고문에서 읽은 값(GroupParams)이 있으면 그걸 쓴다.
 *
 * 템플릿이 돌려주는 것
 *   checks  자격 조건(전부 pass여야 「신청 가능」)
 *   rank    예상 순위(자격과 별개 — 자격은 되는데 2순위일 수 있다)
 *   score   배점·가점(동순위 경쟁 시 쓰는 점수)
 *   notes   선정 방식 한 줄 설명
 */

export interface RankInfo {
  /** 예) "예상 1순위", "1순위", "2순위", "추첨" */
  label: string;
  /** 1이 가장 좋다. 정렬용. 추첨·순위 없음은 5 */
  order: number;
  tri: Tri;
  detail?: string;
  ask?: ProfileKey[];
}

export interface ScoreLine {
  label: string;
  /** null이면 입력이 없어 계산 못 함 */
  points: number | null;
  max: number;
  note: string;
}

export interface ScoreInfo {
  title: string;
  lines: ScoreLine[];
  total: number;
  max: number;
  /** 모르는 칸이 있어 최소값만 합산했다 */
  partial: boolean;
}

export interface TemplateOut {
  checks: Check[];
  /** 순위(분양 1순위) 요건. 자격과 달리 미달이어도 2순위로 신청할 수 있다 */
  rankChecks?: Check[];
  rank?: RankInfo;
  score?: ScoreInfo;
  notes: string[];
  /** 순위 계산에 필요한데 비어 있는 칸 */
  asks?: ProfileKey[];
}

type Template = (ctx: C.Ctx) => TemplateOut;

const compact = <T,>(xs: (T | null | undefined | false)[]) => xs.filter(Boolean) as T[];

/* ───────────────────────── 공통 순위 모델 ───────────────────────── */

/** 거주지 기반 순위(행복·국민임대 50㎡ 미만): 1 해당·연접 시·군·구 → 2 같은 시·도(권역) → 3 그 밖 */
function residenceRank(ctx: C.Ctx): RankInfo {
  const { p, a } = ctx;
  if (!p.sido) return { label: "순위 확인 필요", order: 4, tri: "unknown", ask: ["sido"] };
  if (p.sido === a.sido) {
    if (p.sigungu && p.sigungu === a.sigungu)
      return { label: "예상 1순위", order: 1, tri: "pass", detail: `${a.sigungu} 거주 — 해당 지역 1순위` };
    if (p.sigungu)
      return {
        label: "예상 1~2순위",
        order: 2,
        tri: "unknown",
        detail: `${a.sigungu}와 붙어 있는(연접) 시·군·구면 1순위, 아니면 2순위예요.`,
      };
    return {
      label: "예상 1~2순위",
      order: 2,
      tri: "unknown",
      detail: "시·군·구까지 알려주시면 순위가 정해져요.",
      ask: ["sigungu"],
    };
  }
  if (CAPITAL_AREA.includes(p.sido) && CAPITAL_AREA.includes(a.sido))
    return { label: "예상 2순위", order: 2, tri: "pass", detail: "같은 수도권 권역 거주" };
  return { label: "예상 3순위", order: 3, tri: "pass", detail: "공고 지역 밖 거주" };
}

/** 분양 1순위: 요건 전부 pass면 1순위, 하나라도 fail이면 2순위, 모르면 확인 필요 */
function saleRank(ctx: C.Ctx, reqs: Check[], detail: string): RankInfo {
  const tri = all(reqs.map((c) => c.tri));
  const asks = reqs.flatMap((c) => (c.tri === "unknown" ? (c.ask ?? []) : []));
  const local = ctx.p.sido === ctx.a.sido;
  const where = ctx.p.sido ? (local ? " · 해당지역" : " · 기타지역") : "";
  if (tri === "pass") return { label: `1순위${where}`, order: 1, tri, detail };
  if (tri === "fail")
    return {
      label: "2순위",
      order: 3,
      tri: "pass",
      detail: `1순위 조건 중 ${reqs.filter((c) => c.tri === "fail").map((c) => c.label).join("·")}이(가) 모자라요.`,
    };
  return { label: "1순위 확인 필요", order: 2, tri: "unknown", detail, ask: [...new Set(asks)] };
}

/* ───────────────────────── 배점 ───────────────────────── */

function tierPoints(v: number | undefined, tiers: [number, number][]): number | null {
  if (v === undefined) return null;
  for (const [min, pts] of tiers) if (v >= min) return pts;
  return 0;
}

function sumScore(title: string, lines: ScoreLine[]): ScoreInfo {
  return {
    title,
    lines,
    total: lines.reduce((s, l) => s + (l.points ?? 0), 0),
    max: lines.reduce((s, l) => s + l.max, 0),
    partial: lines.some((l) => l.points === null),
  };
}

const bandMin = (b?: { min: number }) => b?.min;

/** 민영 가점 84점 */
function gajeomScore(ctx: C.Ctx): ScoreInfo {
  const { p, d } = ctx;
  const homeless = d.homelessHousehold;
  // 무주택 기간: 만 30세(그 전에 결혼했다면 혼인신고일)부터, 무주택이 된 뒤로만 센다.
  // 만 30세 전 미혼 무주택은 0점, 유주택도 0점. 혼인 연도는 받지 않아 30세 기준(더 짧은 쪽)으로 센다.
  let hPts: number | null = null;
  let hNote = "무주택이 된 지 얼마나 됐는지 알려주세요";
  if (homeless === false) {
    hPts = 0;
    hNote = "주택 소유";
  } else if (p.birthYear && homeless) {
    const since30 = d.year - (p.birthYear + 30);
    if (since30 < 0 && !d.married) {
      hPts = 0;
      hNote = "만 30세 전 미혼은 0점";
    } else if (p.homelessYears !== undefined) {
      const years = Math.max(0, Math.min(Math.max(0, since30), p.homelessYears));
      hPts = homelessPoints(years);
      hNote = years < 1 ? "1년 미만" : `${Math.floor(years)}년${d.married && since30 < 5 ? " (30세 전 혼인이면 더 길어요)" : ""}`;
    }
  } else if (!p.birthYear) {
    hNote = "출생연도가 필요해요";
  }
  const deps = d.dependents;
  const acc = p.hasAccount === false ? null : bandMin(p.accountMonths);
  return sumScore("청약 가점", [
    { label: "무주택 기간", points: hPts, max: 32, note: hNote },
    {
      label: "부양가족",
      points: deps === undefined ? null : dependentPoints(deps),
      max: 35,
      note: deps === undefined ? "가족 정보가 필요해요" : `${deps}명 · 배우자·자녀·3년 이상 모신 부모`,
    },
    {
      label: "통장 가입 기간",
      points: p.hasAccount === false ? 0 : acc === undefined ? null : accountPoints(acc),
      max: 17,
      note:
        p.hasAccount === false || acc == null
          ? p.hasAccount === false
            ? "통장 없음"
            : "가입 기간이 필요해요"
          : acc < 12
            ? `${acc}개월 이상`
            : `${Math.floor(acc / 12)}년 이상`,
    },
  ]);
}

/** 국민임대 동순위 배점(항목별 최대 3점) [S9] */
function nationalScore(ctx: C.Ctx): ScoreInfo {
  const { p, d } = ctx;
  const ageLo = d.age?.[0];
  return sumScore("동순위 배점", [
    { label: "나이", points: tierPoints(ageLo, [[50, 3], [40, 2], [30, 1]]), max: 3, note: "50세 이상 3 · 40대 2 · 30대 1" },
    { label: "부양가족", points: tierPoints(d.dependents, [[3, 3], [2, 2], [1, 1]]), max: 3, note: "3명 이상 3 · 2명 2 · 1명 1" },
    {
      label: "해당 지역 거주",
      points: p.sido && p.sido !== ctx.a.sido ? 0 : tierPoints(p.residenceYears, [[5, 3], [3, 2], [1, 1]]),
      max: 3,
      note: "5년 이상 3 · 3~5년 2 · 1~3년 1",
    },
    {
      label: "65세 이상 부모 부양",
      points: p.livesWithParents === undefined ? null : p.livesWithParents ? 3 : 0,
      max: 3,
      note: "1년 이상 부양 3",
    },
    { label: "미성년 자녀", points: tierPoints(p.children, [[3, 3], [2, 2]]), max: 3, note: "3명 이상 3 · 2명 2" },
    {
      label: "통장 납입",
      points: p.hasAccount === false ? 0 : tierPoints(bandMin(p.payments), [[60, 3], [48, 2], [36, 1]]),
      max: 3,
      note: "60회 3 · 48회 2 · 36회 1",
    },
  ]);
}

/** 통합공공임대 우선공급 배점 [S8] */
function integratedScore(ctx: C.Ctx): ScoreInfo {
  const { p, d } = ctx;
  let incomePts: number | null = null;
  if (p.income && d.householdSize) {
    const base = income100(ctx.std, d.householdSize, "median");
    const pct = (p.income.max ?? Infinity) / base * 100;
    incomePts = pct <= 50 ? 3 : pct <= 70 ? 2 : pct <= 100 ? 1 : (p.income.min / base) * 100 > 100 ? 0 : null;
  }
  const soloHead = d.householdSize === 1;
  return sumScore("우선공급 배점", [
    { label: "소득(중위소득 대비)", points: incomePts, max: 3, note: "50% 이하 3 · 70% 이하 2 · 100% 이하 1" },
    {
      label: "부양가족",
      points: soloHead ? 0 : tierPoints(d.dependents, [[3, 3], [2, 2], [1, 1]]),
      max: 3,
      note: soloHead ? "단독세대주는 적용 안 함" : "3명 이상 3 · 2명 2 · 1명 1",
    },
    {
      label: "해당 시·군·구 거주",
      points: p.sido && p.sido !== ctx.a.sido ? 0 : tierPoints(p.residenceYears, [[5, 3], [3, 2], [1, 1]]),
      max: 3,
      note: "5년 이상 3 · 3~5년 2 · 1~3년 1",
    },
    {
      label: "미성년 자녀",
      points: soloHead ? 0 : tierPoints(p.children, [[3, 3], [2, 2], [1, 1]]),
      max: 3,
      note: "3명 이상 3 · 2명 2 · 1명 1",
    },
    {
      label: "통장 납입",
      points: p.hasAccount === false ? 0 : tierPoints(bandMin(p.payments), [[24, 3], [12, 2], [6, 1]]),
      max: 3,
      note: "24회 3 · 12회 2 · 6회 1",
    },
  ]);
}

/** 다자녀 특별공급 100점 배점 [S12 — 원문 재확인 권장] */
function multiChildScore(ctx: C.Ctx): ScoreInfo {
  const { p } = ctx;
  return sumScore("다자녀 배점", [
    { label: "미성년 자녀", points: tierPoints(p.children, [[4, 40], [3, 35], [2, 25]]), max: 40, note: "4명 이상 40 · 3명 35 · 2명 25" },
    {
      label: "영유아 자녀",
      points: p.infant === undefined ? null : p.infant ? 5 : 0,
      max: 15,
      note: "3명 이상 15 · 2명 10 · 1명 5 (2세 미만 기준으로만 계산)",
    },
    {
      label: "세대 구성",
      points: p.livesWithParents === undefined ? null : p.livesWithParents ? 5 : p.special?.includes("singleParent") ? 5 : 0,
      max: 5,
      note: "3세대 이상 또는 한부모 5",
    },
    { label: "무주택 기간", points: tierPoints(p.homelessYears, [[10, 20], [5, 15], [1, 10]]), max: 20, note: "10년 이상 20 · 5~10년 15 · 1~5년 10" },
    {
      label: "해당 시·도 거주",
      points: p.sido && p.sido !== ctx.a.sido ? 0 : tierPoints(p.residenceYears, [[10, 15], [5, 10], [1, 5]]),
      max: 15,
      note: "10년 이상 15 · 5~10년 10 · 1~5년 5",
    },
    {
      label: "통장 가입 10년 이상",
      points: p.hasAccount === false ? 0 : tierPoints(bandMin(p.accountMonths), [[120, 5]]),
      max: 5,
      note: "10년 이상 5",
    },
  ]);
}

/** 공공분양 신혼·신생아 특별공급 배점(항목별 최대 3점) [S5] */
function publicNewlywedScore(ctx: C.Ctx): ScoreInfo {
  const { p, d } = ctx;
  let incomePts: number | null = null;
  if (p.income && d.householdSize) {
    const pct = p.dualIncome ? 100 : 80;
    const limit = (income100(ctx.std, d.householdSize, "sale") * pct) / 100;
    const t = bandAtMost(p.income, limit);
    incomePts = t === "pass" ? 1 : t === "fail" ? 0 : null;
  }
  return sumScore("특별공급 배점", [
    { label: "소득", points: incomePts, max: 1, note: "80% 이하(맞벌이 100%) 1" },
    { label: "자녀 수", points: tierPoints(p.children, [[3, 3], [2, 2], [1, 1]]), max: 3, note: "3명 이상 3 · 2명 2 · 1명 1" },
    {
      label: "해당 지역 거주",
      points: p.sido && p.sido !== ctx.a.sido ? 0 : tierPoints(p.residenceYears, [[3, 3], [1, 2], [0, 1]]),
      max: 3,
      note: "3년 이상 3 · 1~3년 2 · 1년 미만 1",
    },
    {
      label: "통장 납입",
      points: p.hasAccount === false ? 0 : tierPoints(bandMin(p.payments), [[24, 3], [12, 2], [6, 1]]),
      max: 3,
      note: "24회 3 · 12회 2 · 6회 1",
    },
    { label: "혼인 기간", points: null, max: 3, note: "3년 이하 3 · 5년 이하 2 · 7년 이하 1 (혼인 연도를 받지 않아 제외)" },
  ]);
}

/* ───────────────────────── 템플릿 ───────────────────────── */

const RENT_ASSETS = (ctx: C.Ctx) => [C.assets(ctx, ctx.std.assets.rentGeneral), C.car(ctx, ctx.std.assets.car)];

const happy: Partial<Record<GroupId, Template>> = {
  youth: (ctx) => ({
    checks: [
      C.age(ctx, ...AGE.youth),
      C.single(ctx),
      C.homelessSelf(ctx),
      C.income(ctx, INCOME.happyYouth),
      C.assets(ctx, ctx.std.assets.happyYouth),
      C.car(ctx, ctx.std.assets.car),
    ],
    rank: residenceRank(ctx),
    notes: ["같은 순위 안에서는 추첨으로 뽑아요.", "소득 있는 업무 5년 이내·예술인도 청년 계층으로 신청할 수 있어요."],
  }),
  student: (ctx) => ({
    checks: [
      C.student(ctx),
      C.single(ctx),
      C.homelessSelf(ctx),
      { ...C.income(ctx, INCOME.happyStudent), label: "소득(본인+부모)", tri: "unknown", hint: "부모님 소득까지 합쳐 따져요." },
      C.assets(ctx, ctx.std.assets.happyStudent),
      C.car(ctx, 0),
    ],
    rank: residenceRank(ctx),
    notes: ["거주지 또는 학교 소재지 기준으로 순위를 매기고, 같은 순위는 추첨해요."],
  }),
  newlywed: (ctx) => ({
    checks: [
      C.newlywed(ctx, { engagedOk: true }),
      C.homelessHousehold(ctx),
      C.income(ctx, INCOME.happyNewlywed),
      ...RENT_ASSETS(ctx),
    ],
    rank: residenceRank(ctx),
    notes: ["한부모가족·6세 이하 자녀를 둔 가구도 이 계층으로 신청해요.", "같은 순위 안에서는 추첨해요."],
  }),
  elderly: (ctx) => ({
    checks: [C.elderly(ctx), C.homelessHousehold(ctx), C.income(ctx, INCOME.happyElderly), ...RENT_ASSETS(ctx)],
    rank: residenceRank(ctx),
    notes: ["고령자·주거급여 수급자 계층에 전체의 20%를 공급해요."],
  }),
  benefit: (ctx) => ({
    checks: [C.specialAny(ctx, ["recipient"], "주거급여 수급"), C.homelessHousehold(ctx), ...RENT_ASSETS(ctx)],
    rank: residenceRank(ctx),
    notes: ["주거급여 수급자는 소득 기준을 따로 보지 않아요."],
  }),
};

const national: Partial<Record<GroupId, Template>> = {
  general: (ctx) => {
    const minArea = Math.min(...ctx.a.units.map((u) => u.area));
    const rule = minArea > 60 ? INCOME.nationalLarge : INCOME.nationalSmall;
    let rank: RankInfo;
    if (minArea < 50) rank = residenceRank(ctx);
    else {
      const t = bandAtLeast(ctx.p.payments, 24);
      const t6 = bandAtLeast(ctx.p.payments, 6);
      if (ctx.p.hasAccount === false) rank = { label: "예상 3순위", order: 3, tri: "pass", detail: "50㎡ 이상은 통장 납입 횟수로 순위를 정해요." };
      else if (t === "pass") rank = { label: "예상 1순위", order: 1, tri: "pass", detail: "통장 24회 이상 납입" };
      else if (t6 === "pass") rank = { label: t === "unknown" ? "예상 1~2순위" : "예상 2순위", order: 2, tri: t === "unknown" ? "unknown" : "pass", detail: "통장 6회 이상 납입" };
      else if (t6 === "fail") rank = { label: "예상 3순위", order: 3, tri: "pass", detail: "통장 납입 6회 미만" };
      else rank = { label: "순위 확인 필요", order: 4, tri: "unknown", detail: "50㎡ 이상은 통장 납입 횟수로 순위를 정해요.", ask: ["hasAccount", "payments"] };
    }
    return {
      checks: [C.homelessHousehold(ctx), C.income(ctx, rule), ...RENT_ASSETS(ctx)],
      rank,
      score: nationalScore(ctx),
      notes: [
        "전용 50㎡ 미만은 거주지, 50㎡ 이상은 통장 납입 횟수로 순위를 매겨요.",
        "같은 순위면 미성년 자녀 3명 이상 가구를 먼저 뽑고, 그다음 배점 순이에요.",
        minArea < 50 ? "50㎡ 미만은 소득 50% 이하에 먼저 공급하고 70%까지 넓혀요." : "",
      ].filter(Boolean),
    };
  },
};

const permanent: Partial<Record<GroupId, Template>> = {
  benefit: (ctx) => {
    const tier1 = C.specialAny(ctx, ["recipient", "singleParent", "disabled", "veteran", "nearPoor"]);
    const tier2 = C.income(ctx, INCOME.permanentTier2);
    const who: Check = {
      key: "tier",
      label: "대상 계층",
      need: "수급자·한부모·장애인·유공자 등 또는 소득 50% 이하",
      mine: tier1.tri === "pass" ? tier1.mine : tier2.mine,
      tri: tier1.tri === "pass" || tier2.tri === "pass" ? "pass" : tier1.tri === "fail" && tier2.tri === "fail" ? "fail" : "unknown",
      ask: [...(tier1.ask ?? []), ...(tier2.ask ?? [])],
    };
    return {
      checks: [who, C.homelessHousehold(ctx), C.assets(ctx, ctx.std.assets.permanent), C.car(ctx, ctx.std.assets.car)],
      rank:
        tier1.tri === "pass"
          ? { label: "예상 1순위", order: 1, tri: "pass" }
          : tier2.tri === "pass"
            ? { label: "예상 2순위", order: 2, tri: "pass" }
            : { label: "순위 확인 필요", order: 4, tri: "unknown" },
      notes: ["순위를 정한 뒤 지자체가 입주자를 선정해요. 세부 배점은 공고마다 달라요."],
    };
  },
};

const integrated: Partial<Record<GroupId, Template>> = {
  youth: (ctx) => ({
    checks: [
      C.age(ctx, ...AGE.integratedYouth),
      C.single(ctx),
      C.homelessSelf(ctx),
      C.income(ctx, INCOME.integrated),
      ...RENT_ASSETS(ctx),
    ],
    score: integratedScore(ctx),
    rank: { label: "배점·추첨", order: 5, tri: "pass" },
    notes: ["우선공급 60%는 배점 순, 일반공급은 소득 구간별 추첨이에요."],
  }),
  newlywed: (ctx) => ({
    checks: [
      C.newlywed(ctx, { engagedOk: true }),
      C.homelessHousehold(ctx),
      C.income(ctx, INCOME.integratedNewlywed),
      ...RENT_ASSETS(ctx),
    ],
    score: integratedScore(ctx),
    rank: { label: "배점·추첨", order: 5, tri: "pass" },
    notes: ["우선공급 60%는 배점 순, 일반공급은 소득 구간별 추첨이에요."],
  }),
  general: (ctx) => ({
    checks: [C.homelessHousehold(ctx), C.income(ctx, INCOME.integrated), ...RENT_ASSETS(ctx)],
    score: integratedScore(ctx),
    rank: { label: "배점·추첨", order: 5, tri: "pass" },
    notes: ["소득은 도시근로자 소득이 아니라 기준 중위소득으로 따져요.", "2세 미만 자녀 가구에 일반공급의 5%를 먼저 배정해요."],
  }),
};

function youthPurchase(ctx: C.Ctx, jeonse: boolean): TemplateOut {
  const t1 = C.specialAny(ctx, ["recipient", "nearPoor", "singleParent"]);
  const t3 = C.income(ctx, INCOME.purchaseYouthTier3, "본인 소득");
  const t3a = C.assets(ctx, ctx.std.assets.happyYouth);
  const tier3 = all([t3.tri, t3a.tri]);
  const rank: RankInfo =
    t1.tri === "pass"
      ? { label: "예상 1순위", order: 1, tri: "pass", detail: "수급자·차상위·한부모" }
      : tier3 === "pass"
        ? { label: "예상 2~3순위", order: 2, tri: "unknown", detail: "부모님 소득까지 100% 이하면 2순위, 본인만 해당하면 3순위예요." }
        : { label: "순위 확인 필요", order: 4, tri: "unknown", ask: [...(t3.ask ?? []), ...(t3a.ask ?? [])] };
  const qualifies: Check = {
    key: "tier",
    label: "소득·자산",
    need: "수급자 등 또는 본인 소득 100%·자산 2억 5,100만 원 이하",
    mine: t1.tri === "pass" ? t1.mine : t3.mine,
    tri: t1.tri === "pass" ? "pass" : tier3,
    ask: t1.tri === "pass" ? undefined : [...(t3.ask ?? []), ...(t3a.ask ?? [])],
    hint: t3.hint,
  };
  return {
    checks: [C.age(ctx, ...AGE.youth), C.single(ctx), C.homelessSelf(ctx), qualifies],
    rank,
    notes: [
      jeonse ? "직접 구한 전셋집을 LH가 계약해 다시 빌려줘요. 지원 한도는 지역마다 달라요." : "대학생·취업준비생도 청년 계층으로 신청할 수 있어요.",
      "같은 순위 안의 선정 방식은 공고마다 달라요.",
    ],
  };
}

function newlywedPurchase(ctx: C.Ctx, kind: "I" | "II", jeonse: boolean): TemplateOut {
  const income =
    kind === "I"
      ? C.income(ctx, INCOME.purchaseNewlywedI)
      : jeonse
        ? C.income(ctx, INCOME.jeonseNewlywedII)
        : C.income(ctx, INCOME.purchaseNewlywedII);
  const assetMax = kind === "I" ? ctx.std.assets.rentGeneral : jeonse ? ctx.std.assets.newhome : ctx.std.assets.rentGeneral;
  const { p } = ctx;
  let rank: RankInfo;
  if (p.infant) rank = { label: "예상 1순위", order: 1, tri: "pass", detail: "신생아 가구" };
  else if (p.special?.includes("singleParent")) rank = { label: "예상 1순위", order: 1, tri: "pass", detail: "한부모가족" };
  else if (p.children !== undefined && p.children > 0 && (p.marital === "newlywed" || p.marital === "engaged"))
    rank = { label: "예상 2순위", order: 2, tri: "pass", detail: "자녀가 있는 신혼부부" };
  else if (p.marital === "newlywed" || p.marital === "engaged") rank = { label: "예상 3순위", order: 3, tri: "pass", detail: "자녀가 없는 신혼·예비부부" };
  else rank = { label: "예상 4순위", order: 4, tri: "unknown", detail: "혼인 7년 넘은 유자녀 가구" };
  return {
    checks: [
      {
        ...C.newlywed(ctx, { engagedOk: true }),
        tri: p.marital === "married" && (p.children ?? 0) > 0 ? "pass" : C.newlywed(ctx, { engagedOk: true }).tri,
        need: "신혼·예비부부·한부모 또는 6세 이하 자녀 가구",
      },
      C.homelessHousehold(ctx),
      income,
      C.assets(ctx, assetMax),
      C.car(ctx, ctx.std.assets.car),
    ],
    rank,
    notes: ["신생아·한부모 → 자녀 있는 신혼 → 자녀 없는 신혼 순으로 뽑아요."],
  };
}

function generalPurchase(ctx: C.Ctx): TemplateOut {
  const t1 = C.specialAny(ctx, ["recipient", "nearPoor", "singleParent", "disabled"]);
  const t2 = C.income(ctx, INCOME.generalTier2);
  const who: Check = {
    key: "tier",
    label: "대상 계층",
    need: "수급자·차상위·한부모·장애인 또는 소득 50% 이하",
    mine: t1.tri === "pass" ? t1.mine : t2.mine,
    tri: t1.tri === "pass" || t2.tri === "pass" ? "pass" : t1.tri === "fail" && t2.tri === "fail" ? "fail" : "unknown",
    ask: [...(t1.ask ?? []), ...(t2.ask ?? [])],
  };
  return {
    checks: [who, C.homelessHousehold(ctx), C.assets(ctx, ctx.std.assets.permanent), C.car(ctx, ctx.std.assets.car)],
    rank: t1.tri === "pass" ? { label: "예상 1순위", order: 1, tri: "pass" } : { label: "예상 2순위", order: 2, tri: who.tri },
    notes: ["같은 순위 안의 배점은 공고마다 달라요."],
  };
}

const purchase: Partial<Record<GroupId, Template>> = {
  youth: (ctx) => youthPurchase(ctx, false),
  newlywed: (ctx) => newlywedPurchase(ctx, "I", false),
  general: generalPurchase,
};

const jeonse: Partial<Record<GroupId, Template>> = {
  youth: (ctx) => youthPurchase(ctx, true),
  newlywed: (ctx) => newlywedPurchase(ctx, "II", true),
  general: generalPurchase,
};

const youthSafe: Partial<Record<GroupId, Template>> = {
  youth: (ctx) => ({
    checks: compact([
      C.age(ctx, ...AGE.youth),
      C.single(ctx),
      C.homelessSelf(ctx),
      C.income(ctx, INCOME.youthSafe, "소득(특별공급)"),
      C.assets(ctx, ctx.std.assets.happyYouth, "본인 자산"),
      C.car(ctx, ctx.std.assets.car),
      C.applyRegion(ctx),
    ]),
    rank: { label: "추첨", order: 5, tri: "pass" },
    notes: ["소득 기준을 넘으면 일반공급(추첨)으로만 신청할 수 있어요.", "공공임대분(SH) 순위는 공고마다 달라요."],
  }),
  newlywed: (ctx) => ({
    checks: [
      C.newlywed(ctx, { engagedOk: true }),
      C.homelessHousehold(ctx),
      C.income(ctx, INCOME.youthSafe, "소득(특별공급)"),
      ...RENT_ASSETS(ctx),
    ],
    rank: { label: "추첨", order: 5, tri: "pass" },
    notes: ["소득 기준을 넘으면 일반공급(추첨)으로만 신청할 수 있어요."],
  }),
};

const deundeun: Partial<Record<GroupId, Template>> = {
  general: (ctx) => ({
    checks: [C.homelessHousehold(ctx)],
    rank: { label: "추첨", order: 5, tri: "pass" },
    notes: ["소득·자산 기준이 없고, 신청자 중 무작위 추첨으로 뽑아요.", "차수마다 우선공급 조건이 바뀔 수 있어요."],
  }),
};

/* ── 공공분양 ── */

function publicReq(ctx: C.Ctx) {
  const reg = C.isRegulated(ctx.a);
  const m = reg ? 24 : C.isCapital(ctx.a) ? 12 : 6;
  return compact([C.accountPeriod(ctx, m), C.payments(ctx, m), reg && C.head(ctx), reg && C.notWon(ctx)]);
}

const publicSale: Partial<Record<GroupId, Template>> = {
  gen1: (ctx) => {
    const small = Math.min(...ctx.a.units.map((u) => u.area)) <= 60;
    const req = publicReq(ctx);
    const checks = compact([
      C.homelessHousehold(ctx),
      C.hasAccount(ctx),
      small && C.income(ctx, INCOME.publicGen),
      small && C.property(ctx, ctx.std.assets.publicSaleSmall),
      small && C.car(ctx, ctx.std.assets.car),
    ]);
    const area40 = Math.min(...ctx.a.units.map((u) => u.area)) > 40;
    return {
      checks,
      rankChecks: req,
      rank: saleRank(ctx, req, "국민주택 1순위: 가입 기간과 납입 횟수를 함께 봐요."),
      notes: [
        "일반공급의 50%는 2세 미만 자녀 가구에 먼저, 30%는 순차, 나머지는 추첨이에요.",
        area40 ? "전용 40㎡ 초과는 저축 총액(월 25만 원까지 인정) 많은 순이에요." : "전용 40㎡ 이하는 납입 횟수 많은 순이에요.",
      ],
    };
  },
  spNewlywed: (ctx) => ({
    checks: [
      C.newlywed(ctx, { engagedOk: true }),
      C.homelessHousehold(ctx),
      C.income(ctx, INCOME.publicNewlywed),
      C.property(ctx, ctx.std.assets.publicSaleSmall),
      C.car(ctx, ctx.std.assets.car),
      C.accountPeriod(ctx, 6),
      C.payments(ctx, 6),
    ],
    score: publicNewlywedScore(ctx),
    rank: { label: "순위·배점", order: 3, tri: "pass" },
    notes: ["70%는 소득 100%(맞벌이 120%) 이하에서 순위·배점으로, 20%는 130% 이하에서, 나머지는 추첨이에요."],
  }),
  spFirst: (ctx) => ({
    checks: [
      C.neverOwned(ctx),
      C.homelessHousehold(ctx),
      C.marriedOrChild(ctx),
      C.income(ctx, INCOME.publicFirst),
      C.property(ctx, ctx.std.assets.publicSaleSmall),
      C.car(ctx, ctx.std.assets.car),
      ...publicReq(ctx),
      { ...C.hasAccount(ctx), key: "saving600", label: "저축액", need: "600만 원 이상", mine: C.hasAccount(ctx).mine, tri: bandAtLeast(ctx.p.deposit, 600), ask: bandAtLeast(ctx.p.deposit, 600) === "unknown" ? ["deposit"] : undefined },
      C.taxFive(ctx),
    ],
    rank: { label: "추첨", order: 5, tri: "pass" },
    notes: ["모두 추첨이에요. 70%는 소득 100% 이하, 20%는 130% 이하에서 먼저 뽑아요."],
  }),
  spMultiChild: (ctx) => ({
    checks: [
      C.children(ctx, 2),
      C.homelessHousehold(ctx),
      C.income(ctx, INCOME.publicMultiChild),
      C.property(ctx, ctx.std.assets.publicSaleSmall),
      C.car(ctx, ctx.std.assets.car),
      C.accountPeriod(ctx, 6),
      C.payments(ctx, 6),
    ],
    score: multiChildScore(ctx),
    rank: { label: "배점", order: 3, tri: "pass" },
    notes: ["90%는 소득 120% 이하에서 배점 순, 나머지는 추첨이에요."],
  }),
  spParents: (ctx) => ({
    checks: [
      C.parents(ctx),
      C.head(ctx),
      C.homelessHousehold(ctx),
      C.income(ctx, INCOME.publicParents),
      C.property(ctx, ctx.std.assets.publicSaleSmall),
      C.car(ctx, ctx.std.assets.car),
      ...publicReq(ctx),
    ],
    rank: { label: "순차", order: 3, tri: "pass" },
    notes: ["90%는 소득 120% 이하에서 순차(저축 총액·납입 횟수)로, 나머지는 추첨이에요."],
  }),
  spNewborn: (ctx) => ({
    checks: [
      C.infant(ctx),
      C.homelessHousehold(ctx),
      C.income(ctx, INCOME.publicNewborn),
      C.property(ctx, ctx.std.assets.publicSaleSmall),
      C.car(ctx, ctx.std.assets.car),
      C.accountPeriod(ctx, 6),
      C.payments(ctx, 6),
    ],
    score: publicNewlywedScore(ctx),
    rank: { label: "배점·추첨", order: 3, tri: "pass" },
    notes: ["70%는 소득 100%(맞벌이 120%) 이하, 20%는 140% 이하에서 뽑고 나머지는 추첨이에요."],
  }),
};

/* ── 민영 아파트 ── */

function privateReq(ctx: C.Ctx): Check[] {
  const reg = C.isRegulated(ctx.a);
  const months = reg ? 24 : C.isCapital(ctx.a) ? 12 : 6;
  const area = Math.min(...ctx.a.units.map((u) => u.area));
  const homeTri: Tri = ctx.p.home === undefined ? "unknown" : ctx.p.home === "none" ? "pass" : "unknown";
  return compact([
    C.accountPeriod(ctx, months),
    C.deposit(ctx, area),
    reg && C.head(ctx),
    reg && C.notWon(ctx),
    reg && {
      key: "twoHomes",
      label: "주택 수",
      need: "2주택 이상 세대 아님",
      mine: ctx.p.home === undefined ? "아직 입력 안 함" : ctx.p.home === "none" ? "무주택" : "주택 있음(몇 채인지 모름)",
      tri: homeTri,
      ask: homeTri === "unknown" && ctx.p.home === undefined ? (["home"] as ProfileKey[]) : undefined,
    },
  ]);
}

/** 1순위 경쟁 시 가점제 비율 [S1 제28조] */
export function gajeomRatio(a: { regulation?: { speculative: boolean; adjusted: boolean } }, area: number): string {
  const sp = a.regulation?.speculative;
  const adj = a.regulation?.adjusted;
  if (sp) return area <= 60 ? "가점 40% · 추첨 60%" : area <= 85 ? "가점 70% · 추첨 30%" : "가점 80% · 추첨 20%";
  if (adj) return area <= 60 ? "가점 40% · 추첨 60%" : area <= 85 ? "가점 70% · 추첨 30%" : "가점 50% · 추첨 50%";
  return area <= 85 ? "가점 40% 이하(시·군·구 공고) · 나머지 추첨" : "추첨 100%";
}

function specialIncomeOrProperty(ctx: C.Ctx, rule: IncomeRule): Check {
  const inc = C.income(ctx, rule);
  if (inc.tri === "pass") return inc;
  // 소득을 넘어도 부동산(건보 재산 29등급 평균, 3억 3,100만 원) 이하면 추첨분에 넣을 수 있다.
  // 부동산 ≤ 총자산이라 총자산이 기준 이하면 확실히 통과, 넘으면 모른다(fail로 치지 않는다).
  if (inc.tri !== "fail") return inc;
  const prop = bandAtMost(ctx.p.assets, ctx.std.assets.special29);
  if (prop === "pass")
    return { ...inc, tri: "pass", hint: "소득은 넘지만 부동산이 3억 3,100만 원 이하라 추첨분에 넣을 수 있어요." };
  return {
    ...inc,
    tri: "unknown",
    ask: ctx.p.assets ? undefined : ["assets"],
    hint: "소득을 넘어도 부동산이 3억 3,100만 원 이하면 추첨분에 넣을 수 있어요.",
  };
}

const privateApt: Partial<Record<GroupId, Template>> = {
  gen1: (ctx) => {
    const area = Math.min(...ctx.a.units.map((u) => u.area));
    const req = privateReq(ctx);
    return {
      checks: [C.hasAccount(ctx)],
      rankChecks: req,
      rank: saleRank(ctx, req, `1순위 조건: 가입 기간·예치금${C.isRegulated(ctx.a) ? "·세대주·5년 내 당첨 없음" : ""}`),
      score: gajeomScore(ctx),
      notes: [
        `이 단지(전용 ${area}㎡~) 1순위 경쟁 시 ${gajeomRatio(ctx.a, area)}.`,
        "가점이 같으면 가입 기간이 긴 순, 그다음 추첨이에요.",
      ],
    };
  },
  spNewlywed: (ctx) => {
    const kids = ctx.p.children;
    return {
      checks: [
        C.newlywed(ctx, { engagedOk: false }),
        C.homelessHousehold(ctx),
        specialIncomeOrProperty(ctx, INCOME.privateNewlywed),
        C.accountPeriod(ctx, 6),
        C.deposit(ctx, Math.min(...ctx.a.units.map((u) => u.area))),
      ],
      rank:
        kids === undefined
          ? { label: "순위 확인 필요", order: 4, tri: "unknown", ask: ["children"] }
          : kids > 0
            ? { label: "1순위", order: 1, tri: "pass", detail: "혼인 중 자녀 있음" }
            : { label: "2순위", order: 2, tri: "pass", detail: "자녀 없음" },
      notes: ["50%는 소득 100%(맞벌이 120%) 이하, 20%는 140%(160%) 이하에서 순위대로, 30%는 추첨이에요."],
    };
  },
  spFirst: (ctx) => ({
    checks: [
      C.neverOwned(ctx),
      C.homelessHousehold(ctx),
      C.marriedOrChild(ctx),
      specialIncomeOrProperty(ctx, INCOME.privateFirst),
      ...privateReq(ctx),
      C.taxFive(ctx),
    ],
    rank: { label: "추첨", order: 5, tri: "pass" },
    notes: ["모두 추첨이에요. 50%는 소득 130% 이하, 20%는 160% 이하에서 먼저 뽑아요.", "1인 가구는 전용 60㎡ 이하 추첨분만 신청할 수 있어요."],
  }),
  spMultiChild: (ctx) => ({
    checks: [C.children(ctx, 2), C.homelessHousehold(ctx), C.accountPeriod(ctx, 6), C.deposit(ctx, Math.min(...ctx.a.units.map((u) => u.area)))],
    score: multiChildScore(ctx),
    rank: { label: "배점", order: 3, tri: "pass" },
    notes: ["소득 기준 없이 100점 배점표로 뽑아요. 수도권은 해당 시·도 거주자에게 50%를 먼저 줘요."],
  }),
  spParents: (ctx) => ({
    checks: [C.parents(ctx), C.head(ctx), C.homelessHousehold(ctx), ...privateReq(ctx)],
    score: gajeomScore(ctx),
    rank: { label: "가점", order: 3, tri: "pass" },
    notes: ["일반공급과 같은 가점제로 뽑아요."],
  }),
  spNewborn: (ctx) => ({
    checks: [C.infant(ctx), C.homelessHousehold(ctx), specialIncomeOrProperty(ctx, INCOME.privateNewborn), ...privateReq(ctx)],
    rank: { label: "추첨", order: 5, tri: "pass" },
    notes: ["2026년 6월 새로 생긴 특별공급이에요. 혼인 여부와 상관없어요.", "50%는 소득 130% 이하, 20%는 160% 이하에서 먼저 추첨해요."],
  }),
};

export const TEMPLATES: Record<ProgramId, Partial<Record<GroupId, Template>>> = {
  happy,
  national,
  permanent,
  integrated,
  purchase,
  jeonse,
  youthSafe,
  deundeun,
  publicSale,
  privateApt,
};

/** 템플릿 수(랜딩 표시용) */
export const TEMPLATE_COUNT = Object.values(TEMPLATES).reduce((s, g) => s + Object.keys(g).length, 0);
