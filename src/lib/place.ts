import { CAPITAL_AREA, type Sido } from "@/lib/domain";

/**
 * 지역 이름·권역 — 화면 표기와 판정(해당지역·신청 가능 지역)이 함께 쓴다.
 */

/** 「서울 강동구」. 시·군·구 칸에 시·도 이름이 이미 들어 있으면(「서울 전역」) 그대로 */
export function placeText(a: { sido: Sido | string; sigungu?: string }): string {
  const sg = a.sigungu?.trim();
  // 세종은 시·군·구가 「세종시」 하나뿐이라 「세종」만
  if (!sg || (a.sido === "세종" && sg === "세종시")) return a.sido;
  if (sg.startsWith(a.sido)) return sg;
  return `${a.sido} ${sg}`;
}

/** 공고 지역이 시·도 전체인가(「서울 전역」 같은 매입·전세임대) */
export function isWideArea(a: { sigungu?: string }): boolean {
  return !a.sigungu || /전역|전체/.test(a.sigungu);
}

/**
 * 「해당 주택건설지역」이 시·도 단위인 곳 — 특별시·광역시·특별자치시와,
 * 관할 안에 자치 시·군이 없는 제주특별자치도(제주시·서귀포시는 행정시).
 * 나머지 도는 시·군이 해당 지역이다(주택공급에 관한 규칙).
 */
export const CITY_LEVEL_SIDO: readonly Sido[] = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "제주"];

export const isCityLevel = (s: Sido) => CITY_LEVEL_SIDO.includes(s);

/**
 * 청약 권역 — 민영·공공분양은 대체로 해당 시·도와 이 권역 안 거주자만 신청한다.
 * 공고마다 다를 수 있다(대규모 택지 등은 더 넓게 받는다).
 */
export const BLOCS: { id: string; name: string; sido: readonly Sido[] }[] = [
  { id: "capital", name: "수도권", sido: CAPITAL_AREA },
  { id: "chungcheong", name: "충청권", sido: ["대전", "세종", "충남", "충북"] },
  { id: "bugyeong", name: "부울경", sido: ["부산", "울산", "경남"] },
  { id: "daegyeong", name: "대구·경북", sido: ["대구", "경북"] },
  { id: "honam", name: "호남권", sido: ["광주", "전남", "전북"] },
  { id: "gangwon", name: "강원", sido: ["강원"] },
  { id: "jeju", name: "제주", sido: ["제주"] },
];

export function blocOf(s: Sido) {
  return BLOCS.find((b) => b.sido.includes(s))!;
}

export function sameBloc(x: Sido, y: Sido): boolean {
  return blocOf(x).id === blocOf(y).id;
}

/** 해당 지역 이름 — 시 단위면 「서울」, 도면 「고양시」 */
export function localAreaName(a: { sido: Sido; sigungu?: string }): string {
  if (isCityLevel(a.sido) || isWideArea(a)) return a.sido;
  return a.sigungu!;
}
