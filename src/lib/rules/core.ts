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
 * 구간 표기.
 *   선택지 구간은 [200, 299]처럼 위 끝이 「다음 경계 − 1」이라 사람에게는 「200만 원대」·「~300만 원 미만」으로 보여준다(끝이 9면 +1).
 *   기준선 바로 위에서 시작하는 구간은 [10801, 24500]처럼 아래 끝이 「경계 + 1」이라 「1억 800만 ~」으로 보여준다(끝이 1이면 −1).
 *   정확한 금액(min === max)은 그 금액 하나로 — 「720만 원」.
 */
export function bandText(b: Band | undefined, unit: (n: number) => string = manwon): string {
  if (!b) return "아직 입력 안 함";
  if (b.max === 0) return "없음";
  if (b.max != null && b.min === b.max) return unit(b.min);
  const lo = b.min % 10 === 1 ? b.min - 1 : b.min;
  if (b.max == null) return lo === b.min ? `${unit(b.min)} 이상` : `${unit(lo)} 초과`;
  const top = b.max % 10 === 9 ? b.max + 1 : b.max;
  if (lo === 0) return `${unit(top)} ${top === b.max ? "이하" : "미만"}`;
  // 소득 선택지 [300, 399] → 「300만 원대」
  if (unit === manwon && lo < 10000 && lo % 100 === 0 && top - lo === 100 && top !== b.max) return `${lo.toLocaleString("ko-KR")}만 원대`;
  return `${unit(lo).replace(/ 원$/, "")} ~ ${unit(top)}`;
}

/** 월소득 표기: 「월 300만 원대」, 「월 720만 원」 */
export function incomeText(b: Band | undefined): string {
  return b ? `월 ${bandText(b)}` : "아직 입력 안 함";
}

/**
 * 통장 가입 기간 표기.
 *   [0,5] → 「6개월 미만」, [6,11] → 「6개월~1년」, 정확한 연수 [60,71] → 「5년」, [60,119] → 「5~10년」, [180,null] → 「15년 이상」
 */
export function monthsBandText(b: Band | undefined): string {
  if (!b) return "아직 입력 안 함";
  const y = (m: number) => (m % 12 === 0 ? `${m / 12}년` : `${m}개월`);
  if (b.max == null) return `${y(b.min)} 이상`;
  if (b.min === b.max) return y(b.min);
  const top = b.max + 1;
  if (b.min === 0) return `${y(top)} 미만`;
  if (b.min % 12 === 0 && top - b.min === 12) return `${b.min / 12}년`;
  if (b.min % 12 === 0 && top % 12 === 0) return `${b.min / 12}~${top / 12}년`;
  return `${y(b.min)}~${y(top)}`;
}

/** 거주·무주택 연수 표기: 0 → 「1년 미만」, 99 → 「쭉(태어나서부터)」, 7 → 「7년」 */
export function yearsText(n: number | undefined): string {
  if (n === undefined) return "아직 입력 안 함";
  if (n >= 99) return "태어나서 쭉";
  if (n < 1) return "1년 미만";
  return `${Math.floor(n)}년`;
}

/* ───────────────────────── 사실 파생 ───────────────────────── */

export interface Derived {
  today: Date;
  year: number;
  /** 만 나이 가능 범위(생일 전후) */
  age?: [number, number];
  /** 지금 혼인 중(「혼자(이혼·사별)」·예비부부는 false) */
  married?: boolean;
  /** 혼인 7년 이내. 혼인신고 연도가 경계(7년 전)면 undefined — 날짜에 따라 달라진다 */
  within7?: boolean;
  /** 혼인 기간(년) 가능 범위 — 혼인신고 연도가 있을 때만 */
  marriedYears?: [number, number];
  engaged?: boolean;
  /** 이혼·사별 등으로 지금 혼자 */
  solo?: boolean;
  /** 가구원 수(본인+배우자+자녀+같이 사는 부모). 자녀 「3명 이상」이면 하한 */
  householdSize?: number;
  /** 세대 전원 무주택 */
  homelessHousehold?: boolean;
  /** 본인 무주택 */
  homelessSelf?: boolean;
  /** 가점 부양가족 수(배우자 + 미혼 자녀 + 3년 이상 모신 부모) */
  dependents?: number;
  /** 2세 미만 아기(임신 포함). 자녀 0명이면 false — 따로 묻지 않는다 */
  infant?: boolean;
  /** 만 6세 이하 자녀 수. 자녀 0명이면 0, 자녀 수보다 크면 자녀 수로 줄인다 */
  youngChildren?: number;
}

export function derive(p: Profile, today = new Date()): Derived {
  const year = today.getFullYear();
  const d: Derived = { today, year };
  if (p.birthYear) d.age = [year - p.birthYear - 1, year - p.birthYear];
  if (p.marital) {
    d.married = p.marital === "newlywed" || p.marital === "married";
    d.engaged = p.marital === "engaged";
    d.solo = p.marital === "solo";
    if (d.married && p.marriedYear) {
      // 혼인신고가 그해 어느 날인지 모르므로: 7년 전 해에 했으면 날짜에 따라 갈린다
      const gap = year - p.marriedYear;
      d.marriedYears = [Math.max(0, gap - 1), Math.max(0, gap)];
      d.within7 = gap <= 6 ? true : gap >= 8 ? false : undefined;
    } else {
      d.within7 = p.marital === "newlywed";
    }
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
  // 자녀가 없으면(태아 포함 0명) 아기·6세 이하 자녀도 없다 — 화면이 묻지 않아도 풀린다
  if (p.children === 0) {
    d.infant = false;
    d.youngChildren = 0;
  } else {
    d.infant = p.infant;
    d.youngChildren =
      p.youngChildren !== undefined && p.children !== undefined ? Math.min(p.youngChildren, p.children) : p.youngChildren;
  }
  return d;
}

/**
 * 만 나이 표기. 출생연도만 알아 생일 전후로 두 값이 가능하면 「만 65세 또는 66세(생일 전후)」,
 * 하나로 정해지면 「만 65세」.
 */
export function ageText(age?: [number, number]): string {
  if (!age) return "아직 입력 안 함";
  return age[0] === age[1] ? `만 ${age[0]}세` : `만 ${age[0]}세 또는 ${age[1]}세(생일 전후)`;
}
