import type { Sido } from "@/lib/domain";

/**
 * 판정에 쓰는 숫자 기준표 — 해마다 바뀌는 값은 전부 여기 한 파일에만 둔다.
 * 조사일 2026-09-23. 출처 약어는 docs/DESIGN.md 「출처」 표와 같다.
 *
 * ⚠️ 적용 시점: 소득은 2026-01-01 공고분부터, 자산은 2026-02-27 공고분부터(S15).
 *    공고일로 연도를 골라야 하므로 연도별로 버전을 두고 standardsFor(공고일)로 꺼낸다.
 */

export interface Standards {
  year: number;
  /** 도시근로자 가구원수별 월평균소득 100% (원) — 임대 계열 [S13·S15] */
  incomeByHousehold: Record<number, number>;
  /** 6인 이상: 5인 + 1인당 가산액 */
  incomeExtraPerPerson: number;
  /** 분양 계열(공공분양·민영 특공): 3인 이하 「가구당」 월평균소득 100% [S13] */
  incomeSaleUpTo3: number;
  /** 기준 중위소득 100% (원) — 통합공공임대 [S8·S15] */
  medianByHousehold: Record<number, number>;
  /** 자산 상한(만원) [S13·S14·S15·S18] */
  assets: {
    rentGeneral: number; // 국민·통합공공·행복(신혼·고령)·청년안심 신혼
    happyYouth: number; // 행복주택 청년·청년안심 청년(본인)
    happyStudent: number;
    permanent: number; // 영구·매입·전세임대 일반 [부분확인]
    publicSaleSmall: number; // 공공분양 60㎡ 이하 — 부동산
    newhome: number; // 나눔형·선택형 총자산
    special29: number; // 민영 특공 소득 초과자 추첨분 — 부동산(건보 재산 29등급) [부분확인]
    car: number;
  };
}

const S2026: Standards = {
  year: 2026,
  incomeByHousehold: {
    1: 3_813_363,
    2: 5_866_270,
    3: 8_168_429,
    4: 8_802_202,
    5: 9_326_985,
    6: 9_906_263,
    7: 10_485_541,
    8: 11_064_819,
  },
  incomeExtraPerPerson: 579_278,
  incomeSaleUpTo3: 7_533_763,
  medianByHousehold: {
    1: 2_564_238,
    2: 4_199_292,
    3: 5_359_036,
    4: 6_494_738,
    5: 7_556_719,
    6: 8_555_952,
    7: 9_515_150,
    8: 10_474_348,
  },
  assets: {
    rentGeneral: 34_500,
    happyYouth: 25_100,
    happyStudent: 10_800,
    permanent: 24_500,
    publicSaleSmall: 21_550,
    newhome: 36_200,
    special29: 33_100,
    car: 4_542,
  },
};

const BY_YEAR: Record<number, Standards> = { 2026: S2026 };

/** 공고일 기준 적용 연도의 기준표. 아직 없는 연도면 가장 가까운 해를 쓴다 */
export function standardsFor(announced?: string): Standards {
  const y = announced ? Number(announced.slice(0, 4)) : new Date().getFullYear();
  const years = Object.keys(BY_YEAR).map(Number).sort((a, b) => a - b);
  const pick = years.filter((v) => v <= y).pop() ?? years[0];
  return BY_YEAR[pick];
}

/** 가구원수별 월평균소득 100% (만원) */
export function income100(std: Standards, size: number, kind: "rent" | "sale" | "median"): number {
  const n = Math.max(1, Math.round(size));
  if (kind === "median") return (std.medianByHousehold[Math.min(8, n)] ?? std.medianByHousehold[8]) / 10_000;
  if (kind === "sale" && n <= 3) return std.incomeSaleUpTo3 / 10_000;
  if (n <= 8) return std.incomeByHousehold[n] / 10_000;
  return (std.incomeByHousehold[8] + std.incomeExtraPerPerson * (n - 8)) / 10_000;
}

/* ───────────────────────── 청약통장 예치금 [S2 별표2] ───────────────────────── */

export type DepositArea = "85" | "102" | "135" | "all";

/** 신청자 주민등록 거주지 기준 예치금(만원) */
const DEPOSIT: Record<"seoulBusan" | "metro" | "other", Record<DepositArea, number>> = {
  seoulBusan: { "85": 300, "102": 600, "135": 1000, all: 1500 },
  metro: { "85": 250, "102": 400, "135": 700, all: 1000 },
  other: { "85": 200, "102": 300, "135": 400, all: 500 },
};

export function depositClass(sido: Sido): keyof typeof DEPOSIT {
  if (sido === "서울" || sido === "부산") return "seoulBusan";
  if (["대구", "인천", "광주", "대전", "울산"].includes(sido)) return "metro";
  return "other";
}

export function depositFor(sido: Sido, area: number): number {
  const a: DepositArea = area <= 85 ? "85" : area <= 102 ? "102" : area <= 135 ? "135" : "all";
  return DEPOSIT[depositClass(sido)][a];
}

export const DEPOSIT_TABLE = DEPOSIT;
