import type { IncomeRule } from "./checks";
import { income100, type Standards } from "./standards";

/**
 * 유형·대상별 소득 기준 — 판정 템플릿(templates.ts)과 가이드 페이지(guides.ts)가 함께 쓰는 한 벌.
 * 여기 숫자를 바꾸면 판정과 가이드 표가 같이 바뀐다. 출처는 docs/DESIGN.md 4장(S5~S18).
 */
export const INCOME = {
  happyYouth: { kind: "rent", pct: 100, bonus: true },
  happyStudent: { kind: "rent", pct: 100, bonus: true },
  happyNewlywed: { kind: "rent", pct: 100, pctDual: 120, bonus: true },
  happyElderly: { kind: "rent", pct: 100, bonus: true },
  /** 국민임대 전용 60㎡ 이하(50㎡ 미만은 50% 이하에 먼저 공급) */
  nationalSmall: { kind: "rent", pct: 70, bonus: true },
  /** 국민임대 전용 60㎡ 초과 */
  nationalLarge: { kind: "rent", pct: 100, bonus: true },
  permanentTier2: { kind: "rent", pct: 50, bonus: true },
  integrated: { kind: "median", pct: 150, bonusBy: { one: 20, two: 10 } },
  integratedNewlywed: { kind: "median", pct: 150, pctDual: 180, bonusBy: { one: 20, two: 10 } },
  purchaseYouthTier3: { kind: "rent", pct: 100, bonus: true },
  purchaseNewlywedI: { kind: "rent", pct: 70, pctDual: 90 },
  purchaseNewlywedII: { kind: "rent", pct: 100, pctDual: 120 },
  jeonseNewlywedII: { kind: "rent", pct: 130, pctDual: 200 },
  generalTier2: { kind: "rent", pct: 50, bonus: true },
  youthSafe: { kind: "rent", pct: 120 },
  publicGen: { kind: "sale", pct: 100, pctDual: 140 },
  publicNewlywed: { kind: "sale", pct: 130, pctDual: 200 },
  publicFirst: { kind: "sale", pct: 130, pctDual: 200 },
  publicMultiChild: { kind: "sale", pct: 120, pctDual: 200 },
  publicParents: { kind: "sale", pct: 120, pctDual: 200 },
  publicNewborn: { kind: "sale", pct: 140, pctDual: 200 },
  privateNewlywed: { kind: "sale", pct: 140, pctDual: 160 },
  privateFirst: { kind: "sale", pct: 160 },
  privateNewborn: { kind: "sale", pct: 160 },
} as const satisfies Record<string, IncomeRule>;

export type IncomeKey = keyof typeof INCOME;

/**
 * 분양 특별공급 소득 풀 — 물량을 소득 구간별로 나눠 먼저 뽑는 순서.
 * 비율(pct)은 분양 계열 소득 100%(3인 이하 가구당, 4인 이상은 가구원수별) 대비, 가산 없음.
 * 출처: 가이드 「신혼부부·생애최초·신생아 특별공급」 표(선정 행)와 같은 값 — 여기를 바꾸면 poolLine 문구가 따라 바뀐다.
 *   pctDual이 없으면 그 구간의 맞벌이 기준이 가이드에 없다는 뜻이다(외벌이 기준으로만 단정한다).
 *   last=true인 구간은 신청 자격 상한까지의 나머지 물량(추첨). 민영은 소득을 넘어도 부동산 기준으로 들어갈 수 있다.
 */
export interface IncomePool {
  /** 「우선공급」·「그다음 물량」·「추첨 물량」 */
  name: string;
  /** 물량 비율(%) */
  share: number;
  /** 소득 상한(%). last 구간은 신청 자격 상한 */
  pct: number;
  pctDual?: number;
  last?: boolean;
}

export const POOLS = {
  publicNewlywed: [
    { name: "우선공급", share: 70, pct: 100, pctDual: 120 },
    { name: "그다음 물량", share: 20, pct: 130 },
    { name: "추첨 물량", share: 10, pct: INCOME.publicNewlywed.pct, pctDual: INCOME.publicNewlywed.pctDual, last: true },
  ],
  publicFirst: [
    { name: "우선공급", share: 70, pct: 100, pctDual: 120 },
    { name: "그다음 물량", share: 20, pct: 130, pctDual: 140 },
    { name: "추첨 물량", share: 10, pct: INCOME.publicFirst.pct, pctDual: INCOME.publicFirst.pctDual, last: true },
  ],
  publicNewborn: [
    { name: "우선공급", share: 70, pct: 100, pctDual: 120 },
    { name: "그다음 물량", share: 20, pct: 140, pctDual: 150 },
    { name: "추첨 물량", share: 10, pct: INCOME.publicNewborn.pct, pctDual: INCOME.publicNewborn.pctDual, last: true },
  ],
  privateNewlywed: [
    { name: "우선공급", share: 50, pct: 100, pctDual: 120 },
    { name: "그다음 물량", share: 20, pct: 140, pctDual: 160 },
    { name: "추첨 물량", share: 30, pct: INCOME.privateNewlywed.pct, pctDual: INCOME.privateNewlywed.pctDual, last: true },
  ],
  privateFirst: [
    { name: "우선공급", share: 50, pct: 130 },
    { name: "그다음 물량", share: 20, pct: 160 },
    { name: "추첨 물량", share: 30, pct: INCOME.privateFirst.pct, last: true },
  ],
  privateNewborn: [
    { name: "우선공급", share: 50, pct: 130 },
    { name: "그다음 물량", share: 20, pct: 160 },
    { name: "추첨 물량", share: 30, pct: INCOME.privateNewborn.pct, last: true },
  ],
} as const satisfies Partial<Record<IncomeKey, readonly IncomePool[]>>;

export type PoolKey = keyof typeof POOLS;

/** 나이 기준 */
export const AGE = {
  youth: [19, 39],
  integratedYouth: [18, 39],
  elderly: [65, 200],
} as const;

/**
 * 가구원수와 규칙으로 소득 상한(원)을 계산한다. 공고별 덮어쓰기(params)는 여기서 다루지 않는다.
 * 1인 +20%p·2인 +10%p 가산은 규칙에 bonus/bonusBy가 있을 때만(임대 계열).
 */
export function limitFor(std: Standards, size: number, rule: IncomeRule, dual = false): { pct: number; won: number } {
  let pct = dual && rule.pctDual ? rule.pctDual : rule.pct;
  if (rule.bonus || rule.bonusBy) {
    const by = rule.bonusBy ?? { one: 20, two: 10 };
    pct += size === 1 ? by.one : size === 2 ? by.two : 0;
  }
  return { pct, won: Math.round((income100(std, size, rule.kind) * 10_000 * pct) / 100) };
}

/** 원 단위 금액 → "457만 6,036원" */
export function won(n: number): string {
  const v = Math.round(n);
  const eok = Math.floor(v / 100_000_000);
  const man = Math.floor((v % 100_000_000) / 10_000);
  const rest = v % 10_000;
  const parts: string[] = [];
  if (eok) parts.push(`${eok}억`);
  if (man) parts.push(`${man.toLocaleString("ko-KR")}만`);
  if (rest || !parts.length) parts.push(rest.toLocaleString("ko-KR"));
  return `${parts.join(" ")}원`;
}
