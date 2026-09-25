import type { Band, Profile, ProfileKey } from "@/lib/domain";

/**
 * 세 값 논리. 판정 엔진의 모든 조건은 이 셋 중 하나를 돌려준다.
 *   pass    = 확실히 충족
 *   fail    = 확실히 미달
 *   unknown = 입력이 없거나 구간이 기준선에 걸쳐 있어 단정할 수 없음 → 「확인 필요」
 * 모르는 값을 pass로 치면 떨어질 공고를 권하게 되고, fail로 치면 넣을 수 있는 공고를 숨기게 된다.
 */
export type Tri = "pass" | "fail" | "unknown";

export interface Check {
  key: string;
  /** 조건 이름. 예) "나이" */
  label: string;
  /** 기준. 예) "만 19~39세" */
  need: string;
  /** 내 값. 예) "만 29세" / "아직 입력 안 함" */
  mine: string;
  tri: Tri;
  /** unknown일 때 무엇을 알려주면 풀리는지 */
  ask?: ProfileKey[];
  /** 경계에 걸렸을 때 등 덧붙일 말 */
  hint?: string;
}

export function all(tris: Tri[]): Tri {
  if (tris.includes("fail")) return "fail";
  if (tris.includes("unknown")) return "unknown";
  return "pass";
}

export function any(tris: Tri[]): Tri {
  if (tris.includes("pass")) return "pass";
  if (tris.includes("unknown")) return "unknown";
  return "fail";
}

export const not = (t: Tri): Tri => (t === "pass" ? "fail" : t === "fail" ? "pass" : "unknown");

export const fromBool = (b: boolean | undefined): Tri => (b === undefined ? "unknown" : b ? "pass" : "fail");

/** 구간이 limit 이하인가 */
export function bandAtMost(band: Band | undefined, limit: number): Tri {
  if (!band) return "unknown";
  if (band.max != null && band.max <= limit) return "pass";
  if (band.min > limit) return "fail";
  return "unknown";
}

/** 구간이 need 이상인가 */
export function bandAtLeast(band: Band | undefined, need: number): Tri {
  if (!band) return "unknown";
  if (band.min >= need) return "pass";
  if (band.max != null && band.max < need) return "fail";
  return "unknown";
}

/** 숫자 구간 [lo, hi]가 [min, max] 안에 드는가 */
export function rangeWithin(lo: number, hi: number, min: number, max: number): Tri {
  if (lo >= min && hi <= max) return "pass";
  if (hi < min || lo > max) return "fail";
  return "unknown";
}

export function manwon(n: number): string {
  if (n >= 10000) {
    const eok = Math.floor(n / 10000);
    const rest = Math.round(n % 10000);
    return rest ? `${eok}억 ${rest.toLocaleString("ko-KR")}만 원` : `${eok}억 원`;
  }
  return `${Math.round(n).toLocaleString("ko-KR")}만 원`;
}

/**
 * 구간 표기. 선택지 구간은 [200, 249]처럼 위 끝이 「다음 경계 − 1」이라
 * 사람에게는 「200~250만 원」으로 보여준다(끝이 9로 끝나면 +1).
 */
export function bandText(b: Band | undefined, unit: (n: number) => string = manwon): string {
  if (!b) return "아직 입력 안 함";
  if (b.max === 0) return "없음";
  if (b.max == null) return `${unit(b.min)} 이상`;
  const top = b.max % 10 === 9 ? b.max + 1 : b.max;
  if (b.min === 0) return `${unit(top)} ${top === b.max ? "이하" : "미만"}`;
  return `${unit(b.min).replace(/ 원$/, "")} ~ ${unit(top)}`;
}

/** 통장 가입 기간 구간 표기: [60,119] → "5~10년", [0,5] → "6개월 미만" */
export function monthsBandText(b: Band | undefined): string {
  if (!b) return "아직 입력 안 함";
  const y = (m: number) => (m % 12 === 0 ? `${m / 12}년` : `${m}개월`);
  if (b.max == null) return `${y(b.min)} 이상`;
  const top = b.max + 1;
  if (b.min === 0) return `${y(top)} 미만`;
  if (b.min % 12 === 0 && top % 12 === 0) return `${b.min / 12}~${top / 12}년`;
  return `${y(b.min)}~${y(top)}`;
}

/* ───────────────────────── 사실 파생 ───────────────────────── */

export interface Derived {
  today: Date;
  year: number;
  /** 만 나이 가능 범위(생일 전후) */
  age?: [number, number];
  married?: boolean;
  /** 혼인 7년 이내(예비부부 포함 여부는 따로) */
  within7?: boolean;
  engaged?: boolean;
  /** 가구원 수(본인+배우자+자녀+같이 사는 부모). 자녀 「3명 이상」이면 하한 */
  householdSize?: number;
  /** 세대 전원 무주택 */
  homelessHousehold?: boolean;
  /** 본인 무주택 */
  homelessSelf?: boolean;
  /** 가점 부양가족 수(배우자 + 미혼 자녀 + 3년 이상 모신 부모) */
  dependents?: number;
}

export function derive(p: Profile, today = new Date()): Derived {
  const year = today.getFullYear();
  const d: Derived = { today, year };
  if (p.birthYear) d.age = [year - p.birthYear - 1, year - p.birthYear];
  if (p.marital) {
    d.married = p.marital === "newlywed" || p.marital === "married";
    d.within7 = p.marital === "newlywed";
    d.engaged = p.marital === "engaged";
  }
  if (p.marital !== undefined && p.children !== undefined) {
    d.householdSize = 1 + (d.married ? 1 : 0) + p.children + (p.livesWithParents ? 1 : 0);
  }
  if (p.home) {
    d.homelessHousehold = p.home === "none";
    d.homelessSelf = p.home !== "own";
  }
  if (p.marital !== undefined && p.children !== undefined) {
    d.dependents = (d.married ? 1 : 0) + p.children + (p.livesWithParents ? 1 : 0);
  }
  return d;
}

export function ageText(age?: [number, number]): string {
  if (!age) return "아직 입력 안 함";
  return age[0] === age[1] ? `만 ${age[0]}세` : `만 ${age[0]}~${age[1]}세`;
}
