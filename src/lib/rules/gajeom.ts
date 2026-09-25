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
}

export interface GajeomLine {
  key: "homeless" | "dependents" | "account";
  label: string;
  points: number;
  max: number;
  note: string;
}

export function computeGajeom(input: GajeomInput): { total: number; lines: GajeomLine[] } {
  const h = homelessPoints(input.homelessYears, input.homeless);
  const d = dependentPoints(input.dependents);
  const own = accountPoints(input.accountMonths);
  const a = Math.min(17, own + spouseAccountBonus(input.spouseAccountMonths ?? null));
  const lines: GajeomLine[] = [
    {
      key: "homeless",
      label: "무주택 기간",
      points: h,
      max: 32,
      note: input.homeless
        ? input.homelessYears < 1
          ? "1년 미만"
          : `${Math.floor(input.homelessYears)}년${input.homelessYears >= 15 ? " 이상" : ""}`
        : "주택 소유",
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
        input.accountMonths == null
          ? "통장 없음"
          : input.accountMonths < 12
            ? `${input.accountMonths}개월`
            : `${Math.floor(input.accountMonths / 12)}년${input.accountMonths >= 180 ? " 이상" : ""}`,
    },
  ];
  return { total: h + d + a, lines };
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
