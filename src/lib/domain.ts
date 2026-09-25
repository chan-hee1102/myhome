/**
 * 청약핏 도메인 타입.
 *
 * 공고(Announcement) 하나에는 공급 대상(SupplyGroup)이 여러 개 있다.
 * 예) 행복주택 공고 = 청년 계층 + 신혼부부 계층 + 고령자 계층, 민영 아파트 = 일반공급 + 신혼부부·생애최초 특별공급 …
 * 자격·순위·가점은 전부 공급 대상 단위로 판정하고, 공고 카드에는 그중 사용자에게 가장 유리한 결과를 보여준다.
 */

export const SIDO = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
] as const;
export type Sido = (typeof SIDO)[number];

export const CAPITAL_AREA: readonly Sido[] = ["서울", "인천", "경기"];
export const METRO_CITIES: readonly Sido[] = ["부산", "대구", "인천", "광주", "대전", "울산"];

/** 주택 유형(프로그램). 규칙 템플릿의 단위 */
export type ProgramId =
  | "happy" // 행복주택
  | "national" // 국민임대
  | "permanent" // 영구임대
  | "integrated" // 통합공공임대
  | "purchase" // 매입임대
  | "jeonse" // 전세임대
  | "youthSafe" // 청년안심주택(공공지원민간임대)
  | "deundeun" // HUG 든든전세주택
  | "publicSale" // 공공분양(뉴홈·국민주택)
  | "privateApt"; // 민영 아파트

/** 공급 대상(계층·공급 방식) */
export type GroupId =
  | "youth"
  | "student"
  | "newlywed"
  | "elderly"
  | "benefit" // 수급자·차상위 등
  | "general" // 일반(세대 기준)
  | "gen1" // 분양 일반공급
  | "spNewlywed"
  | "spFirst"
  | "spMultiChild"
  | "spParents"
  | "spNewborn";

export type Agency = "LH" | "SH" | "GH" | "HUG" | "IH" | "BMC" | "민간";

export type SourceId = "applyhome" | "myhome" | "lh" | "hug" | "manual";

/** 공고문에서 읽어 템플릿 기본값을 덮어쓰는 값들. 없으면 법령·지침 기본값을 쓴다 */
export interface GroupParams {
  ageMin?: number;
  ageMax?: number;
  /** 소득 상한(도시근로자 월평균소득 대비 %) */
  incomePct?: number;
  /** 1인 가구 소득 상한 % */
  incomePctSingle?: number;
  /** 맞벌이 소득 상한 % */
  incomePctDual?: number;
  /** 총자산 상한(만원) */
  assetsMax?: number;
  /** 자동차가액 상한(만원) */
  carMax?: number;
  /** 해당 지역 우선 공급에 필요한 거주 기간(개월) */
  residenceMonthsForPriority?: number;
  /** 청약 신청 가능 지역(시·도). 비우면 전국 */
  applyRegions?: Sido[];
}

export interface HousingUnit {
  /** 예) "전용 36㎡", "84A" */
  name: string;
  /** 전용면적 ㎡ */
  area: number;
  units: number;
  /** 임대: 보증금·월세(만원) / 분양: 분양가(만원) */
  deposit?: number;
  rent?: number;
  price?: number;
  /** 최소값이라는 표시(마이홈 rentGtn·mtRntchrg는 최솟값이다) */
  minimum?: boolean;
}

export interface SupplyGroup {
  id: GroupId;
  /** 화면 표기. 예) "청년 계층", "신혼부부 특별공급" */
  label: string;
  units?: number;
  params?: GroupParams;
  /** 기준값 출처: template=법령·지침 기본값으로 추정 / notice=공고문에서 확인 / reviewed=사람이 검수 */
  basis: "template" | "notice" | "reviewed";
}

export interface Schedule {
  announced: string; // YYYY-MM-DD
  applyStart: string;
  applyEnd: string;
  /** 분양: 특별공급·1순위·2순위 접수일 */
  special?: string;
  rank1?: string;
  rank2?: string;
  winners?: string;
  contract?: string;
  moveIn?: string; // YYYY-MM
}

export interface Announcement {
  id: string;
  source: SourceId;
  sourceId: string;
  agency: Agency;
  program: ProgramId;
  title: string;
  /** 단지·지구 이름 */
  complex: string;
  sido: Sido;
  sigungu: string;
  address?: string;
  schedule: Schedule;
  /** 분양 전용: 규제지역 */
  regulation?: { speculative: boolean; adjusted: boolean; priceCap: boolean };
  /** 수도권 여부는 sido로 계산하지만, 분양은 공고에 명시된 값을 우선한다 */
  units: HousingUnit[];
  groups: SupplyGroup[];
  noticeUrl?: string;
  summary: string[];
  /** 예시 데이터 표시 */
  sample?: boolean;
}

/* ───────────────────────── 사용자 프로필 ───────────────────────── */

export type Marital = "single" | "engaged" | "newlywed" | "married";
export type HomeStatus = "none" | "own" | "familyOwn";
export type SpecialStatus = "recipient" | "nearPoor" | "singleParent" | "disabled" | "veteran";

/**
 * 사용자가 답한 것. 모든 칸은 선택이다 — 비어 있으면 판정 엔진이 「확인 필요」로 남긴다.
 * 금액은 전부 만원 단위, 기기(localStorage)에만 저장한다.
 */
export interface Profile {
  birthYear?: number;
  sido?: Sido;
  sigungu?: string;
  /** 지금 사는 시·도에 산 기간(년, 대략) */
  residenceYears?: number;
  marital?: Marital;
  /** 자녀 수(미성년, 태아 포함). 3은 「3명 이상」 */
  children?: number;
  /** 2세 미만 아기가 있거나 임신 중 */
  infant?: boolean;
  home?: HomeStatus;
  /** 세대원 모두 집을 가져 본 적이 없다(생애최초) */
  neverOwned?: boolean;
  /** 무주택이 된 지(년). 쭉 무주택이면 99 */
  homelessYears?: number;
  /** 세전 월소득(가구 합산, 만원) 구간. 모르면 undefined */
  income?: Band;
  dualIncome?: boolean;
  hasAccount?: boolean;
  /** 청약통장 가입 기간(개월) 구간 */
  accountMonths?: Band;
  /** 납입 인정 횟수 구간 */
  payments?: Band;
  /** 예치금·납입 총액(만원) 구간 */
  deposit?: Band;
  /** 총자산(만원) 구간 — 부동산·금융·자동차 합, 부채 차감 */
  assets?: Band;
  /** 자동차가액(만원) 구간. 차 없으면 {0,0} */
  car?: Band;
  householdHead?: boolean;
  /** 만 65세 이상 부모님과 3년 이상 같은 주민등록 */
  livesWithParents?: boolean;
  special?: SpecialStatus[];
  /** 최근 5년 안에 청약 당첨된 적 있음 */
  wonRecently?: boolean;
  student?: boolean;
  /** 근로·사업소득세를 5년 이상 냈다(생애최초 특별공급) */
  taxFiveYears?: boolean;
}

/** 금액 구간(만원). max=null이면 「이상」 */
export interface Band {
  min: number;
  max: number | null;
}

/** 프로필 칸 이름 — 「이것만 알려주시면」 추천에 쓴다 */
export type ProfileKey = keyof Profile;
