import type { Band, HomeStatus, Marital, Profile, SpecialStatus } from "./domain";

/** 선택지 하나. value는 프로필에 그대로 들어간다 */
export interface Option<T> {
  label: string;
  value: T;
  sub?: string;
}

export const MARITAL: Option<Marital>[] = [
  { label: "미혼", value: "single" },
  { label: "결혼 예정", value: "engaged", sub: "예비부부" },
  { label: "결혼 7년 이내", value: "newlywed" },
  { label: "결혼 7년 넘음", value: "married" },
];

export const CHILDREN: Option<number>[] = [
  { label: "없음", value: 0 },
  { label: "1명", value: 1 },
  { label: "2명", value: 2 },
  { label: "3명 이상", value: 3 },
];

export const HOME: Option<HomeStatus>[] = [
  { label: "우리 세대 모두 집이 없어요", value: "none", sub: "같은 주민등록에 올라 있는 가족 모두" },
  { label: "제 명의로 된 집이 있어요", value: "own", sub: "분양권·입주권 포함" },
  { label: "가족 중에 집 가진 사람이 있어요", value: "familyOwn", sub: "배우자·부모님 등 같은 세대원" },
];

const b = (min: number, max: number | null): Band => ({ min, max });

/** 세전 월소득(가구 합산, 만원) */
export const INCOME: Option<Band>[] = [
  { label: "200만 원 미만", value: b(0, 200) },
  { label: "200~300만 원", value: b(200, 300) },
  { label: "300~400만 원", value: b(300, 400) },
  { label: "400~500만 원", value: b(400, 500) },
  { label: "500~600만 원", value: b(500, 600) },
  { label: "600~800만 원", value: b(600, 800) },
  { label: "800~1,000만 원", value: b(800, 1000) },
  { label: "1,000만 원 이상", value: b(1000, null) },
];

export const ACCOUNT_MONTHS: Option<Band>[] = [
  { label: "6개월 미만", value: b(0, 5) },
  { label: "6개월~1년", value: b(6, 11) },
  { label: "1~2년", value: b(12, 23) },
  { label: "2~3년", value: b(24, 35) },
  { label: "3~5년", value: b(36, 59) },
  { label: "5~10년", value: b(60, 119) },
  { label: "10~15년", value: b(120, 179) },
  { label: "15년 이상", value: b(180, null) },
];

export const PAYMENTS: Option<Band>[] = [
  { label: "6회 미만", value: b(0, 5) },
  { label: "6~11회", value: b(6, 11) },
  { label: "12~23회", value: b(12, 23) },
  { label: "24~35회", value: b(24, 35) },
  { label: "36~47회", value: b(36, 47) },
  { label: "48~59회", value: b(48, 59) },
  { label: "60회 이상", value: b(60, null) },
];

/** 예치금·납입 총액(만원). 경계는 예치금 기준(200/250/300/400/500/600/700/1000/1500)에 맞췄다 */
export const DEPOSIT: Option<Band>[] = [
  { label: "200만 원 미만", value: b(0, 199) },
  { label: "200~250만", value: b(200, 249) },
  { label: "250~300만", value: b(250, 299) },
  { label: "300~400만", value: b(300, 399) },
  { label: "400~600만", value: b(400, 599) },
  { label: "600~1,000만", value: b(600, 999) },
  { label: "1,000~1,500만", value: b(1000, 1499) },
  { label: "1,500만 원 이상", value: b(1500, null) },
];

/** 총자산(만원) — 부동산·금융자산·자동차 합에서 부채를 뺀 값 */
export const ASSETS: Option<Band>[] = [
  { label: "1억 원 미만", value: b(0, 9999) },
  { label: "1억~2억", value: b(10000, 19999) },
  { label: "2억~2억 5천", value: b(20000, 24999) },
  { label: "2억 5천~3억 3천", value: b(25000, 32999) },
  { label: "3억 3천~3억 5천", value: b(33000, 34999) },
  { label: "3억 5천~5억", value: b(35000, 49999) },
  { label: "5억 원 이상", value: b(50000, null) },
];

export const CAR: Option<Band>[] = [
  { label: "차 없음", value: b(0, 0) },
  { label: "2,000만 원 미만", value: b(1, 1999) },
  { label: "2,000~4,500만", value: b(2000, 4499) },
  { label: "4,500만 원 이상", value: b(4500, null) },
];

export const RESIDENCE_YEARS: Option<number>[] = [
  { label: "1년 미만", value: 0 },
  { label: "1~3년", value: 1 },
  { label: "3~5년", value: 3 },
  { label: "5~10년", value: 5 },
  { label: "10년 이상", value: 10 },
];

export const HOMELESS_YEARS: Option<number>[] = [
  { label: "태어나서 쭉", value: 99 },
  { label: "1년 미만", value: 0 },
  { label: "1~5년", value: 1 },
  { label: "5~10년", value: 5 },
  { label: "10~15년", value: 10 },
  { label: "15년 이상", value: 15 },
];

export const SPECIAL: Option<SpecialStatus>[] = [
  { label: "기초생활수급자", value: "recipient" },
  { label: "차상위계층", value: "nearPoor" },
  { label: "한부모가족", value: "singleParent" },
  { label: "장애인", value: "disabled" },
  { label: "국가유공자", value: "veteran" },
];

const sameBand = (x?: Band, y?: Band) => !!x && !!y && x.min === y.min && x.max === y.max;

export function optionLabel<T>(opts: Option<T>[], v: T | undefined): string | undefined {
  if (v === undefined) return undefined;
  const hit = opts.find((o) =>
    typeof v === "object" && v !== null ? sameBand(o.value as unknown as Band, v as unknown as Band) : o.value === v,
  );
  return hit?.label;
}

/** 결과 화면 상단의 「내 조건」 요약 칩 */
export function profileChips(p: Profile): string[] {
  const out: string[] = [];
  if (p.birthYear) out.push(`${String(p.birthYear).slice(2)}년생`);
  if (p.sido) out.push(p.sigungu ? `${p.sido} ${p.sigungu}` : p.sido);
  const m = optionLabel(MARITAL, p.marital);
  if (m) out.push(m);
  if (p.children !== undefined) out.push(p.children ? `자녀 ${p.children >= 3 ? "3명+" : `${p.children}명`}` : "자녀 없음");
  if (p.home) out.push({ none: "무주택", own: "주택 소유", familyOwn: "세대원 주택 소유" }[p.home]);
  const inc = optionLabel(INCOME, p.income);
  if (inc) out.push(`월 ${inc.replace(" 원", "")}`);
  if (p.hasAccount === false) out.push("통장 없음");
  const acc = optionLabel(ACCOUNT_MONTHS, p.accountMonths);
  if (acc) out.push(`통장 ${acc}`);
  return out;
}
