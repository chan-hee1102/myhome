import type { Band, Profile } from "@/lib/domain";
import { josa } from "@/lib/josa";
import { bandAtMost, derive, manwon, type Derived, type Tri } from "./core";
import { INCOME, limitFor, POOLS, type IncomeKey, type IncomePool, type PoolKey } from "./criteria";
import { income100, standardsFor, type Standards } from "./standards";

/**
 * 소득 눈금자 — 소득 입력 단계에서 「우리 가족(N인) 기준 유형별 소득 상한」을 그린다.
 * 금액은 전부 criteria.ts 규칙 × standards.ts 기준표로 계산한다(손으로 적지 않는다).
 *
 * 기준 금액(100%)은 셋이다 — 유형마다 무엇의 몇 %인지가 다르다.
 *   공공임대 기준 = 도시근로자 가구원수별 월평균소득 (행복·국민·영구·매입·전세임대, 청년안심주택). 1인 +20%p·2인 +10%p 가산
 *   분양 기준     = 도시근로자 월평균소득 3인 이하 「가구당」 한 값(4인 이상은 가구원수별) (공공분양·민영 특공). 가산 없음
 *   중위소득 기준 = 기준 중위소득 (통합공공임대)
 */

export type BasisKind = "rent" | "sale" | "median";

/** 기준 종류 짧은 이름 — 표 행 옆에 붙인다 */
export const BASIS_SHORT: Record<BasisKind, "공공임대 기준" | "분양 기준" | "중위소득 기준"> = {
  rent: "공공임대 기준",
  sale: "분양 기준",
  median: "중위소득 기준",
};

export interface RulerRow {
  key: IncomeKey;
  /** 「행복주택 청년」 */
  label: string;
  /** 1·2인 가산·맞벌이를 반영한 비율(%) */
  pct: number;
  /** 월 상한(만원) */
  limit: number;
  /** 무엇의 몇 %인지 */
  basis: "도시근로자 월평균소득" | "기준 중위소득";
  /** 기준 종류 — 「공공임대 기준」·「분양 기준」·「중위소득 기준」 */
  basisShort: (typeof BASIS_SHORT)[BasisKind];
  /** 내 소득이 상한 이하인가(소득을 모르면 unknown) */
  tri: Tri;
  /** 「기준의 약 79~105%」 — 소득을 모르면 없음 */
  share?: string;
}

/** 기준 금액(100%) 하나 — UI가 「기준이 셋」을 설명할 때 쓴다 */
export interface RulerBase {
  kind: BasisKind;
  /** 「공공임대 기준」 */
  short: (typeof BASIS_SHORT)[BasisKind];
  /** 월 금액(만원) — 이 가구원 수의 100% */
  value: number;
  /** 한 줄 설명. 예) 「도시근로자 월평균소득(1인) — 행복·국민·영구·매입임대」 */
  note: string;
}

export interface IncomeRuler {
  /** 가구원 수 */
  size: number;
  /** 맞벌이 기준을 썼는가 */
  dual: boolean;
  /** 도시근로자 월평균소득 100%(가구원수별, 만원) — 공공임대 기준 */
  base100: number;
  /** 분양 기준 100%(만원) — 3인 이하는 가구당 한 값, 4인 이상은 가구원수별 */
  baseSale100: number;
  /** 기준 중위소득 100%(가구원수별, 만원) — 통합공공임대 */
  baseMedian100: number;
  /** 위 셋을 표로 — 금액 낮은 순이 아니라 공공임대 → 분양 → 중위소득 순 */
  bases: RulerBase[];
  /** 상한이 낮은 것부터 */
  rows: RulerRow[];
}

type RowDef = { key: IncomeKey; label: string };

const ROWS_SINGLE: RowDef[] = [
  { key: "nationalSmall", label: "국민임대" },
  { key: "happyYouth", label: "행복주택 청년" },
  { key: "youthSafe", label: "청년안심주택" },
  { key: "integrated", label: "통합공공임대" },
  { key: "publicGen", label: "공공분양 일반공급" },
  { key: "privateFirst", label: "민영 생애최초" },
];

const ROWS_COUPLE: RowDef[] = [
  { key: "nationalSmall", label: "국민임대" },
  { key: "happyNewlywed", label: "행복주택 신혼부부" },
  { key: "integratedNewlywed", label: "통합공공임대 신혼부부" },
  { key: "publicGen", label: "공공분양 일반공급" },
  { key: "publicNewlywed", label: "공공분양 신혼 특공" },
  { key: "privateNewlywed", label: "민영 신혼 특공" },
];

/** 만 65세 이상이면 더하는 행 */
const ROWS_ELDERLY: RowDef[] = [
  { key: "permanentTier2", label: "영구임대 2순위" },
  { key: "happyElderly", label: "행복주택 고령자" },
];

/** 청년(만 19~39세)에게만 해당하는 행 — 확실히 40세 이상이면 뺀다 */
const YOUTH_ONLY = new Set<IncomeKey>(["happyYouth", "youthSafe"]);

/** 소득 구간이 상한의 몇 %인지. [300, 399]면 위 끝을 400으로 보고 [79, 105] */
export function incomeShare(band: Band, limit: number): [number, number | null] {
  const lo = Math.round((band.min / limit) * 100);
  if (band.max == null) return [lo, null];
  const top = band.min === band.max ? band.max : band.max % 10 === 9 ? band.max + 1 : band.max;
  return [lo, Math.round((top / limit) * 100)];
}

/** 「기준의 약 96%」, 「기준의 약 79~105%」, 「기준의 52% 미만」, 「기준의 262% 이상」 */
export function incomeShareText(band: Band | undefined, limit: number): string | undefined {
  if (!band) return undefined;
  const [lo, hi] = incomeShare(band, limit);
  if (hi == null) return `기준의 ${lo}% 이상`;
  if (lo === hi) return `기준의 약 ${lo}%`;
  if (band.min === 0) return `기준의 ${hi}% 미만`;
  return `기준의 약 ${lo}~${hi}%`;
}

function basesFor(std: Standards, size: number): RulerBase[] {
  const n = `${size}인`;
  return [
    {
      kind: "rent",
      short: BASIS_SHORT.rent,
      value: income100(std, size, "rent"),
      note: `도시근로자 월평균소득(${n}) — 행복·국민·영구·매입·전세임대, 청년안심주택. 1인 +20%p·2인 +10%p를 더해요`,
    },
    {
      kind: "sale",
      short: BASIS_SHORT.sale,
      value: income100(std, size, "sale"),
      note:
        size <= 3
          ? "도시근로자 월평균소득(3인 이하 가구당 한 값) — 공공분양·민영 특별공급. 가구원 수로 더하지 않아요"
          : `도시근로자 월평균소득(${n}) — 공공분양·민영 특별공급. 가구원 수로 더하지 않아요`,
    },
    {
      kind: "median",
      short: BASIS_SHORT.median,
      value: income100(std, size, "median"),
      note: `기준 중위소득(${n}) — 통합공공임대`,
    },
  ];
}

/**
 * 가구원 수·맞벌이로 유형별 소득 상한을 계산한다. 가구원 수를 모르면(혼인·자녀 미입력) null.
 * 미혼·혼자면 청년 쪽, 혼인 중·예비부부면 신혼 쪽 유형을 보여준다.
 * 만 65세 이상일 수 있으면 영구임대 2순위·행복주택 고령자 행을 더하고, 확실히 만 40세 이상이면 청년 전용 행은 뺀다.
 * 1인·2인 가산은 limitFor가 규칙대로(임대 계열만) 더한다.
 */
export function incomeRuler(p: Profile, announced?: string, today = new Date()): IncomeRuler | null {
  const d = derive(p, today);
  const size = d.householdSize;
  if (size === undefined) return null;
  const std = standardsFor(announced);
  const couple = !!(d.married || d.engaged);
  const dual = !!(d.married && p.dualIncome);
  let defs = couple ? ROWS_COUPLE : ROWS_SINGLE;
  if (d.age && d.age[0] >= 40) defs = defs.filter((r) => !YOUTH_ONLY.has(r.key));
  if (d.age && d.age[1] >= 65) defs = [...defs, ...ROWS_ELDERLY.filter((e) => !defs.some((r) => r.key === e.key))];
  const rows = defs.map(({ key, label }) => {
    const rule = INCOME[key];
    const { pct, won } = limitFor(std, size, rule, dual);
    const limit = won / 10_000;
    return {
      key,
      label,
      pct,
      limit,
      basis: rule.kind === "median" ? "기준 중위소득" : "도시근로자 월평균소득",
      basisShort: BASIS_SHORT[rule.kind],
      tri: bandAtMost(p.income, limit),
      share: incomeShareText(p.income, limit),
    } satisfies RulerRow;
  });
  rows.sort((x, y) => x.limit - y.limit);
  const bases = basesFor(std, size);
  return {
    size,
    dual,
    base100: bases[0].value,
    baseSale100: bases[1].value,
    baseMedian100: bases[2].value,
    bases,
    rows,
  };
}

/** 「국민임대 월 343만 원(90%)」 한 줄 */
export function rulerRowText(r: RulerRow): string {
  return `${r.label} 월 ${manwon(r.limit)}(${r.pct}%)`;
}

/* ───────────────────────── 우선공급 풀 한 줄 ───────────────────────── */

/** 소득이 이 풀의 상한(%) 이하인가 — 비율 구간 [lo, hi]로 따진다 */
function poolTri(share: [number, number | null], limitPct: number): Tri {
  const [lo, hi] = share;
  if (hi != null && hi <= limitPct) return "pass";
  if (lo > limitPct) return "fail";
  return "unknown";
}

/** 이 풀의 상한(%). 맞벌이인데 그 구간 맞벌이 기준이 가이드에 없으면 외벌이 값(하한)과 approx=true */
function tierLimit(t: IncomePool, dual: boolean): { lim: number; approx: boolean } {
  if (dual && t.pctDual !== undefined) return { lim: t.pctDual, approx: false };
  return { lim: t.pct, approx: dual && !t.last };
}

function limText(t: IncomePool, dual: boolean): string {
  return dual && t.pctDual !== undefined ? `맞벌이 ${t.pctDual}%` : `소득 ${t.pct}%`;
}

type PoolSay = { joined: boolean; text: string };

/**
 * 「내 소득이 어느 우선공급 풀에 드는지」 한 줄. 소득·가구원 수를 모르면 undefined.
 *
 *   poolLine(p, "publicNewlywed")
 *   → 「내 소득은 분양 기준의 약 96%라 우선공급(물량 70% · 소득 100% 이하)에 들어요.」
 *
 * 비율은 분양 기준 100%(3인 이하 가구당, 4인 이상 가구원수별) 대비. 맞벌이 여부를 모르는데 결과가 갈리면 두 경우를 함께 말한다.
 * 민영은 소득 상한을 넘어도 부동산 기준으로 추첨 물량에 들 수 있어 그렇게 안내한다(부동산 판정은 자격 조건 줄에서).
 */
export function poolLine(p: Profile, key: PoolKey, opts: { announced?: string; today?: Date; d?: Derived } = {}): string | undefined {
  const d = opts.d ?? derive(p, opts.today);
  if (!p.income || d.householdSize === undefined) return undefined;
  const std = standardsFor(opts.announced);
  const base = income100(std, d.householdSize, "sale");
  const share = incomeShare(p.income, base);
  const shareText = incomeShareText(p.income, base)!.replace(/^기준/, "분양 기준");
  const tiers = POOLS[key] as readonly IncomePool[];
  const priv = key.startsWith("private");

  /** joined=true면 「내 소득은 ○%라 …」로 잇고, false면 「내 소득은 ○%예요. …」로 끊는다 */
  const say = (dual: boolean): PoolSay => {
    for (let i = 0; i < tiers.length; i++) {
      const t = tiers[i];
      const { lim, approx } = tierLimit(t, dual);
      const tri = poolTri(share, lim);
      if (tri === "pass") {
        if (i === 0) return { joined: true, text: `${t.name}(물량 ${t.share}% · ${limText(t, dual)} 이하)에 들어요` };
        if (t.last) return { joined: true, text: `우선공급 기준은 넘지만 ${t.name}(${t.share}%)에 들어요` };
        return { joined: true, text: `우선공급 기준은 넘지만 ${t.name}(${t.share}% · ${limText(t, dual)} 이하)에 들어요` };
      }
      if (tri === "unknown" || approx) {
        if (approx && tri === "fail") return { joined: false, text: `${t.name}의 맞벌이 기준은 공고문에서 확인하세요` };
        const what = t.last
          ? `신청 기준(${dual && t.pctDual ? "맞벌이 " : ""}${lim}%) 안인지는`
          : `${t.name}(${limText(t, dual)} 이하)에 드는지는`;
        return { joined: false, text: `${what} 정확한 금액을 알려주시면 가려져요` };
      }
    }
    const last = tiers[tiers.length - 1];
    const lim = tierLimit(last, dual).lim;
    return priv
      ? { joined: true, text: `소득 기준(${lim}%)은 넘어요. 부동산 기준을 채우면 ${last.name}(${last.share}%)에는 넣을 수 있어요` }
      : { joined: true, text: `신청 기준(${lim}%)을 넘어요` };
  };

  const lead = (s: PoolSay) =>
    s.joined ? `내 소득은 ${shareText}${josa(shareText, "이라/라")} ${s.text}.` : `내 소득은 ${shareText}${josa(shareText, "이에요/예요")}. ${s.text}.`;
  const married = !!d.married;
  if (!married) return lead(say(false));
  if (p.dualIncome !== undefined) return lead(say(p.dualIncome));
  // 혼인 중인데 맞벌이 여부를 모름 — 두 경우가 같으면 하나로
  const one = say(false);
  const two = say(true);
  if (one.text === two.text) return lead(one);
  return `내 소득은 ${shareText}${josa(shareText, "이에요/예요")}. 외벌이면 ${one.text}. 맞벌이면 ${two.text}.`;
}