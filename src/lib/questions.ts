import type { Band, HomeStatus, Marital, Profile, ProfileKey, SpecialStatus } from "./domain";
import { placeText } from "./place";
import { bandText, incomeText, manwon, monthsBandText } from "./rules/core";
import { standardsFor } from "./rules/standards";

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
  { label: "이혼·사별", value: "solo", sub: "지금은 혼자예요" },
];

export const CHILDREN: Option<number>[] = [
  { label: "없음", value: 0 },
  { label: "1명", value: 1 },
  { label: "2명", value: 2 },
  { label: "3명 이상", value: 3 },
];

/**
 * 만 6세 이하 자녀 수 — 자녀가 1명 이상일 때만 묻는다(0명이면 판정 엔진이 0으로 본다).
 * 매입·전세임대·행복주택 신혼 계층의 「6세 이하 자녀 가구」·한부모 조건, 다자녀 배점 「영유아」에 쓴다.
 */
export const YOUNG_CHILDREN_LABEL = "만 6세 이하 자녀";
export const YOUNG_CHILDREN_HELP = "모집공고일 기준 만 나이로 세요.";

export const YOUNG_CHILDREN: Option<number>[] = [
  { label: "없음", value: 0 },
  { label: "1명", value: 1 },
  { label: "2명", value: 2 },
  { label: "3명 이상", value: 3 },
];

/** 자녀 수보다 많은 선택지는 가린다 — 자녀 2명이면 「없음·1명·2명」 */
export function youngChildrenOptions(children: number | undefined): Option<number>[] {
  if (children === undefined || children >= 3) return YOUNG_CHILDREN;
  return YOUNG_CHILDREN.filter((o) => o.value <= children);
}

export const HOME: Option<HomeStatus>[] = [
  { label: "우리 세대 모두 집이 없어요", value: "none", sub: "등본에 함께 오른 가족 기준" },
  { label: "제 이름으로 된 집이 있어요", value: "own", sub: "분양권·입주권 포함" },
  { label: "함께 사는 가족 명의 집이 있어요", value: "familyOwn", sub: "배우자, 부모님 등" },
];

const b = (min: number, max: number | null): Band => ({ min, max });

/** 정확한 금액·횟수 하나를 구간으로 — 직접 입력한 값은 {min: x, max: x} */
export const exactBand = (x: number): Band => b(x, x);

/** 세전 월소득(가구 합산, 만원). 경계가 겹치지 않게 [300, 399] = 「300만 원대」 */
export const INCOME: Option<Band>[] = [
  { label: "200만 원 미만", value: b(0, 199) },
  ...[200, 300, 400, 500, 600, 700, 800, 900].map((m) => ({ label: `${m}만 원대`, value: b(m, m + 99) })),
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

/**
 * 통장 가입 기간 스테퍼 값 → 구간.
 *   0 → 6개월 미만 [0,5] · 0.5 → 6개월~1년 [6,11] · 정수 y(1 이상) → y년 [y*12, y*12+11]
 */
export function accountBandFromYears(y: number): Band {
  if (y < 0.5) return b(0, 5);
  if (y < 1) return b(6, 11);
  const n = Math.floor(y);
  return b(n * 12, n * 12 + 11);
}

/** 구간 → 스테퍼 값(accountBandFromYears의 반대). 옛 선택지 구간이면 아래 끝 기준 */
export function accountYearsFromBand(v: Band | undefined): number | undefined {
  if (!v) return undefined;
  if (v.min < 6) return 0;
  if (v.min < 12) return 0.5;
  return Math.floor(v.min / 12);
}

/** 스테퍼 값 글자: 0 → 「6개월 미만」, 0.5 → 「6개월~1년」, 5 → 「5년」 */
export const accountYearsText = (y: number) => monthsBandText(accountBandFromYears(y));

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

/* ── 자산·부동산·자동차: 경계를 기준표(standards.ts) 값에서 만든다 — 구간이 기준선에 걸치지 않게 ── */

const STD_ASSETS = standardsFor().assets;

/** 경계값 목록 → 선택지. 앞 구간은 「○ 이하」, 가운데는 「○ ~ ○」, 끝은 「○ 넘음」. 아래 끝은 「경계 + 1」 */
function bandsFrom(cuts: { at: number; sub: string }[], zero?: Option<Band>): Option<Band>[] {
  const sorted = [...cuts].sort((x, y) => x.at - y.at);
  const out: Option<Band>[] = zero ? [zero] : [];
  let lo = zero ? 1 : 0;
  for (const c of sorted) {
    const v = b(lo, c.at);
    out.push({ label: bandText(v), value: v, sub: c.sub });
    lo = c.at + 1;
  }
  out.push({ label: `${manwon(lo - 1)} 넘음`, value: b(lo, null) });
  return out;
}

/** 총자산(만원) — 부동산·예금·자동차 등을 합치고 빚을 뺀 금액 */
export const ASSETS: Option<Band>[] = bandsFrom([
  { at: STD_ASSETS.happyStudent, sub: "행복주택 대학생 기준까지" },
  { at: STD_ASSETS.publicSaleSmall, sub: "공공분양 부동산 기준까지" },
  { at: STD_ASSETS.permanent, sub: "영구·매입임대 기준까지" },
  { at: STD_ASSETS.happyYouth, sub: "행복주택 청년 기준까지" },
  { at: STD_ASSETS.special29, sub: "민영 특공 부동산 기준까지" },
  { at: STD_ASSETS.rentGeneral, sub: "국민·통합공공임대 기준까지" },
  { at: STD_ASSETS.newhome, sub: "뉴홈 나눔형 기준까지" },
]);

/** 부동산(토지·건물, 만원) — 공공분양·민영 특공 추첨분이 보는 값 */
export const PROPERTY: Option<Band>[] = bandsFrom(
  [
    { at: STD_ASSETS.publicSaleSmall, sub: "공공분양 기준까지" },
    { at: STD_ASSETS.special29, sub: "민영 특공 추첨분 기준까지" },
  ],
  { label: "없어요", value: b(0, 0), sub: "전세나 월세로 살아요" },
);

/** 자동차가액(만원, 가장 비싼 차) — 기준 하나(standards.ts car)만 가른다 */
export const CAR: Option<Band>[] = [
  { label: "차 없음", value: b(0, 0) },
  { label: `${manwon(STD_ASSETS.car)} 이하`, value: b(1, STD_ASSETS.car) },
  { label: `${manwon(STD_ASSETS.car)} 넘음`, value: b(STD_ASSETS.car + 1, null) },
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

/**
 * 예/아니요 질문 — 모두 긍정형으로 묻고, options[0]이 늘 긍정(「있어요」·「네」)이다.
 * 버튼은 options 순서대로 왼쪽부터 그리면 「긍정이 왼쪽」으로 통일된다.
 * 「집을 가져 본 적이 없나요?」 같은 이중부정은 쓰지 않는다 — 값이 반대인 칸(neverOwned)은 value로 뒤집는다.
 */
export interface YesNoQuestion {
  key: ProfileKey;
  label: string;
  help?: string;
  options: [Option<boolean>, Option<boolean>];
}

const YES: Option<boolean> = { label: "네", value: true };
const NO: Option<boolean> = { label: "아니요", value: false };

export const YES_NO = {
  hasAccount: {
    key: "hasAccount",
    label: "청약통장이 있나요?",
    help: "주택청약종합저축(또는 청약저축·예금·부금)",
    options: [{ label: "있어요", value: true }, { label: "없어요", value: false }],
  },
  dualIncome: { key: "dualIncome", label: "맞벌이인가요?", options: [{ label: "네, 맞벌이예요", value: true }, NO] },
  infant: {
    key: "infant",
    label: "2세 미만 아기가 있거나 임신 중인가요?",
    options: [{ label: "있어요", value: true }, { label: "없어요", value: false }],
  },
  householdHead: {
    key: "householdHead",
    label: "세대주인가요?",
    help: "주민등록등본 맨 위에 이름이 있으면 세대주예요",
    options: [{ label: "네, 세대주예요", value: true }, NO],
  },
  livesWithParents: {
    key: "livesWithParents",
    label: "만 65세 이상 부모님을 3년 넘게 모시고 있나요?",
    help: "같은 주민등록등본에 올라 있어야 해요",
    options: [YES, NO],
  },
  neverOwned: {
    key: "neverOwned",
    label: "세대원 중 집을 가져 본 사람이 있나요?",
    help: "팔았어도 한 번 가졌으면 있어요를 골라 주세요.",
    // 값이 반대: 「있어요」 = neverOwned false
    options: [{ label: "있어요", value: false }, { label: "없어요", value: true }],
  },
  wonRecently: {
    key: "wonRecently",
    label: "최근 5년 안에 청약에 당첨된 적이 있나요?",
    help: "세대원 누구든 당첨됐으면 있어요를 골라 주세요.",
    options: [{ label: "있어요", value: true }, { label: "없어요", value: false }],
  },
  student: { key: "student", label: "대학생인가요?", help: "재학·입학 예정·졸업 2년 이내", options: [YES, NO] },
  taxFiveYears: {
    key: "taxFiveYears",
    label: "근로·사업소득세를 5년 이상 냈나요?",
    help: "생애최초 특별공급 조건이에요",
    options: [YES, NO],
  },
} as const satisfies Record<string, YesNoQuestion>;

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
  if (p.sido) out.push(placeText({ sido: p.sido, sigungu: p.sigungu }));
  if (p.marital === "solo") out.push("혼자(이혼·사별)");
  else if ((p.marital === "newlywed" || p.marital === "married") && p.marriedYear) out.push(`${p.marriedYear}년 결혼`);
  else {
    const m = optionLabel(MARITAL, p.marital);
    if (m) out.push(m);
  }
  if (p.children !== undefined) out.push(p.children ? `자녀 ${p.children >= 3 ? "3명+" : `${p.children}명`}` : "자녀 없음");
  if (p.children && p.youngChildren) out.push(`6세 이하 ${p.youngChildren >= 3 ? "3명+" : `${p.youngChildren}명`}`);
  if (p.home) out.push({ none: "무주택", own: "집 있음", familyOwn: "가족 집 있음" }[p.home]);
  if (p.income) out.push(incomeText(p.income));
  if (p.hasAccount === false) out.push("통장 없음");
  else if (p.accountMonths) out.push(`통장 ${monthsBandText(p.accountMonths)}`);
  return out;
}
