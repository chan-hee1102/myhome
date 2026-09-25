import type { GroupId, ProfileKey, ProgramId } from "@/lib/domain";
import { CAPITAL_AREA } from "@/lib/domain";
import { withJosa } from "@/lib/josa";
import { isCityLevel, isWideArea, localAreaName, placeText } from "@/lib/place";
import { all, bandAtLeast, bandAtMost, bandText, manwon, type Check, type Tri } from "./core";
import * as C from "./checks";
import type { IncomeRule } from "./checks";
import { AGE, INCOME, type PoolKey } from "./criteria";
import { gajeomLinesFromProfile } from "./gajeom";
import { poolLine } from "./ruler";
import { depositFor, income100 } from "./standards";

/**
 * 주택 유형 × 공급 대상별 판정 템플릿.
 * 기본값은 법령·지침(2026-09 조사, docs/DESIGN.md 4장)이고, 공고문에서 읽은 값(GroupParams)이 있으면 그걸 쓴다.
 *
 * 템플릿이 돌려주는 것
 *   checks  자격 조건(전부 pass여야 「신청 가능」)
 *   rank    예상 순위(자격과 별개 — 자격은 되는데 2순위일 수 있다)
 *   score   배점·가점(동순위 경쟁 시 쓰는 점수)
 *   notes   선정 방식 한 줄 설명
 *
 * 화면에 그대로 나가는 글(need·mine·hint·detail·notes·label)은 쉬운 존댓말 「~해요」로 쓰고,
 * 법조문 번호(「별표 2」 등)는 주석에만 남긴다.
 */

export interface RankInfo {
  /** 예) "예상 1순위", "1순위 · 해당지역", "2순위", "추첨" */
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
  /** partial일 때 점수 아래 한 줄 */
  partialNote?: string;
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

/** 「맞닿은 구」·「맞닿은 시·군」 — 공고 시·군·구 이름 끝 글자로 고른다 */
function neighborUnit(a: C.Ctx["a"]): string {
  const last = a.sigungu.slice(-1);
  if (last === "구") return "구";
  return isCityLevel(a.sido) ? "구·군" : "시·군";
}

/**
 * 거주지 기반 순위(행복주택·국민임대 50㎡ 미만): 1 해당·맞닿은 시·군·구 → 2 같은 시·도(수도권은 수도권 전체) → 3 그 밖.
 * work: 청년 계층은 직장 소재지도 1순위로 인정한다.
 */
function residenceRank(ctx: C.Ctx, opts: { work?: boolean } = {}): RankInfo {
  const { p, a } = ctx;
  if (!p.sido) return { label: "순위 확인 필요", order: 4, tri: "unknown", ask: ["sido"] };
  const near = `${withJosa(a.sigungu, "이나/나")} 맞닿은 ${neighborUnit(a)}`;
  const workLine = opts.work ? ` 직장이 ${near}에 있으면 1순위예요.` : "";
  if (p.sido === a.sido && !isWideArea(a)) {
    if (p.sigungu && p.sigungu === a.sigungu)
      return { label: "예상 1순위", order: 1, tri: "pass", detail: `${a.sigungu}에 살아서 1순위예요.` };
    if (p.sigungu)
      return {
        label: "예상 1~2순위",
        order: 2,
        tri: "unknown",
        detail: `${near}에 ${opts.work ? "살거나 직장이 있으면" : "살면"} 1순위, 아니면 2순위예요.`,
      };
    return {
      label: "예상 1~2순위",
      order: 2,
      tri: "unknown",
      detail: "시·군·구까지 알려주시면 순위가 정해져요.",
      ask: ["sigungu"],
    };
  }
  if (p.sido === a.sido) return { label: "예상 1순위", order: 1, tri: "pass", detail: `${a.sido}에 살아서 1순위예요.` };
  if (CAPITAL_AREA.includes(p.sido) && CAPITAL_AREA.includes(a.sido))
    return { label: "예상 2순위", order: 2, tri: "pass", detail: `같은 수도권에 살아서 2순위예요.${workLine}` };
  return { label: "예상 3순위", order: 3, tri: "pass", detail: `공고 지역 밖에 살아서 3순위예요.${workLine}` };
}

const AMOUNT_KEYS = new Set(["accountPeriod", "deposit", "payments"]);

/**
 * 분양 1순위: 요건 전부 pass면 1순위, 하나라도 fail이면 2순위, 모르면 확인 필요.
 * 1순위면 「해당지역」(특별·광역시는 그 시, 도는 시·군 거주)인지 「기타지역」인지도 붙인다.
 */
function saleRank(ctx: C.Ctx, reqs: Check[], detail: string): RankInfo {
  const tri = all(reqs.map((c) => c.tri));
  const asks = reqs.flatMap((c) => (c.tri === "unknown" ? (c.ask ?? []) : []));
  if (tri === "pass") {
    const local = C.sameLocal(ctx);
    const area = localAreaName(ctx.a);
    if (local === "pass") {
      const stay = ctx.a.regulation?.speculative
        ? ` 투기과열지구라 ${area}에 공고가 정한 기간 이상 살아야 해당지역으로 먼저 뽑혀요.`
        : "";
      return { label: "1순위 · 해당지역", order: 1, tri, detail: `${area}에 살아서 해당지역이에요.${stay}` };
    }
    if (local === "fail")
      return {
        label: "1순위 · 기타지역",
        order: 2,
        tri,
        // 대규모 택지 등은 지역별로 물량을 나누기도 해 「모자랄 때만」으로 단정하지 않는다
        detail: `해당지역(${area}) 거주자를 먼저 뽑아요. 공고문에서 지역별 배정 비율을 확인하세요.`,
      };
    return {
      label: "1순위",
      order: 1,
      tri,
      detail: `${detail} ${ctx.p.sido ? "시·군까지 알려주시면 해당지역인지 알 수 있어요." : ""}`.trim(),
      ask: ctx.p.sido ? ["sigungu"] : ["sido"],
    };
  }
  if (tri === "fail") {
    const fails = reqs.filter((c) => c.tri === "fail");
    const amountOnly = fails.every((c) => AMOUNT_KEYS.has(c.key));
    const names = fails.map((c) => c.label).join("·");
    const why = amountOnly ? `${withJosa(names, "이/가")} 모자라요.` : `${names} 조건이 맞지 않아요.`;
    const extra = fails.find((c) => c.key === "deposit")?.hint;
    return {
      label: "2순위",
      order: 3,
      tri: "pass",
      detail: `1순위 조건 중 ${why}${extra ? ` ${extra}` : ""}`,
    };
  }
  // 물을 칸이 있는 조건만 「알려주시면」, 질문으로 풀 수 없는 조건(주택 수 등)은 그 조건의 안내를 그대로
  const unk = reqs.filter((c) => c.tri === "unknown");
  const askable = [...new Set(unk.filter((c) => c.ask?.length).map((c) => c.label))];
  const others = [...new Set(unk.filter((c) => !c.ask?.length && c.hint).map((c) => c.hint!))];
  const lines = [askable.length ? `${askable.join("·")} 정보를 알려주시면 1순위인지 알 수 있어요.` : "", ...others].filter(Boolean);
  return {
    label: "1순위 확인 필요",
    order: 2,
    tri: "unknown",
    detail: lines.length ? lines.join(" ") : detail,
    ask: [...new Set(asks)],
  };
}

/* ───────────────────────── 배점 ───────────────────────── */

function tierPoints(v: number | undefined, tiers: [number, number][]): number | null {
  if (v === undefined) return null;
  for (const [min, pts] of tiers) if (v >= min) return pts;
  return 0;
}

const PARTIAL_NOTE = "아직 모르는 항목은 0점으로 셌어요. 알려주시면 점수가 오를 수 있어요.";

function sumScore(title: string, lines: ScoreLine[]): ScoreInfo {
  const partial = lines.some((l) => l.points === null);
  return {
    title,
    lines,
    total: lines.reduce((s, l) => s + (l.points ?? 0), 0),
    max: lines.reduce((s, l) => s + l.max, 0),
    partial,
    partialNote: partial ? PARTIAL_NOTE : undefined,
  };
}

const bandMin = (b?: { min: number }) => b?.min;

/**
 * 해당 지역 거주 기간 점수. 해당 지역 판정은 sameLocal(특별·광역시는 시, 도는 시·군).
 * 거주 기간은 「지금 사는 시·도에 산 기간」으로만 받으므로, 도 지역에서는 시·군 거주 기간보다 길게 잡힐 수 있다.
 */
function localResidencePoints(
  ctx: C.Ctx,
  tiers: [number, number][],
): { points: number | null; suffix: string; label: string } {
  const area = localAreaName(ctx.a);
  const label = `해당 지역(${area}) 거주`;
  const t = C.sameLocal(ctx);
  if (t === "fail") return { points: 0, suffix: ` · ${area} 밖에 살아서 0점`, label };
  if (t === "unknown") return { points: null, suffix: ctx.p.sido ? " · 시·군을 알려주세요" : "", label };
  const cityLevel = isCityLevel(ctx.a.sido) || isWideArea(ctx.a);
  return { points: tierPoints(ctx.p.residenceYears, tiers), suffix: cityLevel ? "" : ` · ${ctx.a.sido}에 산 기간으로 셌어요`, label };
}

/** 민영 가점 84점 — 결과 화면과 가점 계산기가 같은 규칙(gajeom.ts)을 쓴다 */
function gajeomScore(ctx: C.Ctx): ScoreInfo {
  return sumScore("청약 가점", gajeomLinesFromProfile(ctx.p, ctx.d));
}

/** 국민임대 동순위 배점(항목별 최대 3점) [S9] */
function nationalScore(ctx: C.Ctx): ScoreInfo {
  const { p, d } = ctx;
  const ageLo = d.age?.[0];
  const res = localResidencePoints(ctx, [[5, 3], [3, 2], [1, 1]]);
  return sumScore("동순위 배점", [
    { label: "나이", points: tierPoints(ageLo, [[50, 3], [40, 2], [30, 1]]), max: 3, note: "50세 이상 3 · 40대 2 · 30대 1" },
    { label: "부양가족", points: tierPoints(d.dependents, [[3, 3], [2, 2], [1, 1]]), max: 3, note: "3명 이상 3 · 2명 2 · 1명 1" },
    { label: res.label, points: res.points, max: 3, note: `5년 이상 3 · 3~5년 2 · 1~3년 1${res.suffix}` },
    {
      label: "65세 이상 부모 부양",
      points: p.livesWithParents === undefined ? null : p.livesWithParents ? 3 : 0,
      max: 3,
      note: "1년 넘게 모시면 3",
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
    const pct = ((p.income.max ?? Infinity) / base) * 100;
    incomePts = pct <= 50 ? 3 : pct <= 70 ? 2 : pct <= 100 ? 1 : (p.income.min / base) * 100 > 100 ? 0 : null;
  }
  const soloHead = d.householdSize === 1;
  const res = localResidencePoints(ctx, [[5, 3], [3, 2], [1, 1]]);
  return sumScore("우선공급 배점", [
    { label: "소득(중위소득 대비)", points: incomePts, max: 3, note: "50% 이하 3 · 70% 이하 2 · 100% 이하 1" },
    {
      label: "부양가족",
      points: soloHead ? 0 : tierPoints(d.dependents, [[3, 3], [2, 2], [1, 1]]),
      max: 3,
      note: soloHead ? "혼자 사는 세대주는 해당 없어요" : "3명 이상 3 · 2명 2 · 1명 1",
    },
    { label: res.label, points: res.points, max: 3, note: `5년 이상 3 · 3~5년 2 · 1~3년 1${res.suffix}` },
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
  const { p, a, d } = ctx;
  const yc = d.youngChildren;
  const capitalMove = !!p.sido && p.sido !== a.sido && CAPITAL_AREA.includes(p.sido) && CAPITAL_AREA.includes(a.sido);
  return sumScore("다자녀 배점", [
    { label: "미성년 자녀", points: tierPoints(p.children, [[4, 40], [3, 35], [2, 25]]), max: 40, note: "4명 이상 40 · 3명 35 · 2명 25" },
    {
      // 배점표는 「만 6세 미만」, 입력은 「만 6세 이하」 — 만 6세 자녀가 있으면 실제 점수가 낮을 수 있다
      label: "영유아 자녀",
      points: tierPoints(yc, [[3, 15], [2, 10], [1, 5]]),
      max: 15,
      note:
        yc === undefined
          ? "만 6세 미만 3명 이상 15 · 2명 10 · 1명 5 · 만 6세 이하 자녀 수를 알려주시면 셀 수 있어요"
          : `만 6세 미만 3명 이상 15 · 2명 10 · 1명 5${yc > 0 ? " · 만 6세 이하로 답하신 수로 셌어요(만 6세 자녀는 빠질 수 있어요)" : ""}`,
    },
    {
      label: "세대 구성",
      points: p.livesWithParents === undefined ? null : p.livesWithParents ? 5 : p.special?.includes("singleParent") ? 5 : 0,
      max: 5,
      note: "3세대 이상 또는 한부모 5",
    },
    { label: "무주택 기간", points: tierPoints(p.homelessYears, [[10, 20], [5, 15], [1, 10]]), max: 20, note: "10년 이상 20 · 5~10년 15 · 1~5년 10" },
    {
      label: `해당 시·도(${a.sido}) 거주`,
      // 수도권 안에서 다른 시·도에 살면 단정하지 않는다 — 수도권 대규모 택지 등은 서울·인천·경기 거주를 함께 치는 공고가 있다
      points: p.sido && p.sido !== a.sido ? (capitalMove ? null : 0) : tierPoints(p.residenceYears, [[10, 15], [5, 10], [1, 5]]),
      max: 15,
      note:
        p.sido && p.sido !== a.sido
          ? capitalMove
            ? `10년 이상 15 · 5~10년 10 · 1~5년 5 · ${p.sido} 거주도 치는지는 공고마다 달라요(대규모 택지 등). 공고문을 확인하세요`
            : `10년 이상 15 · 5~10년 10 · 1~5년 5 · ${a.sido} 밖에 살아서 0점`
          : `10년 이상 15 · 5~10년 10 · 1~5년 5 · ${a.sido}에 산 기간만 쳐요`,
    },
    {
      label: "통장 가입 10년 이상",
      points: p.hasAccount === false ? 0 : tierPoints(bandMin(p.accountMonths), [[120, 5]]),
      max: 5,
      note: "10년 이상 5",
    },
  ]);
}

/** 공공분양 신혼 특공 배점 「혼인 기간」: 3년 이하 3 · 5년 이하 2 · 7년 이하 1 */
function marriagePoints(ctx: C.Ctx): { points: number | null; note: string } {
  const { d, p } = ctx;
  const base = "3년 이하 3 · 5년 이하 2 · 7년 이하 1";
  if (d.marriedYears) {
    // 신고한 해만 알아서 날짜에 따라 1년 차이가 난다 — 긴 쪽(점수가 낮은 쪽)으로 센다
    const y = d.marriedYears[1];
    const points = y <= 2 ? 3 : y <= 4 ? 2 : y <= 6 ? 1 : 0;
    return { points, note: `${base} · ${p.marriedYear}년 혼인신고(약 ${y}년)` };
  }
  if (d.married) return { points: null, note: `${base} · 혼인신고 연도를 알려주시면 셀 수 있어요` };
  if (d.engaged) return { points: null, note: `${base} · 예비부부는 공고문 기준을 따라요` };
  return { points: null, note: base };
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
  const res = localResidencePoints(ctx, [[3, 3], [1, 2], [0, 1]]);
  const mp = marriagePoints(ctx);
  return sumScore("특별공급 배점", [
    { label: "소득", points: incomePts, max: 1, note: "80% 이하(맞벌이 100%) 1" },
    { label: "자녀 수", points: tierPoints(p.children, [[3, 3], [2, 2], [1, 1]]), max: 3, note: "3명 이상 3 · 2명 2 · 1명 1" },
    { label: res.label, points: res.points, max: 3, note: `3년 이상 3 · 1~3년 2 · 1년 미만 1${res.suffix}` },
    {
      label: "통장 납입",
      points: p.hasAccount === false ? 0 : tierPoints(bandMin(p.payments), [[24, 3], [12, 2], [6, 1]]),
      max: 3,
      note: "24회 3 · 12회 2 · 6회 1",
    },
    { label: "혼인 기간", points: mp.points, max: 3, note: mp.note },
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
    rank: residenceRank(ctx, { work: true }),
    notes: [
      "같은 순위 안에서는 추첨으로 뽑아요.",
      "사는 곳 말고 직장이 있는 곳으로도 1순위를 받을 수 있어요.",
      "일한 지 5년 이내인 사회초년생·예술인도 청년 계층으로 신청할 수 있어요.",
    ],
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
    notes: ["사는 곳이나 학교가 있는 곳으로 순위를 매기고, 같은 순위는 추첨해요."],
  }),
  newlywed: (ctx) => ({
    checks: [
      // 가이드(행복주택 표 1): 「혼인 7년 이내·예비부부 또는 6세 이하 자녀」
      C.newlywed(ctx, { engagedOk: true, singleParentOk: true, youngChildOk: true }),
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
      if (ctx.p.hasAccount === false) rank = { label: "예상 3순위", order: 3, tri: "pass", detail: "50㎡ 이상은 통장 납입 횟수로 순위를 정해요. 통장이 없으면 3순위예요." };
      else if (t === "pass") rank = { label: "예상 1순위", order: 1, tri: "pass", detail: "통장에 24회 넘게 넣어서 1순위예요." };
      else if (t6 === "pass")
        rank = {
          label: t === "unknown" ? "예상 1~2순위" : "예상 2순위",
          order: 2,
          tri: t === "unknown" ? "unknown" : "pass",
          detail: t === "unknown" ? "통장 납입이 24회 넘으면 1순위, 아니면 2순위예요." : "통장 납입이 6회 이상이라 2순위예요.",
        };
      else if (t6 === "fail") rank = { label: "예상 3순위", order: 3, tri: "pass", detail: "통장 납입이 6회보다 적어서 3순위예요." };
      else rank = { label: "순위 확인 필요", order: 4, tri: "unknown", detail: "50㎡ 이상은 통장 납입 횟수로 순위를 정해요.", ask: ["hasAccount", "payments"] };
    }
    return {
      checks: [C.homelessHousehold(ctx), C.income(ctx, rule), ...RENT_ASSETS(ctx)],
      rank,
      score: nationalScore(ctx),
      notes: [
        "전용 50㎡ 미만은 사는 곳, 50㎡ 이상은 통장 납입 횟수로 순위를 매겨요.",
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
    const who = C.tierCheck(tier1, tier2, "수급자·한부모·장애인·유공자 등 또는 소득 50% 이하");
    // 영구임대는 주민등록지 주민센터에서 신청해 지자체가 순위를 매긴다 — 공고 지역 밖이면 신청 자격 지역을 확인해야 한다.
    // 법령 기본값으로 단정할 수 없어 fail이 아니라 unknown으로 둔다.
    const local = C.sameLocal(ctx);
    const where: Check = {
      key: "region",
      label: "사는 곳",
      need: `${localAreaName(ctx.a)}에 주민등록`,
      mine: ctx.p.sido ? placeText({ sido: ctx.p.sido, sigungu: ctx.p.sigungu }) : "아직 입력 안 함",
      tri: local === "pass" ? "pass" : "unknown",
      ask: local === "unknown" ? (ctx.p.sido ? ["sigungu"] : ["sido"]) : undefined,
      hint:
        local === "fail"
          ? `영구임대는 보통 공고 지역(${localAreaName(ctx.a)}) 주민이 주민센터에서 신청해요. 공고문의 신청 자격 지역을 확인하세요.`
          : undefined,
    };
    let rank: RankInfo;
    if (tier1.tri === "pass") rank = { label: "예상 1순위", order: 1, tri: "pass", detail: "수급자·한부모 등 1순위 계층이에요." };
    else if (tier2.tri === "pass")
      rank =
        tier1.tri === "unknown"
          ? { label: "예상 1~2순위", order: 2, tri: "unknown", detail: "수급자·한부모 등에 해당하면 1순위, 아니면 소득 기준으로 2순위예요.", ask: ["special"] }
          : { label: "예상 2순위", order: 2, tri: "pass", detail: "소득이 기준 안쪽이라 2순위예요." };
    else rank = { label: "순위 확인 필요", order: 4, tri: "unknown" };
    return {
      checks: [who, where, C.homelessHousehold(ctx), C.assets(ctx, ctx.std.assets.permanent), C.car(ctx, ctx.std.assets.car)],
      rank,
      notes: ["주민등록지 행정복지센터(주민센터)에서 신청하면 지자체가 순위를 정해요. 세부 배점은 공고마다 달라요."],
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
      ? { label: "예상 1순위", order: 1, tri: "pass", detail: "수급자·차상위·한부모라 1순위예요." }
      : tier3 === "pass"
        ? { label: "예상 2~3순위", order: 2, tri: "unknown", detail: "부모님 소득까지 합쳐 기준 안쪽이면 2순위, 본인만 기준 안쪽이면 3순위예요." }
        : { label: "순위 확인 필요", order: 4, tri: "unknown", ask: [...(t3.ask ?? []), ...(t3a.ask ?? [])] };
  const qualifies: Check = {
    key: "tier",
    label: "소득·자산",
    need: `수급자 등 또는 본인 소득 100%·자산 ${manwon(ctx.std.assets.happyYouth)} 이하`,
    mine: t1.tri === "pass" ? t1.mine : t3.mine,
    tri: t1.tri === "pass" ? "pass" : tier3,
    ask: t1.tri === "pass" ? undefined : [...(t3.ask ?? []), ...(t3a.ask ?? [])],
    hint:
      t1.tri === "pass" || tier3 !== "unknown"
        ? undefined
        : t3.tri === "unknown"
          ? (t3.hint ?? "소득을 알려주시면 가려져요.")
          : (t3a.hint ?? "총자산을 알려주시면 가려져요."),
  };
  return {
    checks: [C.age(ctx, ...AGE.youth), C.single(ctx), C.homelessSelf(ctx), qualifies],
    rank,
    notes: [
      jeonse ? "직접 구한 전셋집을 LH가 계약해 다시 빌려줘요. 지원 한도는 지역마다 달라요." : "대학생·취업준비생도 청년 계층으로 신청할 수 있어요.",
      "같은 순위 안에서 뽑는 방식은 공고마다 달라요.",
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
  const { p, d } = ctx;
  const kids = p.children ?? 0;
  const within = d.within7 === true || !!d.engaged;
  // 신혼(7년 이내)·예비부부·6세 이하 자녀를 둔 한부모 또는 부부
  const nw = C.newlywed(ctx, { engagedOk: true, singleParentOk: true, youngChildOk: true });
  let who: Check = { ...nw, need: "신혼(7년 이내)·예비부부·한부모 또는 6세 이하 자녀를 둔 가구" };
  // 2세 미만 아기가 있는(임신 포함) 혼인 가구는 신생아 가구로 받는다
  if (nw.tri !== "pass" && d.married && kids > 0 && d.infant)
    who = { ...who, tri: "pass", hint: undefined, ask: undefined, mine: `${who.mine} · 2세 미만 아기 있음` };
  let rank: RankInfo;
  if (d.infant) rank = { label: "예상 1순위", order: 1, tri: "pass", detail: "2세 미만 아기가 있는 가구라 1순위예요." };
  else if (p.special?.includes("singleParent") && who.tri === "pass")
    rank = { label: "예상 1순위", order: 1, tri: "pass", detail: "한부모가족이라 1순위예요." };
  else if (within && kids > 0) rank = { label: "예상 2순위", order: 2, tri: "pass", detail: "자녀가 있는 신혼부부라 2순위예요." };
  else if (within) rank = { label: "예상 3순위", order: 3, tri: "pass", detail: "자녀가 없는 신혼·예비부부는 3순위예요." };
  else if (d.married && d.within7 === undefined)
    // 혼인신고 연도가 딱 7년 전 — 날짜에 따라 신혼 여부가 갈린다
    rank =
      kids > 0
        ? { label: "예상 2순위", order: 2, tri: "unknown", detail: "혼인 7년 이내면 2순위, 넘었으면 6세 이하 자녀가 있을 때 4순위예요." }
        : { label: "예상 3순위", order: 3, tri: "unknown", detail: "혼인 7년 이내면 3순위예요. 혼인신고한 날짜에 따라 갈려요." };
  else if (d.married && kids > 0) {
    const y = C.youngChildTri(d);
    rank =
      y === "pass"
        ? { label: "예상 4순위", order: 4, tri: "pass", detail: "결혼 7년이 넘었고 6세 이하 자녀가 있는 가구는 4순위예요." }
        : y === "unknown"
          ? {
              label: "예상 4순위",
              order: 4,
              tri: "unknown",
              detail: "결혼 7년이 넘었어도 6세 이하 자녀가 있으면 4순위로 신청할 수 있어요.",
              ask: ["youngChildren"],
            }
          : { label: "순위 확인 필요", order: 4, tri: "unknown" };
  } else rank = { label: "순위 확인 필요", order: 4, tri: "unknown" };
  return {
    checks: [who, C.homelessHousehold(ctx), income, C.assets(ctx, assetMax), C.car(ctx, ctx.std.assets.car)],
    rank,
    notes: ["2세 미만 아기·한부모 → 자녀 있는 신혼 → 자녀 없는 신혼 순으로 뽑아요."],
  };
}

function generalPurchase(ctx: C.Ctx): TemplateOut {
  const t1 = C.specialAny(ctx, ["recipient", "nearPoor", "singleParent", "disabled"]);
  const t2 = C.income(ctx, INCOME.generalTier2);
  const who = C.tierCheck(t1, t2, "수급자·차상위·한부모·장애인 또는 소득 50% 이하");
  return {
    checks: [who, C.homelessHousehold(ctx), C.assets(ctx, ctx.std.assets.permanent), C.car(ctx, ctx.std.assets.car)],
    rank:
      t1.tri === "pass"
        ? { label: "예상 1순위", order: 1, tri: "pass", detail: "수급자·차상위 등 1순위 계층이에요." }
        : { label: "예상 2순위", order: 2, tri: who.tri },
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
    notes: ["소득·자산 기준이 없고, 신청자 중에서 무작위 추첨으로 뽑아요.", "차수마다 우선공급 조건이 바뀔 수 있어요."],
  }),
};

/* ── 분양 공통: 신청 가능 지역 ── */

/** 분양 템플릿 앞에 「사는 곳」(해당 시·도·권역) 조건을 붙인다 */
function withSaleRegion(tpls: Partial<Record<GroupId, Template>>): Partial<Record<GroupId, Template>> {
  const out: Partial<Record<GroupId, Template>> = {};
  for (const [id, tpl] of Object.entries(tpls) as [GroupId, Template][]) {
    out[id] = (ctx) => {
      const r = tpl(ctx);
      return { ...r, checks: [C.saleRegion(ctx), ...r.checks] };
    };
  }
  return out;
}

/* ── 공공분양 ── */

function publicReq(ctx: C.Ctx) {
  const reg = C.isRegulated(ctx.a);
  const m = reg ? 24 : C.isCapital(ctx.a) ? 12 : 6;
  return compact([C.accountPeriod(ctx, m), C.payments(ctx, m), reg && C.head(ctx), reg && C.notWon(ctx)]);
}

const publicSale: Partial<Record<GroupId, Template>> = withSaleRegion({
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
      rank: saleRank(ctx, req, "공공분양 1순위는 가입 기간과 납입 횟수를 함께 봐요."),
      notes: [
        "일반공급의 50%는 2세 미만 자녀 가구에 먼저, 30%는 저축액 순, 나머지는 추첨이에요.",
        area40 ? "전용 40㎡ 초과는 저축 총액(한 달 25만 원까지 인정)이 많은 순이에요." : "전용 40㎡ 이하는 납입 횟수가 많은 순이에요.",
      ],
    };
  },
  spNewlywed: (ctx) => ({
    checks: [
      C.newlywed(ctx, { engagedOk: true, singleParentOk: true }),
      C.homelessHousehold(ctx),
      C.income(ctx, INCOME.publicNewlywed),
      C.property(ctx, ctx.std.assets.publicSaleSmall),
      C.car(ctx, ctx.std.assets.car),
      C.accountPeriod(ctx, 6),
      C.payments(ctx, 6),
    ],
    score: publicNewlywedScore(ctx),
    rank: { label: "순위·배점", order: 3, tri: "pass" },
    notes: compact(["70%는 소득 100%(맞벌이 120%) 이하에서 순위·배점으로, 20%는 130% 이하에서, 나머지는 추첨이에요.", pool(ctx, "publicNewlywed")]),
  }),
  spFirst: (ctx) => {
    const { p } = ctx;
    const s600: Tri = p.hasAccount === false ? "fail" : bandAtLeast(p.deposit, 600);
    return {
      checks: [
        C.neverOwned(ctx),
        C.homelessHousehold(ctx),
        C.marriedOrChild(ctx),
        C.income(ctx, INCOME.publicFirst),
        C.property(ctx, ctx.std.assets.publicSaleSmall),
        C.car(ctx, ctx.std.assets.car),
        ...publicReq(ctx),
        {
          key: "saving600",
          label: "저축액",
          need: `${manwon(600)} 이상`,
          mine: p.hasAccount === false ? "통장 없음" : bandText(p.deposit),
          tri: s600,
          ask: s600 === "unknown" ? C.accountAsk(p, "deposit") : undefined,
          hint: s600 === "unknown" && p.deposit ? C.straddleHint("저축액", 600) : undefined,
        },
        C.taxFive(ctx),
      ],
      rank: { label: "추첨", order: 5, tri: "pass" },
      notes: compact(["모두 추첨이에요. 70%는 소득 100% 이하, 20%는 130% 이하에서 먼저 뽑아요.", pool(ctx, "publicFirst")]),
    };
  },
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
    rank: { label: "저축액 순", order: 3, tri: "pass" },
    notes: ["90%는 소득 120% 이하에서 저축 총액·납입 횟수 순으로, 나머지는 추첨이에요."],
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
    notes: compact(["70%는 소득 100%(맞벌이 120%) 이하, 20%는 140% 이하에서 뽑고 나머지는 추첨이에요.", pool(ctx, "publicNewborn")]),
  }),
});

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
      need: "집이 2채 이상인 세대가 아님",
      mine: ctx.p.home === undefined ? "아직 입력 안 함" : ctx.p.home === "none" ? "무주택" : "집 있음(몇 채인지 모름)",
      tri: homeTri,
      ask: homeTri === "unknown" && ctx.p.home === undefined ? (["home"] as ProfileKey[]) : undefined,
      hint:
        homeTri === "unknown" && ctx.p.home !== undefined
          ? "집이 1채면 1순위로 신청할 수 있고, 2채 이상인 세대는 2순위예요."
          : undefined,
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

/** 「59·74㎡」 — 면적 목록(중복 없이 작은 순) */
function areaList(areas: number[]): string {
  return `${[...new Set(areas)].sort((x, y) => x - y).join("·")}㎡`;
}

/**
 * 1순위 경쟁 시 가점·추첨 비율을 주택형 면적 구간별로 — 같은 비율인 주택형끼리 묶는다.
 *   하나면 「이 단지(전용 59~84㎡)는 1순위끼리 경쟁하면 가점 40% · 추첨 60%로 뽑아요.」
 *   여럿이면 「1순위끼리 경쟁하면 주택형마다 뽑는 방식이 달라요 — 59㎡: 가점 40% · 추첨 60% / 84㎡: 가점 70% · 추첨 30%」
 */
export function gajeomRatioNote(a: Pick<C.Ctx["a"], "regulation" | "units">): string {
  const groups = new Map<string, number[]>();
  for (const u of a.units) {
    const r = gajeomRatio(a, u.area);
    groups.set(r, [...(groups.get(r) ?? []), u.area]);
  }
  if (groups.size === 1) {
    const [[ratio, areas]] = [...groups];
    const lo = Math.min(...areas);
    const hi = Math.max(...areas);
    return `이 단지(전용 ${lo === hi ? `${lo}㎡` : `${lo}~${hi}㎡`})는 1순위끼리 경쟁하면 ${withJosa(ratio, "으로/로")} 뽑아요.`;
  }
  const parts = [...groups].map(([ratio, areas]) => `${areaList(areas)}: ${ratio}`);
  return `1순위끼리 경쟁하면 주택형마다 뽑는 방식이 달라요 — ${parts.join(" / ")}`;
}

/**
 * 주택형마다 1순위 예치금이 다르면 한 줄(사는 시·도를 알 때만). 1순위 판정은 가장 작은 주택형 기준이라,
 * 큰 주택형에 넣으려면 더 필요하다는 걸 알려 준다.
 */
function depositByAreaNote(ctx: C.Ctx): string | null {
  const s = ctx.p.sido;
  if (!s) return null;
  const tiers = new Map<number, number[]>();
  for (const u of ctx.a.units) {
    const need = depositFor(s, u.area);
    tiers.set(need, [...(tiers.get(need) ?? []), u.area]);
  }
  if (tiers.size < 2) return null;
  const parts = [...tiers].sort((x, y) => x[0] - y[0]).map(([need, areas]) => `${areaList(areas)} ${manwon(need)}`);
  return `1순위 예치금은 주택형마다 달라요(${s} 거주 기준) — ${parts.join(" · ")}. 넣을 주택형 기준으로 채우세요.`;
}

/** 특별공급 소득 풀 한 줄(소득·가구원 수를 모르면 null) */
function pool(ctx: C.Ctx, key: PoolKey): string | null {
  return poolLine(ctx.p, key, { announced: ctx.a.schedule.announced, d: ctx.d }) ?? null;
}

/**
 * 민영 특공 소득 기준 — 넘어도 부동산(건보 재산 29등급 평균) 이하면 추첨분에 넣을 수 있다.
 * 부동산을 답했으면 그 값으로, 아니면 총자산으로 추정한다(총자산이 넘어도 fail로 치지 않는다).
 */
function specialIncomeOrProperty(ctx: C.Ctx, rule: IncomeRule): Check {
  const inc = C.income(ctx, rule);
  if (inc.tri !== "fail") return inc;
  const limit = ctx.std.assets.special29;
  const prop = C.propertyTri(ctx.p, limit);
  if (prop === "pass")
    return { ...inc, tri: "pass", hint: `소득은 넘지만 부동산이 ${manwon(limit)} 이하라 추첨분에 넣을 수 있어요.` };
  if (prop === "fail") return { ...inc, hint: `소득도 넘고 부동산도 ${manwon(limit)}을 넘어요.` };
  return {
    ...inc,
    tri: "unknown",
    ask: ctx.p.property ? undefined : ["property"],
    hint: `소득을 넘어도 부동산(토지·건물)이 ${manwon(limit)} 이하면 추첨분에 넣을 수 있어요.`,
  };
}

/**
 * 민영 생애최초의 가구 조건 — 혼인 중이거나 자녀가 있어야 하고,
 * 1인 가구(미혼·혼자이면서 자녀 없음)는 전용 60㎡ 이하 추첨분만 신청할 수 있다.
 */
function privateFirstHousehold(ctx: C.Ctx): Check {
  const base = C.marriedOrChild(ctx);
  const need = "혼인 중이거나 자녀가 있음 (1인 가구는 전용 60㎡ 이하만)";
  if (base.tri !== "fail") return { ...base, need };
  const small = ctx.a.units.some((u) => u.area <= 60);
  return small
    ? { ...base, need, tri: "pass", hint: "1인 가구는 전용 60㎡ 이하 주택형의 추첨분에만 신청할 수 있어요." }
    : { ...base, need, hint: "1인 가구는 전용 60㎡ 이하만 신청할 수 있는데, 이 단지에는 60㎡ 이하가 없어요." };
}

const privateApt: Partial<Record<GroupId, Template>> = withSaleRegion({
  gen1: (ctx) => {
    const req = privateReq(ctx);
    return {
      checks: [C.hasAccount(ctx)],
      rankChecks: req,
      rank: saleRank(ctx, req, `1순위 조건: 가입 기간·예치금${C.isRegulated(ctx.a) ? "·세대주·5년 안에 당첨 없음" : ""}`),
      score: gajeomScore(ctx),
      notes: compact([
        gajeomRatioNote(ctx.a),
        "가점이 같으면 통장 가입 기간이 긴 순, 그다음 추첨이에요.",
        depositByAreaNote(ctx),
      ]),
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
            ? { label: "1순위", order: 1, tri: "pass", detail: "혼인 중이고 자녀가 있어서 1순위예요." }
            : { label: "2순위", order: 2, tri: "pass", detail: "자녀가 없으면 2순위예요 — 신청은 할 수 있어요." },
      notes: compact(["50%는 소득 100%(맞벌이 120%) 이하, 20%는 140%(160%) 이하에서 순위대로, 30%는 추첨이에요.", pool(ctx, "privateNewlywed")]),
    };
  },
  spFirst: (ctx) => {
    const hh = privateFirstHousehold(ctx);
    const soloOnly = hh.tri === "pass" && !!hh.hint;
    return {
      checks: [
        C.neverOwned(ctx),
        C.homelessHousehold(ctx),
        hh,
        specialIncomeOrProperty(ctx, INCOME.privateFirst),
        ...privateReq(ctx),
        C.taxFive(ctx),
      ],
      rank: { label: soloOnly ? "추첨(60㎡ 이하)" : "추첨", order: 5, tri: "pass" },
      notes: compact([
        "모두 추첨이에요. 50%는 소득 130% 이하, 20%는 160% 이하에서 먼저 뽑아요.",
        "1인 가구는 전용 60㎡ 이하 추첨분만 신청할 수 있어요.",
        pool(ctx, "privateFirst"),
      ]),
    };
  },
  spMultiChild: (ctx) => ({
    checks: [C.children(ctx, 2), C.homelessHousehold(ctx), C.accountPeriod(ctx, 6), C.deposit(ctx, Math.min(...ctx.a.units.map((u) => u.area)))],
    score: multiChildScore(ctx),
    rank: { label: "배점", order: 3, tri: "pass" },
    // 지역별 우선 배정 비율은 가이드에 근거가 없어 단정하지 않는다
    notes: ["소득 기준 없이 100점 배점표로 뽑아요.", "지역별 배정 비율은 공고문에서 확인하세요."],
  }),
  spParents: (ctx) => ({
    checks: [C.parents(ctx), C.head(ctx), C.homelessHousehold(ctx), ...privateReq(ctx)],
    score: gajeomScore(ctx),
    rank: { label: "가점", order: 3, tri: "pass" },
    notes: ["일반공급과 같은 가점으로 뽑아요."],
  }),
  spNewborn: (ctx) => ({
    checks: [C.infant(ctx), C.homelessHousehold(ctx), specialIncomeOrProperty(ctx, INCOME.privateNewborn), ...privateReq(ctx)],
    rank: { label: "추첨", order: 5, tri: "pass" },
    notes: compact([
      "2026년 6월 새로 생긴 특별공급이에요. 결혼 여부와 상관없어요.",
      "50%는 소득 130% 이하, 20%는 160% 이하에서 먼저 추첨해요.",
      pool(ctx, "privateNewborn"),
    ]),
  }),
});

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
