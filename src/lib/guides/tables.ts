import { manwon } from "@/lib/rules/core";
import { INCOME, limitFor, won, type IncomeKey } from "@/lib/rules/criteria";
import { accountPoints, dependentPoints, homelessPoints } from "@/lib/rules/gajeom";
import { DEPOSIT_TABLE, standardsFor } from "@/lib/rules/standards";
import { gajeomRatio } from "@/lib/rules/templates";
import { SRC } from "./sources";
import type { Guide } from "./types";

/** 2026 공고 기준표 */
export const STD = standardsFor("2026-09-01");
const Y = STD.year;
export const UPDATED = "2026-09-25";
export const PUBLISHED = "2026-09-25";

const n = (v: number) => Math.round(v).toLocaleString("ko-KR");

/** 원문 대조가 끝나지 않은 값(표 칸에 ※)을 설명하는 각주 — 특별공급 비교표도 같은 문장을 쓴다 */
export const PENDING_NOTE = "※ 표시한 값은 고시 원문과 한 번 더 맞춰 보는 중이에요. 신청 전에 공고문 숫자를 꼭 확인하세요.";
const SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

/** 가구원수별 100% 금액(원) */
export function base100(kind: "rent" | "sale" | "median", size: number) {
  if (kind === "median") return STD.medianByHousehold[size];
  if (kind === "sale" && size <= 3) return STD.incomeSaleUpTo3;
  return STD.incomeByHousehold[size];
}

/** 소득 상한(원) 문자열 */
export function limitWon(key: IncomeKey, size: number, dual = false) {
  return won(limitFor(STD, size, INCOME[key], dual).won);
}
export function limitPct(key: IncomeKey, size: number, dual = false) {
  return limitFor(STD, size, INCOME[key], dual).pct;
}

/* ───────────────────────── 소득 ───────────────────────── */

const RENT_PCTS = [50, 70, 100, 120, 130, 140, 160, 200];
const SALE_PCTS = [100, 120, 130, 140, 160, 200];
const MEDIAN_PCTS = [50, 70, 100, 150, 160, 170, 180];

/** 유형별로 쓰는 소득 기준 — 판정 템플릿과 같은 규칙에서 만든다 */
const USAGE: { label: string; key: IncomeKey; note?: string }[] = [
  { label: "행복주택 청년·고령자", key: "happyYouth" },
  { label: "행복주택 신혼부부", key: "happyNewlywed" },
  { label: "국민임대 (전용 60㎡ 이하)", key: "nationalSmall", note: "50㎡ 미만은 50% 이하에 먼저 공급" },
  { label: "국민임대 (전용 60㎡ 초과)", key: "nationalLarge" },
  { label: "영구임대·매입·전세임대 일반 2순위", key: "permanentTier2" },
  { label: "통합공공임대", key: "integrated" },
  { label: "통합공공임대 신혼부부", key: "integratedNewlywed" },
  { label: "매입임대 청년 3순위(본인)", key: "purchaseYouthTier3" },
  { label: "매입임대 신혼·신생아 Ⅰ", key: "purchaseNewlywedI" },
  { label: "전세임대 신혼·신생아 Ⅱ", key: "jeonseNewlywedII" },
  { label: "청년안심주택 특별공급", key: "youthSafe" },
  { label: "공공분양 일반공급 (60㎡ 이하)", key: "publicGen", note: "추첨분은 맞벌이 200%" },
  { label: "공공분양 신혼·생애최초 특공", key: "publicNewlywed" },
  { label: "공공분양 신생아 특공", key: "publicNewborn" },
  { label: "공공분양 다자녀·노부모 특공", key: "publicParents" },
  { label: "민영 신혼부부 특공", key: "privateNewlywed" },
  { label: "민영 생애최초·신생아 특공", key: "privateFirst" },
];

const KIND_NAME = { rent: "도시근로자 월평균소득(가구원수별)", sale: "도시근로자 월평균소득(3인 이하 가구당)", median: "기준 중위소득" };

export const incomeGuide: Guide = {
  slug: "income",
  category: "기준표",
  short: "소득 기준표",
  title: `${Y} 도시근로자 월평균소득·기준 중위소득 표`,
  description: `${Y}년 도시근로자 가구원수별 월평균소득(1인 ${won(STD.incomeByHousehold[1])}·3인 ${won(STD.incomeByHousehold[3])})과 기준 중위소득을 비율별로 정리했어요. 청약·공공임대 유형마다 몇 %를 쓰는지도 함께 볼 수 있어요.`,
  h1: `${Y}년 도시근로자 월평균소득·기준 중위소득 표`,
  answer: `${Y}년 도시근로자 월평균소득 100%는 1인 ${won(STD.incomeByHousehold[1])}, 2인 ${won(STD.incomeByHousehold[2])}, 3인 ${won(STD.incomeByHousehold[3])}, 4인 ${won(STD.incomeByHousehold[4])}이고, ${Y}년 1월 1일 이후 모집공고부터 적용돼요. 공공분양과 특별공급은 3인 이하 가구에 같은 금액(${won(STD.incomeSaleUpTo3)})을 쓰고, 통합공공임대는 기준 중위소득을 써요.`,
  facts: [`1인 ${manwon(STD.incomeByHousehold[1] / 10000)}`, `3인 ${manwon(STD.incomeByHousehold[3] / 10000)}`, `${Y}-01-01 공고부터`],
  sections: [
    {
      id: "rent",
      h2: `${Y}년 도시근로자 가구원수별 월평균소득은 얼마인가요?`,
      blocks: [
        {
          t: "p",
          text: "공공임대(행복주택·국민임대·영구임대·매입임대·전세임대)와 청년안심주택은 가구원수별 금액에 공고의 비율을 곱해 소득 상한을 정해요. 아래 표는 비율별 월 금액(세전)이에요.",
        },
        {
          t: "table",
          table: {
            id: "rent",
            caption: `${Y}년 도시근로자 가구원수별 월평균소득 (단위: 원)`,
            head: ["가구원수", ...RENT_PCTS.map((p) => `${p}%`)],
            rows: SIZES.map((s) => [`${s}인`, ...RENT_PCTS.map((p) => n((STD.incomeByHousehold[s] * p) / 100))]),
            note: `9인 이상은 8인 금액에 1인당 ${n(STD.incomeExtraPerPerson)}원(100% 기준)을 더해요.`,
          },
        },
      ],
    },
    {
      id: "sale",
      h2: "공공분양·특별공급은 1~3인 가구가 같은 금액이에요",
      blocks: [
        {
          t: "p",
          text: `공공분양 일반공급과 신혼부부·생애최초·신생아 특별공급은 「3인 이하 가구당 월평균소득」 한 금액(${won(STD.incomeSaleUpTo3)})을 1~3인 가구에 똑같이 쓰고, 4인 이상부터 가구원수별 금액을 써요. 그래서 1인·2인 가구는 임대 계열보다 기준이 넉넉해요.`,
        },
        {
          t: "table",
          table: {
            id: "sale",
            caption: `${Y}년 분양 계열 소득 기준 (단위: 원)`,
            head: ["가구원수", ...SALE_PCTS.map((p) => `${p}%`)],
            rows: [
              ["1~3인", ...SALE_PCTS.map((p) => n((STD.incomeSaleUpTo3 * p) / 100))],
              ...[4, 5, 6, 7, 8].map((s) => [`${s}인`, ...SALE_PCTS.map((p) => n((STD.incomeByHousehold[s] * p) / 100))]),
            ],
          },
        },
      ],
    },
    {
      id: "median",
      h2: `통합공공임대가 쓰는 ${Y}년 기준 중위소득`,
      blocks: [
        {
          t: "p",
          text: `통합공공임대는 도시근로자 소득이 아니라 보건복지부가 고시하는 기준 중위소득을 써요. 일반 기준은 150%이고, 1인 가구는 170%, 2인 가구는 160%까지 넓어져요. ${Y}년 1인 가구 170%는 월 ${limitWon("integrated", 1)}이에요.`,
        },
        {
          t: "table",
          table: {
            id: "median",
            caption: `${Y}년 기준 중위소득 (단위: 원)`,
            head: ["가구원수", ...MEDIAN_PCTS.map((p) => `${p}%`)],
            rows: SIZES.map((s) => [`${s}인`, ...MEDIAN_PCTS.map((p) => n((STD.medianByHousehold[s] * p) / 100))]),
          },
        },
      ],
    },
    {
      id: "by-type",
      h2: "유형·대상별 소득 비율 한눈에",
      blocks: [
        {
          t: "table",
          table: {
            caption: "유형·대상별 소득 기준 (가산 전 비율)",
            head: ["유형·대상", "기준", "비율", "맞벌이", "1·2인 가산"],
            wrap: true,
            rows: USAGE.map((u) => {
              const r = INCOME[u.key] as { kind: "rent" | "sale" | "median"; pct: number; pctDual?: number; bonus?: boolean; bonusBy?: { one: number; two: number } };
              const bonus = r.bonusBy ? `+${r.bonusBy.one}%p / +${r.bonusBy.two}%p` : r.bonus ? "+20%p / +10%p" : "없음";
              return [u.label + (u.note ? ` (${u.note})` : ""), KIND_NAME[r.kind], `${r.pct}%`, r.pctDual ? `${r.pctDual}%` : "—", bonus];
            }),
          },
        },
      ],
    },
    {
      id: "bonus",
      h2: "1인·2인 가구 가산은 어디에만 붙나요?",
      blocks: [
        {
          t: "p",
          text: "1인 가구 +20%p, 2인 가구 +10%p 가산은 행복주택·국민임대·영구임대·매입·전세임대 같은 임대 계열에만 붙어요. 공공분양 일반형과 민영주택 특별공급에는 붙지 않아요. 예를 들어 행복주택 청년 계층(100%)은 1인 가구라면 120%가 적용돼 " +
            `월 ${limitWon("happyYouth", 1)}이 상한이에요.`,
        },
        {
          t: "p",
          text: "2023년 3월 28일 이후 자녀를 낳았거나 임신 중인 가구는 공공분양·공공임대 소득 기준이 넓어져요. 그런 자녀가 1명이면 10%p, 2명 이상이거나 그 전에 낳은 자녀도 있으면 20%p를 더해요. 민영주택에는 이 가산이 없어요.",
        },
      ],
    },
    {
      id: "how",
      h2: "소득을 셈하는 방법",
      blocks: [
        {
          t: "ul",
          items: [
            "세전 금액이고, 근로·사업·재산소득 등을 합친 월평균이에요.",
            "청년 계층처럼 본인 소득만 보는 유형을 빼면, 같은 주민등록에 있는 세대원 소득을 모두 더해요.",
            "가구원수에는 태아도 넣고, 직계존속은 일정 기간 같은 주민등록에 있어야 넣어요(유형마다 달라요).",
            "최종 판정은 공급기관이 공적 자료로 조회한 소득으로 해요. 신고한 금액과 다를 수 있어요.",
          ],
        },
      ],
    },
  ],
  faq: [
    {
      q: `${Y}년 1인 가구 도시근로자 월평균소득 100%는 얼마인가요?`,
      a: `${won(STD.incomeByHousehold[1])}이에요. 임대 계열은 1인 가구에 20%p를 더하기 때문에, 100% 기준 유형이라면 실제 상한은 ${limitWon("happyYouth", 1)}(120%)예요.`,
    },
    {
      q: `소득 기준은 언제부터 ${Y}년 값으로 바뀌나요?`,
      a: `${Y}년 1월 1일 이후 입주자 모집공고를 낸 단지부터 ${Y}년 값을 써요. 그 전 공고는 전년도 값을 써요. 자산 기준은 적용일이 ${Y}년 2월 27일로 달라요.`,
    },
    {
      q: "맞벌이 가구는 기준이 얼마나 넓어지나요?",
      a: "유형마다 달라요. 행복주택 신혼부부는 120%, 공공분양 특별공급은 200%, 민영 신혼부부 특별공급은 160%예요. 부부 중 한 사람의 소득이 일정 비율을 넘으면 맞벌이 기준을 쓸 수 없는 경우도 있으니 공고문을 함께 확인하세요.",
    },
  ],
  sources: [SRC.publicRule, SRC.myhomeGuide, SRC.lhSale],
  related: ["assets", "happy-housing", "integrated-rental", "public-sale"],
  published: PUBLISHED,
  updated: UPDATED,
  dataset: {
    name: `${Y}년 도시근로자 가구원수별 월평균소득 기준표(청약·공공임대)`,
    description: `${Y}년 1월 1일 이후 모집공고에 적용되는 도시근로자 가구원수별 월평균소득과 비율별 금액, 분양 계열 3인 이하 가구당 금액, 기준 중위소득을 정리한 표예요.`,
    anchor: "rent",
    variables: ["가구원수", "월평균소득 100%(원)", "비율별 금액(원)"],
  },
};

/* ───────────────────────── 자산 ───────────────────────── */

const A = STD.assets;

export const assetsGuide: Guide = {
  slug: "assets",
  category: "기준표",
  short: "자산 기준표",
  title: `${Y} 청약·공공임대 자산 기준 총정리`,
  description: `국민·통합공공·행복(신혼·고령) 총자산 ${manwon(A.rentGeneral)}, 행복주택 청년 ${manwon(A.happyYouth)}, 자동차 ${manwon(A.car)}, 공공분양 부동산 ${manwon(A.publicSaleSmall)}. ${Y} 유형별 자산 상한을 정리했어요.`,
  h1: `${Y}년 자산·자동차 기준 (공공임대·공공분양)`,
  answer: `${Y}년 2월 27일 이후 모집공고부터 국민임대·통합공공임대·행복주택(신혼부부·고령자) 총자산 상한은 ${manwon(A.rentGeneral)}, 행복주택 청년은 ${manwon(A.happyYouth)}, 대학생은 ${manwon(A.happyStudent)}이고, 자동차는 ${manwon(A.car)} 이하여야 해요. 공공분양 전용 60㎡ 이하는 총자산이 아니라 부동산만 ${manwon(A.publicSaleSmall)} 이하인지 봐요.`,
  facts: [`총자산 ${manwon(A.rentGeneral)}`, `청년 ${manwon(A.happyYouth)}`, `자동차 ${manwon(A.car)}`],
  pending: "영구임대·매입·전세임대 일반의 총자산 기준과 민영 특별공급 추첨분의 부동산 기준은 고시 원문과 한 번 더 맞춰 보는 중이에요. 신청 전에 공고문 숫자를 꼭 확인하세요.",
  sections: [
    {
      id: "limits",
      h2: `${Y}년 유형별 자산 상한`,
      blocks: [
        {
          t: "table",
          table: {
            id: "limits",
            caption: `${Y}년 자산·자동차 상한`,
            head: ["적용 대상", "자산 기준", "상한", "자동차"],
            wrap: true,
            rows: [
              ["국민임대 · 통합공공임대 · 행복주택(신혼부부·고령자·주거급여)", "총자산", manwon(A.rentGeneral), manwon(A.car)],
              ["행복주택 청년 · 청년안심주택 청년(본인)", "총자산", manwon(A.happyYouth), manwon(A.car)],
              ["행복주택 대학생", "총자산", manwon(A.happyStudent), "보유 불가"],
              ["영구임대 · 매입·전세임대 일반", "총자산", `${manwon(A.permanent)} ※`, manwon(A.car)],
              ["공공분양 전용 60㎡ 이하 (일반·특별공급)", "부동산", manwon(A.publicSaleSmall), manwon(A.car)],
              ["뉴홈 나눔형·선택형 · 전세임대 신혼·신생아 Ⅱ", "총자산", manwon(A.newhome), manwon(A.car)],
              ["민영 특별공급 소득 초과자 추첨분", "부동산", `${manwon(A.special29)} ※`, "—"],
              ["HUG 든든전세 · 민영 일반공급", "기준 없음", "—", "—"],
            ],
            note: PENDING_NOTE,
          },
        },
      ],
    },
    {
      id: "total-vs-property",
      h2: "총자산과 부동산 기준은 무엇이 다른가요?",
      blocks: [
        {
          t: "p",
          text: "총자산은 토지·건물 같은 부동산에 자동차, 예금·주식 같은 금융자산, 그 밖의 자산을 더하고 부채를 뺀 금액이에요. 공공임대는 대부분 총자산으로 봐요.",
        },
        {
          t: "p",
          text: "공공분양 전용 60㎡ 이하와 민영 특별공급 추첨분은 부동산(토지·건물)만 봐요. 그래서 예금이 많아 총자산이 기준을 넘어도, 부동산이 기준 안쪽이면 신청할 수 있어요.",
        },
      ],
    },
    {
      id: "when",
      h2: "자산 기준 적용일은 소득과 달라요",
      blocks: [
        {
          t: "p",
          text: `${Y}년 자산 기준은 ${Y}년 2월 27일 이후 모집공고부터 써요. 소득 기준(1월 1일)과 적용일이 달라서, 1~2월 공고는 소득만 새 값이고 자산은 전년도 값일 수 있어요.`,
        },
      ],
    },
  ],
  faq: [
    {
      q: "청년 계층은 부모님 자산도 보나요?",
      a: `행복주택 청년과 청년안심주택 청년형은 본인 자산만 봐요(${manwon(A.happyYouth)} 이하). 뉴홈 나눔형 청년 특별공급처럼 부모 자산(10억 3,500만 원 이하)까지 보는 유형도 있어요.`,
    },
    {
      q: "자동차 기준 4,542만 원은 어떤 금액인가요?",
      a: `보유한 자동차의 가액(차량 기준가액)이 ${manwon(A.car)} 이하여야 한다는 뜻이에요. 행복주택 대학생 계층은 자동차가 있으면 신청할 수 없어요.`,
    },
    {
      q: "든든전세도 자산을 보나요?",
      a: "HUG 든든전세는 소득·자산 기준이 없어요. 세대 구성원이 모두 무주택이면 신청할 수 있고, 추첨으로 뽑아요.",
    },
  ],
  sources: [SRC.publicRule, SRC.myhomeGuide, SRC.lhApply, SRC.youthSafe],
  related: ["income", "happy-housing", "national-rental", "public-sale"],
  published: PUBLISHED,
  updated: UPDATED,
};

/* ───────────────────────── 예치금 ───────────────────────── */

const DEP = DEPOSIT_TABLE;
const REGION_NAME = { seoulBusan: "서울·부산", metro: "기타 광역시", other: "그 밖의 시·군" } as const;
const AREA_NAME = { "85": "85㎡ 이하", "102": "102㎡ 이하", "135": "135㎡ 이하", all: "모든 면적" } as const;

function areaFor(cls: keyof typeof DEP, amount: number) {
  const order = ["all", "135", "102", "85"] as const;
  for (const a of order) if (amount >= DEP[cls][a]) return AREA_NAME[a];
  return "—";
}

export const depositGuide: Guide = {
  slug: "deposit",
  category: "기준표",
  short: "예치금 기준표",
  title: "청약 예치금 기준표 — 지역·면적별",
  description: `민영주택 1순위 예치금은 서울·부산 전용 85㎡ 이하 ${DEP.seoulBusan["85"]}만 원, 광역시 ${DEP.metro["85"]}만 원, 그 밖의 지역 ${DEP.other["85"]}만 원이에요. 지역 3구분 × 면적 4구간 표와 예치금별 신청 가능 면적을 정리했어요.`,
  h1: "청약 예치금 기준표 (지역·전용면적별)",
  answer: `민영주택 예치금은 신청자의 주민등록 거주지와 신청할 주택의 전용면적으로 정해지고, 서울·부산은 85㎡ 이하 ${DEP.seoulBusan["85"]}만·102㎡ 이하 ${DEP.seoulBusan["102"]}만·135㎡ 이하 ${DEP.seoulBusan["135"]}만·모든 면적 ${DEP.seoulBusan.all.toLocaleString("ko-KR")}만 원이에요. 입주자 모집공고일까지 이 금액 이상이 통장에 들어 있어야 1순위가 돼요.`,
  facts: [`서울·부산 85㎡ ${DEP.seoulBusan["85"]}만`, `광역시 ${DEP.metro["85"]}만`, `그 밖 ${DEP.other["85"]}만`],
  sections: [
    {
      id: "table",
      h2: "지역·면적별 예치금",
      blocks: [
        {
          t: "table",
          table: {
            id: "table",
            caption: "민영주택 청약 예치기준금액 (단위: 만 원)",
            head: ["신청자 거주지", ...Object.values(AREA_NAME)],
            rows: (Object.keys(DEP) as (keyof typeof DEP)[]).map((c) => [
              REGION_NAME[c],
              ...(["85", "102", "135", "all"] as const).map((a) => DEP[c][a].toLocaleString("ko-KR")),
            ]),
            note: "기타 광역시는 대구·인천·광주·대전·울산이에요. 세종은 그 밖의 시·군으로 봐요.",
          },
        },
      ],
    },
    {
      id: "reverse",
      h2: "내 예치금으로 어느 면적까지 넣을 수 있나요?",
      blocks: [
        {
          t: "table",
          table: {
            caption: "예치금별 1순위로 신청할 수 있는 최대 면적",
            head: ["통장 예치금", ...Object.values(REGION_NAME)],
            rows: [200, 250, 300, 400, 500, 600, 700, 1000, 1500].map((amt) => [
              `${amt.toLocaleString("ko-KR")}만 원`,
              ...(Object.keys(DEP) as (keyof typeof DEP)[]).map((c) => areaFor(c, amt)),
            ]),
          },
        },
      ],
    },
    {
      id: "rules",
      h2: "예치금은 사는 곳과 공고일 잔액으로 따져요",
      blocks: [
        {
          t: "ul",
          items: [
            "단지가 있는 곳이 아니라 신청자가 사는 곳(주민등록)으로 따져요. 경기도에 사는 사람이 서울 단지에 넣어도 경기 기준 금액을 써요.",
            "입주자 모집공고일 기준 잔액이 금액 이상이어야 해요. 공고가 난 뒤에 채워 넣으면 인정되지 않아요.",
            "예치금은 민영주택 기준이에요. 공공분양(국민주택)은 예치금이 아니라 납입 횟수·저축 총액으로 봐요.",
            "금액이 모자라면 1순위가 아니라 2순위로 신청해요.",
          ],
        },
      ],
    },
  ],
  faq: [
    {
      q: "큰 면적으로 바꾸려면 언제까지 예치금을 채워야 하나요?",
      a: "넣으려는 단지의 입주자 모집공고일까지 해당 면적 금액 이상이 되어야 해요. 공고가 난 뒤에 더 넣어도 그 공고에서는 인정되지 않아요.",
    },
    {
      q: "인천에 살면 예치금이 얼마인가요?",
      a: `인천은 기타 광역시라 85㎡ 이하 ${DEP.metro["85"]}만 원, 102㎡ 이하 ${DEP.metro["102"]}만 원, 135㎡ 이하 ${DEP.metro["135"]}만 원, 모든 면적 ${DEP.metro.all.toLocaleString("ko-KR")}만 원이에요.`,
    },
    {
      q: "공공분양도 예치금을 보나요?",
      a: "보지 않아요. 공공분양(국민주택)은 가입 기간과 납입 횟수로 1순위를 정하고, 같은 순위 안에서는 저축 총액이나 납입 횟수가 많은 순으로 뽑아요.",
    },
  ],
  sources: [SRC.depositTable, SRC.supplyRule, SRC.applyhomeCalc],
  related: ["first-rank", "gajeom", "private-apt"],
  published: PUBLISHED,
  updated: UPDATED,
};

/* ───────────────────────── 가점 ───────────────────────── */

const homelessRows = [["1년 미만", 2], ...Array.from({ length: 14 }, (_, i) => [`${i + 1}년 이상 ~ ${i + 2}년 미만`, homelessPoints(i + 1)]), ["15년 이상", 32]] as [string, number][];
const depRows = [0, 1, 2, 3, 4, 5, 6].map((d) => [d === 6 ? "6명 이상" : `${d}명`, dependentPoints(d)] as [string, number]);
const accRows: [string, number][] = [
  ["6개월 미만", accountPoints(3)],
  ["6개월 이상 ~ 1년 미만", accountPoints(6)],
  ...Array.from({ length: 14 }, (_, i) => [`${i + 1}년 이상 ~ ${i + 2}년 미만`, accountPoints((i + 1) * 12)] as [string, number]),
  ["15년 이상", 17],
];

export const gajeomGuide: Guide = {
  slug: "gajeom",
  category: "기준표",
  short: "가점 계산기",
  title: "청약 가점 계산기 — 84점 점수표",
  description:
    "무주택기간 32점·부양가족 35점·통장 17점, 민영주택 청약 가점 84점을 바로 계산해 보세요. 만 30세 기산과 배우자 통장 합산(최대 3점) 규칙, 전체 점수표도 함께 볼 수 있어요.",
  h1: "청약 가점 계산기 (84점 만점 점수표)",
  answer:
    "민영주택 청약 가점은 무주택기간(최대 32점)·부양가족 수(최대 35점)·청약통장 가입기간(최대 17점)을 더한 84점 만점이고, 무주택기간은 만 30세(그 전에 혼인했다면 혼인신고일)부터 따져요. 만 30세 전 미혼 무주택자와 집이 있는 사람은 무주택기간 점수가 0점이에요.",
  facts: ["무주택 32점", "부양가족 35점", "통장 17점"],
  sections: [
    { id: "calculator", h2: "내 청약 가점은 몇 점인가요?", blocks: [{ t: "calc" }] },
    {
      id: "homeless",
      h2: "무주택기간 점수 (최대 32점)",
      blocks: [
        {
          t: "p",
          text: "만 30세가 된 날과 혼인신고일(만 30세 전에 결혼한 경우) 중 빠른 날부터, 신청자와 배우자가 계속 무주택인 기간을 따져요. 집을 처분했다면 가장 최근에 무주택이 된 날부터예요.",
        },
        {
          t: "table",
          table: { id: "homeless", caption: "무주택기간 점수", head: ["무주택기간", "점수"], rows: homelessRows.map(([k, v]) => [k, `${v}점`]) },
        },
      ],
    },
    {
      id: "dependents",
      h2: "부양가족 점수는 누구까지 셀 수 있나요? (최대 35점)",
      blocks: [
        {
          t: "ul",
          items: [
            "배우자(세대를 나눠 사는 배우자 포함)",
            "본인·배우자의 직계존속 — 3년 이상 같은 주민등록에 올라 있어야 하고, 집이 있으면 빠져요.",
            "미혼 자녀 — 만 30세 이상이면 1년 이상 같은 주민등록에 올라 있어야 해요.",
            "신청자 본인은 세지 않아요.",
          ],
        },
        { t: "table", table: { id: "dependents", caption: "부양가족 점수", head: ["부양가족 수", "점수"], rows: depRows.map(([k, v]) => [k, `${v}점`]) } },
      ],
    },
    {
      id: "account",
      h2: "청약통장 가입기간 점수 (최대 17점)",
      blocks: [
        {
          t: "p",
          text: "배우자의 청약통장 가입기간도 점수의 50%를 최대 3점까지 더할 수 있어요(2024년 3월 25일부터). 본인 점수와 합쳐도 17점을 넘지 않아요. 미성년자 때 가입한 기간은 최대 5년까지 인정해요(개정 전 기간은 2년까지).",
        },
        { t: "table", table: { id: "account", caption: "청약통장 가입기간 점수", head: ["가입기간", "점수"], rows: accRows.map(([k, v]) => [k, `${v}점`]) } },
      ],
    },
    {
      id: "ratio",
      h2: "가점제·추첨제 비율은 지역과 면적마다 달라요",
      blocks: [
        {
          t: "p",
          text: "1순위 안에서 경쟁이 생기면 전용면적과 규제지역 여부에 따라 일부는 가점 순으로, 나머지는 추첨으로 뽑아요. 가점이 같으면 가입기간이 긴 사람이 먼저이고, 그래도 같으면 추첨해요.",
        },
        {
          t: "table",
          table: {
            id: "ratio",
            caption: "1순위 가점제·추첨제 비율",
            head: ["지역", "60㎡ 이하", "60~85㎡", "85㎡ 초과"],
            wrap: true,
            rows: [
              ["투기과열지구", gajeomRatio({ regulation: { speculative: true, adjusted: true } }, 59), gajeomRatio({ regulation: { speculative: true, adjusted: true } }, 84), gajeomRatio({ regulation: { speculative: true, adjusted: true } }, 100)],
              ["조정대상지역", gajeomRatio({ regulation: { speculative: false, adjusted: true } }, 59), gajeomRatio({ regulation: { speculative: false, adjusted: true } }, 84), gajeomRatio({ regulation: { speculative: false, adjusted: true } }, 100)],
              ["그 밖의 지역", gajeomRatio({}, 59), gajeomRatio({}, 84), gajeomRatio({}, 100)],
            ],
          },
        },
      ],
    },
  ],
  faq: [
    { q: "만 29세 미혼 무주택자는 무주택기간 점수가 몇 점인가요?", a: "0점이에요. 미혼이면 만 30세가 된 날부터 무주택기간을 따져요. 만 30세 전에 결혼했다면 혼인신고일부터예요." },
    { q: "부모님과 같이 살면 부양가족으로 셀 수 있나요?", a: "부모님(직계존속)이 3년 이상 계속 같은 주민등록에 올라 있고 집이 없어야 셀 수 있어요. 부모님 중 한 분이라도 집이 있으면 그분은 부양가족에서 빠져요." },
    { q: "공공분양도 가점으로 뽑나요?", a: "아니요. 공공분양(국민주택) 일반공급은 가점제가 아니라 순차제로 뽑아요. 전용 40㎡ 초과는 저축 총액(월 25만 원까지 인정), 40㎡ 이하는 납입 횟수가 많은 순이에요." },
  ],
  sources: [SRC.supplyRule, SRC.applyhomeCalc],
  related: ["deposit", "first-rank", "private-apt"],
  published: PUBLISHED,
  updated: UPDATED,
};

/* ───────────────────────── 1순위 ───────────────────────── */

export const firstRankGuide: Guide = {
  slug: "first-rank",
  category: "기준표",
  short: "1순위 조건",
  title: "청약 1순위 조건 — 민영·국민주택",
  description:
    "청약 1순위는 가입기간(규제지역 24개월·수도권 12개월·그 외 6개월)과 예치금 또는 납입 횟수로 정해져요. 민영주택과 국민주택(공공분양)의 1순위 요건과 규제지역 추가 요건을 표로 정리했어요.",
  h1: "청약 1순위 조건 (민영주택·국민주택)",
  answer:
    "청약 1순위는 통장 가입기간(투기과열·청약과열 24개월, 수도권 12개월, 그 밖 6개월)을 채우고, 민영주택은 지역·면적별 예치금, 국민주택은 같은 횟수의 납입을 채우면 돼요. 규제지역에서는 세대주이면서 5년 안에 세대원 모두 당첨된 적이 없어야 하고, 민영주택은 2주택 이상 세대가 아니어야 해요.",
  facts: ["규제지역 24개월", "수도권 12개월", "그 밖 6개월"],
  sections: [
    {
      id: "table",
      h2: "민영주택·국민주택 1순위 요건 비교",
      blocks: [
        {
          t: "table",
          table: {
            id: "table",
            caption: "청약 1순위 요건",
            head: ["지역", "민영주택", "국민주택(공공분양)"],
            wrap: true,
            rows: [
              ["투기과열지구·청약과열지역", "가입 24개월 + 예치금, 세대주, 5년 내 당첨 없음, 2주택 이상 세대 아님", "가입 24개월 + 24회 납입, 세대주, 무주택세대구성원, 5년 내 당첨 없음"],
              ["수도권(서울·인천·경기)", "가입 12개월 + 예치금", "가입 12개월 + 12회 납입"],
              ["그 밖의 지역", "가입 6개월 + 예치금", "가입 6개월 + 6회 납입"],
            ],
            note: "수도권은 시·도지사가 24개월까지, 비수도권은 12개월까지 늘려 공고할 수 있어요. 위축지역은 1개월이에요.",
          },
        },
      ],
    },
    {
      id: "regulated",
      h2: "규제지역인지는 어떻게 확인하나요?",
      blocks: [
        {
          t: "p",
          text: "규제지역은 국토교통부가 지정·해제하기 때문에 자주 바뀌어요. 2025년 10월 15일 발표로 서울 25개 구 전체와 경기 12개 시·구가 투기과열지구·조정대상지역으로 지정됐어요. 단지가 규제지역인지는 입주자 모집공고문 첫머리에 적혀 있으니, 신청 전에 꼭 확인하세요.",
        },
      ],
    },
    {
      id: "second",
      h2: "1순위가 아니어도 2순위로 신청할 수 있어요",
      blocks: [
        {
          t: "p",
          text: "1순위 조건을 채우지 못해도 청약통장이 있으면 2순위로 신청할 수 있어요. 다만 1순위에서 공급 물량이 다 차면 2순위까지 기회가 오지 않아요. 2순위 안에서는 추첨으로 뽑아요.",
        },
      ],
    },
  ],
  faq: [
    { q: "세대원도 1순위가 될 수 있나요?", a: "비규제지역에서는 세대원도 1순위가 될 수 있어요. 투기과열지구·청약과열지역에서는 세대주만 1순위예요." },
    { q: "통장 가입기간은 언제까지 채워야 하나요?", a: "입주자 모집공고일을 기준으로 가입기간과 예치금(또는 납입 횟수)을 모두 채워야 해요." },
  ],
  sources: [SRC.supplyRule, SRC.regulation, SRC.depositTable],
  related: ["deposit", "gajeom", "private-apt", "public-sale"],
  published: PUBLISHED,
  updated: UPDATED,
};

export const TABLE_GUIDES = [incomeGuide, assetsGuide, depositGuide, gajeomGuide, firstRankGuide];
