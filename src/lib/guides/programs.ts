import { manwon } from "@/lib/rules/core";
import { INCOME, limitFor, won, type IncomeKey } from "@/lib/rules/criteria";
import { SRC } from "./sources";
import { PUBLISHED, STD, UPDATED, limitWon } from "./tables";
import type { Guide, GuideTable } from "./types";

const Y = STD.year;
const A = STD.assets;

/** 가구원수별 소득 상한 표(유형 페이지용 — 원본 표는 /guide/income) */
function limitTable(caption: string, rows: { label: string; key: IncomeKey; dual?: boolean }[], sizes = [1, 2, 3, 4]): GuideTable {
  return {
    caption,
    head: ["대상", ...sizes.map((s) => `${s}인 가구`)],
    rows: rows.map((r) => [
      r.label,
      ...sizes.map((s) => {
        const l = limitFor(STD, s, INCOME[r.key], r.dual);
        return `${won(l.won)} (${l.pct}%)`;
      }),
    ]),
    note: "세전 월소득 기준이에요. 100% 기준 금액은 소득 기준표(/guide/income)에서 볼 수 있어요.",
  };
}

/* ───────────────────────── 행복주택 ───────────────────────── */

export const happyGuide: Guide = {
  slug: "happy-housing",
  category: "주택 유형",
  short: "행복주택",
  program: "happy",
  title: `행복주택 자격 조건 ${Y} — 소득·자산·순위`,
  description: `행복주택 청년 계층은 만 19~39세 미혼 무주택자가 신청해요. 소득은 100% 이하이고, 1인 가구는 120%(월 ${limitWon("happyYouth", 1)})까지 돼요. 총자산은 ${manwon(A.happyYouth)} 이하여야 해요.`,
  h1: `행복주택 자격 조건 (${Y}년 기준)`,
  answer: `행복주택 청년 계층은 만 19~39세 미혼 무주택자가 신청할 수 있어요. 소득은 도시근로자 월평균소득 100% 이하이고, 1인 가구는 120%(${Y}년 월 ${limitWon("happyYouth", 1)})까지 돼요. 총자산은 ${manwon(A.happyYouth)}, 자동차는 ${manwon(A.car)} 이하여야 해요. 신혼부부 계층은 예비부부와 한부모를 포함해 혼인 7년 이내 무주택 세대가 대상이에요. 소득은 100%(맞벌이 120%) 이하, 총자산은 ${manwon(A.rentGeneral)} 이하가 기준이에요.`,
  facts: ["만 19~39세", "소득 100%(1인 120%)", `자산 ${manwon(A.happyYouth)}`],
  sections: [
    {
      id: "groups",
      h2: "행복주택 계층별 자격 한눈에",
      blocks: [
        {
          t: "table",
          table: {
            caption: `${Y}년 행복주택 계층별 자격`,
            head: ["계층", "나이·신분", "무주택", "소득", "자산 · 자동차"],
            wrap: true,
            rows: [
              ["청년", "만 19~39세 미혼(소득 있는 업무 5년 이내·예술인 포함)", "본인", "100% (1인 120%, 2인 110%)", `${manwon(A.happyYouth)} · ${manwon(A.car)}`],
              ["대학생", "재학·입학 예정·졸업 2년 이내, 미혼", "본인", "본인+부모 100%", `${manwon(A.happyStudent)} · 보유 불가`],
              ["신혼부부·한부모", "혼인 7년 이내·예비부부 또는 6세 이하 자녀", "세대", "100% (맞벌이 120%)", `${manwon(A.rentGeneral)} · ${manwon(A.car)}`],
              ["고령자", "만 65세 이상", "세대", "100% (1인 120%, 2인 110%)", `${manwon(A.rentGeneral)} · ${manwon(A.car)}`],
              ["주거급여 수급자", "주거급여 수급 가구", "세대", "보지 않음", `${manwon(A.rentGeneral)} · ${manwon(A.car)}`],
            ],
          },
        },
      ],
    },
    {
      id: "income",
      h2: "행복주택 소득 기준은 가구원수마다 달라요",
      blocks: [
        {
          t: "table",
          table: limitTable(`${Y}년 행복주택 소득 상한`, [
            { label: "청년·고령자", key: "happyYouth" },
            { label: "신혼부부(외벌이)", key: "happyNewlywed" },
            { label: "신혼부부(맞벌이)", key: "happyNewlywed", dual: true },
          ]),
        },
      ],
    },
    {
      id: "rank",
      h2: "행복주택 순위는 어떻게 정하나요?",
      blocks: [
        {
          t: "ul",
          items: [
            "1순위: 단지가 있는 시·군·구나 붙어 있는(연접) 시·군·구에 사는 사람이에요. 대학생은 학교 소재지, 청년은 직장 소재지도 인정돼요.",
            "2순위: 같은 시·도에 사는 사람이에요. 수도권은 수도권 전체를 같은 지역으로 봐요.",
            "3순위: 그 밖의 지역에 사는 사람이에요.",
            "같은 순위 안에서는 추첨으로 뽑아요. 물량의 80%는 청년, 대학생, 신혼부부에게 공급해요. 나머지 20%는 고령자와 주거급여 수급자 몫이에요.",
          ],
        },
      ],
    },
    {
      id: "stay",
      h2: "임대료와 거주 기간",
      blocks: [
        {
          t: "p",
          text: "임대료는 주변 시세의 60~80% 수준이에요. 청년과 대학생은 6년까지 살 수 있어요. 신혼부부도 6년이지만, 자녀가 있으면 10년까지 돼요. 고령자와 주거급여 수급자는 20년까지 살아요. 세부 기간은 공고문에서 확인하세요.",
        },
      ],
    },
  ],
  faq: [
    { q: "결혼을 앞둔 예비부부도 신혼부부 계층으로 신청할 수 있나요?", a: "네. 입주 전까지 혼인신고를 할 예비부부는 신혼부부 계층으로 신청할 수 있어요. 소득·자산은 예비 배우자와 합쳐서 봐요." },
    { q: "부모님 집에 같이 살아도 청년 계층은 무주택인가요?", a: "청년 계층은 본인만 무주택이면 돼요. 부모님 명의의 집이 있어도 신청할 수 있어요." },
    { q: "만 39세 생일이 모집공고일과 가까우면 어떻게 되나요?", a: "나이는 입주자 모집공고일 기준 만 나이로 봐요. 공고일에 만 39세 이하이면 청년 계층으로 신청할 수 있어요." },
  ],
  sources: [SRC.publicRule, SRC.myhomeGuide, SRC.lhApply],
  related: ["income", "assets", "youth-safe-housing", "national-rental"],
  published: PUBLISHED,
  updated: UPDATED,
};

/* ───────────────────────── 국민임대 ───────────────────────── */

export const nationalGuide: Guide = {
  slug: "national-rental",
  category: "주택 유형",
  short: "국민임대",
  program: "national",
  title: `국민임대 자격 조건 ${Y} — 순위·배점`,
  description: `국민임대는 소득 70% 이하, 총자산 ${manwon(A.rentGeneral)} 이하인 무주택 세대가 신청해요. 전용 60㎡ 초과 주택은 소득 100%까지 되고, 1인 가구는 20%p를 더해요. 순위는 전용 50㎡ 미만이면 거주지로, 50㎡ 이상이면 청약통장 납입 횟수로 정해요.`,
  h1: `국민임대주택 자격 조건 (${Y}년 기준)`,
  answer: `국민임대주택은 세대원 모두 무주택이면 신청할 수 있어요. 소득은 도시근로자 월평균소득 70% 이하이고, 전용 60㎡ 초과 주택은 100%까지 봐요. 1인 가구는 20%p, 2인 가구는 10%p를 더해요. 총자산은 ${manwon(A.rentGeneral)}, 자동차는 ${manwon(A.car)} 이하여야 해요. 순위는 전용 50㎡ 미만이면 거주지로, 50㎡ 이상이면 청약통장 납입 횟수로 정해요.`,
  facts: ["소득 70%", `자산 ${manwon(A.rentGeneral)}`, "최장 30년"],
  sections: [
    {
      id: "income",
      h2: "국민임대 소득 기준은 가구원수별로 얼마인가요?",
      blocks: [
        {
          t: "table",
          table: limitTable(`${Y}년 국민임대 소득 상한`, [
            { label: "전용 60㎡ 이하", key: "nationalSmall" },
            { label: "전용 60㎡ 초과", key: "nationalLarge" },
          ]),
        },
        { t: "p", text: "전용 50㎡ 미만은 소득 50% 이하 가구에 먼저 공급하고, 남으면 70% 이하까지 넓혀요." },
      ],
    },
    {
      id: "rank",
      h2: "국민임대 순위는 전용 50㎡를 기준으로 갈려요",
      blocks: [
        {
          t: "table",
          table: {
            caption: "국민임대 순위",
            head: ["순위", "전용 50㎡ 미만", "전용 50㎡ 이상"],
            wrap: true,
            rows: [
              ["1순위", "단지가 있는 시·군·구 거주", "청약통장 24회 이상 납입"],
              ["2순위", "붙어 있는(연접) 시·군·구 거주", "청약통장 6회 이상 납입"],
              ["3순위", "그 밖의 지역", "그 밖"],
            ],
          },
        },
      ],
    },
    {
      id: "score",
      h2: "같은 순위면 누가 먼저 되나요? (배점표)",
      blocks: [
        { t: "p", text: "같은 순위 안에서는 미성년 자녀가 3명 이상인 가구를 먼저 뽑고, 그다음은 배점이 높은 순이에요. 항목마다 최대 3점이에요." },
        {
          t: "table",
          table: {
            caption: "국민임대 동순위 배점",
            head: ["항목", "3점", "2점", "1점"],
            wrap: true,
            rows: [
              ["세대주 나이", "50세 이상", "40세 이상", "30세 이상"],
              ["부양가족 수", "3명 이상", "2명", "1명"],
              ["해당 지역 거주기간", "5년 이상", "3~5년", "1~3년"],
              ["65세 이상 직계존속 1년 이상 부양", "해당", "—", "—"],
              ["미성년 자녀 수", "3명 이상", "2명", "—"],
              ["청약통장 납입 횟수", "60회 이상", "48회 이상", "36회 이상"],
            ],
            note: "중소기업 제조업 근로자·사회취약계층 같은 가점 항목과 과거 계약 이력에 따른 감점은 공고마다 달라요.",
          },
        },
      ],
    },
  ],
  faq: [
    { q: "청약통장이 없어도 국민임대를 신청할 수 있나요?", a: "신청할 수 있어요. 다만 전용 50㎡ 이상은 통장 납입 횟수로 순위를 매겨서, 통장이 없으면 3순위가 돼요. 50㎡ 미만은 통장과 상관없이 거주지로 순위를 정해요." },
    { q: "국민임대는 얼마나 오래 살 수 있나요?", a: "자격을 유지하면 최장 30년까지 살 수 있어요. 2년마다 재계약할 때 소득·자산 기준을 다시 확인해요." },
  ],
  sources: [SRC.publicRule, SRC.myhomeGuide, SRC.lhApply],
  related: ["income", "assets", "integrated-rental", "permanent-rental"],
  published: PUBLISHED,
  updated: UPDATED,
};

/* ───────────────────────── 영구임대 ───────────────────────── */

export const permanentGuide: Guide = {
  slug: "permanent-rental",
  category: "주택 유형",
  short: "영구임대",
  program: "permanent",
  title: `영구임대주택 신청 자격 ${Y}`,
  description: `영구임대는 기초생활수급자, 한부모가족, 장애인, 국가유공자 등이 1순위예요. 2순위는 소득 50% 이하인 무주택 세대이고, 1인 가구는 70%(월 ${limitWon("permanentTier2", 1)})까지 돼요.`,
  h1: `영구임대주택 신청 자격 (${Y}년 기준)`,
  answer: `영구임대주택 1순위는 기초생활수급자, 한부모가족, 장애인, 국가유공자 같은 주거취약계층이에요. 2순위는 소득이 도시근로자 월평균소득 50% 이하인 무주택 세대예요. 1인 가구는 70%(${Y}년 월 ${limitWon("permanentTier2", 1)})까지 돼요. 순위를 정한 뒤 지자체가 입주자를 선정해요.`,
  facts: ["수급자 등 1순위", "소득 50% 2순위", "지자체 선정"],
  pending: `영구임대 총자산 기준(${manwon(A.permanent)})은 고시 원문과 한 번 더 맞춰 보는 중이에요. 신청 전에 공고문 숫자를 꼭 확인하세요.`,
  sections: [
    {
      id: "rank",
      h2: "영구임대 1순위와 2순위는 누구인가요?",
      blocks: [
        {
          t: "ul",
          items: [
            "1순위: 기초생활수급자, 국가유공자, 장애인, 한부모가족, 북한이탈주민 등 법령이 정한 계층이에요. 국가유공자와 장애인은 소득 70% 이하 같은 조건이 붙어요.",
            `2순위: 소득 50% 이하인 무주택 세대예요. 1인 가구는 70%(월 ${limitWon("permanentTier2", 1)}), 2인 가구는 60%(월 ${limitWon("permanentTier2", 2)})까지 돼요.`,
            `자산: 총자산 ${manwon(A.permanent)}, 자동차 ${manwon(A.car)} 이하예요. 총자산 값은 신청 전에 공고문 숫자로 한 번 더 확인하세요.`,
          ],
        },
      ],
    },
    {
      id: "process",
      h2: "영구임대 신청과 선정 절차",
      blocks: [
        {
          t: "p",
          text: "신청은 주민등록지 읍·면·동 주민센터에서 해요. 지자체가 자격을 확인해 순위와 배점을 매긴 뒤, LH나 지방공사 같은 공급기관에 명단을 넘겨요. 대기자로 등록되면 빈집이 생기는 순서대로 입주해요. 세부 배점은 지역과 공고마다 달라요.",
        },
      ],
    },
  ],
  faq: [
    { q: "차상위계층도 영구임대를 신청할 수 있나요?", a: "공고에 따라 차상위계층을 1순위 계층에 넣기도 해요. 해당 공고의 신청 자격 항목을 확인하세요. 1순위에 들지 않아도 소득 50% 이하 무주택 세대라면 2순위로 신청할 수 있어요." },
  ],
  sources: [SRC.publicRule, SRC.myhomeGuide],
  related: ["purchase-rental", "national-rental", "income"],
  published: PUBLISHED,
  updated: UPDATED,
};

/* ───────────────────────── 통합공공임대 ───────────────────────── */

export const integratedGuide: Guide = {
  slug: "integrated-rental",
  category: "주택 유형",
  short: "통합공공임대",
  program: "integrated",
  title: `통합공공임대 자격 ${Y} — 중위소득 150%`,
  description: `통합공공임대는 기준 중위소득 150% 이하인 무주택 세대가 신청해요. 1인 가구는 170%(월 ${limitWon("integrated", 1)})까지 돼요. 신혼부부 맞벌이는 180%까지 봐요.`,
  h1: `통합공공임대주택 자격 (${Y}년 기준)`,
  answer: `통합공공임대주택은 세대원 모두 무주택이면 신청할 수 있어요. 소득은 기준 중위소득 150% 이하이고, 1인 가구는 170%(${Y}년 월 ${limitWon("integrated", 1)}), 2인 가구는 160%까지 돼요. 총자산은 ${manwon(A.rentGeneral)}, 자동차는 ${manwon(A.car)} 이하여야 해요. 신혼부부 맞벌이는 소득 180%까지 봐요. 청년 계층은 만 18~39세 미혼이고 본인만 무주택이면 돼요.`,
  facts: ["중위소득 150%", "1인 170%", `자산 ${manwon(A.rentGeneral)}`],
  sections: [
    {
      id: "income",
      h2: "통합공공임대 가구원수별 소득 상한",
      blocks: [
        {
          t: "table",
          table: limitTable(`${Y}년 통합공공임대 소득 상한 (기준 중위소득)`, [
            { label: "일반·청년", key: "integrated" },
            { label: "신혼부부(맞벌이)", key: "integratedNewlywed", dual: true },
          ]),
        },
        { t: "p", text: "통합공공임대는 소득이 낮을수록 임대료도 낮아지는 구조예요. 구간별 임대료율은 공고문에서 확인하세요." },
      ],
    },
    {
      id: "selection",
      h2: "통합공공임대는 어떻게 뽑나요?",
      blocks: [
        {
          t: "ul",
          items: [
            "우선공급(약 60%): 배점 순으로 뽑아요. 청년, 신혼부부, 고령자 등 대상별로 나눠 공급해요.",
            "일반공급: 2세 미만 자녀가 있는 가구에 5%를 먼저 배정해요. 나머지는 소득 구간별로 나눠 추첨해요. 중위소득 50% 이하에 45%, 50~100%에 30%, 100% 초과에 15% 이상이 돌아가요.",
          ],
        },
        {
          t: "table",
          table: {
            caption: "우선공급 배점 (항목별 최대 3점)",
            head: ["항목", "3점", "2점", "1점"],
            wrap: true,
            rows: [
              ["소득(중위소득 대비)", "50% 이하", "70% 이하", "100% 이하"],
              ["부양가족 수", "3명 이상", "2명", "1명"],
              ["해당 시·군·구 거주기간", "5년 이상", "3~5년", "1~3년"],
              ["미성년 자녀 수", "3명 이상", "2명", "1명"],
              ["청약통장 납입 횟수", "24회 이상", "12회 이상", "6회 이상"],
            ],
            note: "단독세대주는 부양가족과 자녀 항목을 적용하지 않아요. 과거에 공공임대를 계약한 적이 있으면 감점돼요. 1년 이내면 -5점, 3년 이내면 -3점이에요.",
          },
        },
      ],
    },
  ],
  faq: [
    { q: "통합공공임대는 왜 도시근로자 소득이 아니라 중위소득을 쓰나요?", a: "영구임대, 국민임대, 행복주택을 하나로 합친 새 유형이라서예요. 복지 제도와 같은 기준 중위소득을 써서 대상을 넓게 잡았어요. 같은 소득이어도 행복주택보다 기준 %가 높게 보이는 건 이 때문이에요." },
  ],
  sources: [SRC.publicRule, SRC.myhomeGuide],
  related: ["income", "national-rental", "happy-housing"],
  published: PUBLISHED,
  updated: UPDATED,
};

/* ───────────────────────── 매입임대 ───────────────────────── */

export const purchaseGuide: Guide = {
  slug: "purchase-rental",
  category: "주택 유형",
  short: "매입임대",
  program: "purchase",
  title: `매입임대 자격 ${Y} — 청년·신혼부부`,
  description: `매입임대 청년은 만 19~39세 미혼 무주택자가 신청해요. 수급자 등이 1순위, 본인과 부모 소득이 100% 이하면 2순위, 본인 소득만 100% 이하면 3순위예요. 신혼·신생아 Ⅰ형은 소득 70%(맞벌이 90%)가 기준이에요.`,
  h1: `매입임대주택 자격 (${Y}년 기준)`,
  answer: `청년 매입임대는 대학생과 취업준비생을 포함해 만 19~39세 미혼 무주택자가 신청해요. 수급자, 차상위계층, 한부모가족은 1순위예요. 본인과 부모 소득이 100% 이하면 2순위예요. 본인 소득만 100% 이하면 3순위이고, 이때 총자산은 ${manwon(A.happyYouth)} 이하여야 해요. 신혼·신생아 Ⅰ형은 무주택 세대로 소득 70%(맞벌이 90%) 이하가 기준이에요.`,
  facts: ["만 19~39세", "수급자 등 1순위", "통장 불필요"],
  sections: [
    {
      id: "youth",
      h2: "청년 매입임대 1~3순위",
      blocks: [
        {
          t: "table",
          table: {
            caption: "청년 매입임대 순위",
            head: ["순위", "대상", "소득·자산"],
            wrap: true,
            rows: [
              ["1순위", "생계·의료·주거급여 수급자, 차상위계층, 한부모가족 청년", "—"],
              ["2순위", "본인과 부모 모두", `소득 100% 이하 · 국민임대 자산 기준(${manwon(A.rentGeneral)})`],
              ["3순위", "본인", `소득 100% 이하(1인 ${limitWon("purchaseYouthTier3", 1)}) · 총자산 ${manwon(A.happyYouth)}`],
            ],
          },
        },
      ],
    },
    {
      id: "newlywed",
      h2: "신혼·신생아 매입임대는 소득이 얼마까지인가요?",
      blocks: [
        {
          t: "table",
          table: limitTable(`${Y}년 신혼·신생아 매입임대 Ⅰ형 소득 상한`, [
            { label: "외벌이", key: "purchaseNewlywedI" },
            { label: "맞벌이", key: "purchaseNewlywedI", dual: true },
          ], [2, 3, 4]),
        },
        {
          t: "ul",
          items: [
            "대상: 혼인 7년 이내 신혼부부와 예비부부, 한부모가족, 6세 이하 자녀를 둔 가구예요.",
            "순위: 신생아(2세 이하 자녀) 가구와 한부모 → 자녀가 있는 신혼부부 → 자녀가 없는 신혼·예비부부 → 자녀가 있는 혼인 가구 순이에요.",
            "Ⅱ형은 소득 100%(맞벌이 120%) 이하까지 넓어져요. 대신 임대료가 더 높아요.",
          ],
        },
      ],
    },
    {
      id: "what",
      h2: "매입임대는 어떤 집인가요?",
      blocks: [
        {
          t: "p",
          text: "LH나 지방공사가 도심의 다가구주택, 다세대주택, 오피스텔 등을 사들여 시세보다 낮은 임대료로 빌려주는 집이에요. 청약통장 없이 신청할 수 있어요. 임대료 수준과 거주 기간은 계층과 유형마다 달라요. 공고문에서 확인하세요.",
        },
      ],
    },
  ],
  faq: [
    { q: "대학생도 청년 매입임대를 신청할 수 있나요?", a: "네. 대학생과 취업준비생도 청년 계층으로 신청할 수 있어요. 부모님 소득까지 기준 이하면 2순위가 돼요." },
  ],
  sources: [SRC.publicRule, SRC.myhomeGuide],
  related: ["jeonse-rental", "happy-housing", "income"],
  published: PUBLISHED,
  updated: UPDATED,
};

/* ───────────────────────── 전세임대 ───────────────────────── */

export const jeonseGuide: Guide = {
  slug: "jeonse-rental",
  category: "주택 유형",
  short: "전세임대",
  program: "jeonse",
  title: `전세임대 자격 ${Y} — 청년·신혼 Ⅱ형`,
  description: `전세임대는 직접 구한 전셋집을 LH가 계약해 다시 빌려주는 방식이에요. 신혼·신생아 Ⅱ형은 소득 130%(맞벌이 200%), 총자산 ${manwon(A.newhome)} 이하가 기준이에요. 청년은 매입임대와 같은 순위를 써요.`,
  h1: `전세임대주택 자격 (${Y}년 기준)`,
  answer: `전세임대는 입주자가 직접 고른 전셋집을 LH가 집주인과 계약한 뒤 싸게 다시 빌려주는 공공임대예요. 신혼·신생아 Ⅱ형은 무주택 세대가 신청할 수 있어요. 소득은 130%(맞벌이 200%) 이하, 총자산은 ${manwon(A.newhome)} 이하여야 해요. 청년은 매입임대와 같은 1~3순위 기준을 써요.`,
  facts: ["직접 구한 집", "신혼 Ⅱ 130%", `자산 ${manwon(A.newhome)}`],
  sections: [
    {
      id: "how",
      h2: "집은 내가 구하고, 계약은 LH가 해요",
      blocks: [
        {
          t: "ul",
          items: [
            "입주 대상자로 선정되면 지원 한도 안에서 조건에 맞는 전셋집을 직접 찾아요.",
            "LH가 집주인과 전세계약을 맺어요. 입주자는 보증금 일부와 LH 지원금 이자 수준의 월 임대료를 내요.",
            "지원 한도와 본인 부담 비율은 지역, 유형, 공고마다 달라요.",
          ],
        },
      ],
    },
    {
      id: "income",
      h2: "신혼·신생아 전세임대 Ⅱ형 소득 기준은 얼마인가요?",
      blocks: [
        {
          t: "table",
          table: limitTable(`${Y}년 신혼·신생아 전세임대 Ⅱ형 소득 상한`, [
            { label: "외벌이", key: "jeonseNewlywedII" },
            { label: "맞벌이", key: "jeonseNewlywedII", dual: true },
          ], [2, 3, 4]),
        },
      ],
    },
  ],
  faq: [
    { q: "전세임대 집은 아무 집이나 고를 수 있나요?", a: "보증금이 지원 한도 안이어야 해요. 주택 유형, 면적, 부채 비율 같은 LH 기준도 통과해야 해요. 집주인도 LH와 계약하는 데 동의해야 해요." },
  ],
  sources: [SRC.publicRule, SRC.myhomeGuide],
  related: ["purchase-rental", "deundeun-jeonse", "income"],
  published: PUBLISHED,
  updated: UPDATED,
};

/* ───────────────────────── 청년안심주택 ───────────────────────── */

export const youthSafeGuide: Guide = {
  slug: "youth-safe-housing",
  category: "주택 유형",
  short: "청년안심주택",
  program: "youthSafe",
  title: `청년안심주택 자격 ${Y} — 서울 역세권`,
  description: `서울 청년안심주택 청년형은 만 19~39세 미혼 무주택자가 신청해요. 특별공급은 소득 120%(1인 월 ${limitWon("youthSafe", 1)}) 이하, 본인 자산 ${manwon(A.happyYouth)} 이하가 기준이에요. 소득 기준을 넘으면 일반공급으로 신청해요.`,
  h1: `서울 청년안심주택 자격 (${Y}년 기준)`,
  answer: `서울 청년안심주택 청년형은 만 19~39세 미혼이고 본인이 무주택이면 신청할 수 있어요. 특별공급은 소득이 도시근로자 월평균소득 120% 이하여야 해요. ${Y}년 1인 가구 기준으로 월 ${limitWon("youthSafe", 1)}이에요. 본인 자산 기준은 ${manwon(A.happyYouth)} 이하예요. 소득 기준을 넘으면 추첨으로 뽑는 일반공급으로만 신청해요.`,
  facts: ["만 19~39세", "특공 소득 120%", "역세권"],
  sections: [
    {
      id: "types",
      h2: "청년형·신혼부부형 특별공급 기준",
      blocks: [
        {
          t: "table",
          table: {
            caption: `${Y}년 청년안심주택 특별공급 기준`,
            head: ["구분", "대상", "무주택", "소득", "자산"],
            wrap: true,
            rows: [
              ["청년형", "만 19~39세 미혼", "본인", `120% (1인 ${limitWon("youthSafe", 1)})`, `본인 ${manwon(A.happyYouth)} · 차 ${manwon(A.car)}`],
              ["신혼부부형", "혼인 7년 이내", "세대", "120%", `${manwon(A.rentGeneral)} · 차 ${manwon(A.car)}`],
            ],
          },
        },
      ],
    },
    {
      id: "how",
      h2: "청년안심주택은 어디서 보고 신청하나요?",
      blocks: [
        {
          t: "p",
          text: "민간이 짓고 서울시가 지원하는 공공지원민간임대예요. 지하철역 가까이에 들어서요. 모집공고는 서울시 청년안심주택 누리집에 올라와요. SH가 공급하는 공공임대분과 민간임대분은 순위와 임대료가 달라요.",
        },
      ],
    },
  ],
  faq: [
    { q: "소득 기준을 넘으면 청년안심주택을 신청할 수 없나요?", a: "특별공급은 소득 120% 이하만 신청해요. 소득 기준을 넘어도 일반공급으로는 신청할 수 있어요. 일반공급은 추첨으로 뽑아요." },
  ],
  sources: [SRC.youthSafe, SRC.publicRule],
  related: ["happy-housing", "purchase-rental", "income"],
  published: PUBLISHED,
  updated: UPDATED,
};

/* ───────────────────────── 든든전세 ───────────────────────── */

export const deundeunGuide: Guide = {
  slug: "deundeun-jeonse",
  category: "주택 유형",
  short: "든든전세",
  program: "deundeun",
  title: "든든전세 자격 조건 — HUG 든든전세주택",
  description: "HUG 든든전세주택은 무주택 세대구성원이면 소득·자산과 상관없이 신청할 수 있어요. 입주자는 무작위 추첨으로 뽑아요.",
  h1: "HUG 든든전세주택 신청 자격",
  answer: "HUG 든든전세주택은 세대원 모두 무주택이면 소득·자산 기준 없이 신청할 수 있어요. 입주자는 신청자 가운데 무작위 추첨으로 뽑아요. 주택도시보증공사가 확보한 주택을 시세보다 낮은 전세보증금으로 빌려줘요. 우선공급 대상과 조건은 차수마다 달라지기도 해요.",
  facts: ["무주택 세대", "소득·자산 기준 없음", "무작위 추첨"],
  sections: [
    {
      id: "who",
      h2: "든든전세는 누가 신청할 수 있나요?",
      blocks: [
        {
          t: "ul",
          items: [
            "신청자와 세대원 모두 무주택이어야 해요. 무주택 여부는 신청자와 배우자의 직계혈족을 기준으로 확인해요.",
            "소득, 자산, 나이, 혼인 기준이 없어요.",
            "청약통장이 없어도 돼요.",
          ],
        },
      ],
    },
    {
      id: "how",
      h2: "든든전세 공고는 차수마다 짧게 열려요",
      blocks: [
        {
          t: "p",
          text: "주택도시보증공사(HUG) 누리집에 차수별로 공고가 올라와요. 접수 기간이 짧아요. 마감되면 공고 목록에서 내려가요. 보증금 수준과 거주 기간, 우선공급 대상은 차수별 공고문에서 확인하세요.",
        },
      ],
    },
  ],
  faq: [{ q: "든든전세도 청약통장이 있어야 하나요?", a: "필요 없어요. 세대원 모두 무주택이면 통장, 소득, 자산과 상관없이 신청할 수 있어요. 중복 신청이 되는지 같은 세부 규정은 차수별 공고문에서 확인하세요." }],
  sources: [SRC.hugNotice],
  related: ["jeonse-rental", "national-rental", "assets"],
  published: PUBLISHED,
  updated: UPDATED,
};

/* ───────────────────────── 공공분양 ───────────────────────── */

export const publicSaleGuide: Guide = {
  slug: "public-sale",
  category: "주택 유형",
  short: "공공분양",
  program: "publicSale",
  title: `공공분양 자격 ${Y} — 1순위·소득·자산`,
  description: `공공분양(뉴홈 일반형) 전용 60㎡ 이하는 무주택 세대가 신청해요. 소득은 100%(3인 이하 월 ${won(STD.incomeSaleUpTo3)}) 이하이고, 맞벌이는 140%까지 돼요. 부동산은 ${manwon(A.publicSaleSmall)} 이하여야 해요.`,
  h1: `공공분양 자격 조건 (${Y}년 기준)`,
  answer: `공공분양(국민주택) 전용 60㎡ 이하 일반공급은 세대원 모두 무주택이면 신청할 수 있어요. 소득은 3인 이하 가구 기준 ${Y}년 월 ${won(STD.incomeSaleUpTo3)}(100%) 이하이고, 맞벌이는 140%까지 돼요. 부동산은 ${manwon(A.publicSaleSmall)}, 자동차는 ${manwon(A.car)} 이하여야 해요. 60㎡ 초과는 소득·자산 기준이 없어요. 1순위 안에서는 저축 총액이나 납입 횟수가 많은 순으로 뽑아요.`,
  facts: ["소득 100%", `부동산 ${manwon(A.publicSaleSmall)}`, "순차제"],
  sections: [
    {
      id: "flow",
      h2: "공공분양 일반공급은 어떤 순서로 뽑나요?",
      blocks: [
        {
          t: "ul",
          items: [
            "일반공급 물량의 50%는 2세 미만 자녀(태아 포함)가 있는 가구에 먼저 공급해요.",
            "30%는 순차제예요. 3년 이상 무주택 세대 중에서 저축 총액이나 납입 횟수가 많은 순으로 뽑아요. 전용 40㎡ 초과는 저축 총액을 보고, 월 25만 원까지만 인정해요. 40㎡ 이하는 납입 횟수를 봐요.",
            "나머지는 추첨이에요. 추첨분은 맞벌이 소득 기준이 200%로 넓어져요.",
          ],
        },
      ],
    },
    {
      id: "first",
      h2: "공공분양 1순위 조건",
      blocks: [
        {
          t: "p",
          text: "수도권은 가입 12개월에 12회 납입, 그 밖의 지역은 가입 6개월에 6회 납입을 채우면 돼요. 투기과열지구·청약과열지역은 24개월에 24회를 채워야 해요. 여기에 세대주여야 하고, 5년 안에 세대원 모두 당첨된 적이 없어야 해요. 자세한 요건은 1순위 조건(/guide/first-rank) 가이드를 참고하세요.",
        },
      ],
    },
    {
      id: "newhome",
      h2: "뉴홈 나눔형·선택형은 기준이 어떻게 다른가요?",
      blocks: [
        {
          t: "p",
          text: `나눔형은 시세의 70% 이하로 분양하고, 되팔 때 이익을 공공과 나누는 방식이에요. 일반공급 20%는 위와 같이 50%, 30%, 추첨으로 나눠 뽑아요. 소득은 100% 이하이고, 추첨분은 맞벌이 200%까지 돼요. 자산은 총자산 ${manwon(A.newhome)} 이하예요. 선택형은 6년 동안 임대로 살아 본 뒤 분양받을지 고르는 방식이에요. 소득은 가구원수별 금액을 써요.`,
        },
      ],
    },
  ],
  faq: [
    { q: "공공분양 60㎡를 넘으면 소득을 안 보나요?", a: "일반공급은 전용 60㎡를 넘으면 소득·자산 기준이 없어요. 특별공급은 면적과 상관없이 유형별 소득 기준을 봐요." },
    { q: "저축 총액은 어떻게 계산하나요?", a: "매달 넣은 금액 중 25만 원까지만 인정해 더한 금액이에요. 한 달에 50만 원을 넣었어도 25만 원만 쳐요." },
  ],
  sources: [SRC.supplyRule, SRC.publicRule, SRC.lhSale],
  related: ["first-rank", "newlywed-special", "first-home-special", "income"],
  published: PUBLISHED,
  updated: UPDATED,
};

/* ───────────────────────── 민영 아파트 ───────────────────────── */

export const privateAptGuide: Guide = {
  slug: "private-apt",
  category: "주택 유형",
  short: "민영 아파트",
  program: "privateApt",
  title: `민영 아파트 청약 조건 ${Y} — 1순위·가점`,
  description: "민영 아파트 일반공급은 소득·자산 기준이 없어요. 청약통장 가입기간과 예치금으로 1순위를 정하고, 1순위 안에서는 가점제와 추첨제로 뽑아요.",
  h1: `민영 아파트 청약 조건 (${Y}년 기준)`,
  answer: "민영 아파트 일반공급은 소득·자산 기준이 없어요. 청약통장 가입기간과 지역·면적별 예치금을 채우면 1순위예요. 가입기간은 규제지역 24개월, 수도권 12개월, 그 외 지역 6개월이에요. 1순위 안에서는 전용면적과 규제지역에 따라 일부는 84점 만점 가점이 높은 순으로, 나머지는 추첨으로 뽑아요.",
  facts: ["소득·자산 무관", "1순위 = 기간+예치금", "가점 84점"],
  sections: [
    {
      id: "general",
      h2: "민영 아파트 일반공급은 누가 신청할 수 있나요?",
      blocks: [
        {
          t: "ul",
          items: [
            "만 19세 이상이고 청약통장이 있으면 누구나 신청할 수 있어요. 집이 있어도 되지만, 규제지역에서는 제한이 있어요.",
            "1순위: 가입기간과 예치금을 채운 사람이에요. 규제지역에서는 조건이 더 붙어요. 세대주여야 하고, 5년 안에 당첨된 적이 없고, 2주택 이상 세대가 아니어야 해요.",
            "2순위: 1순위가 아닌 통장 가입자예요. 추첨으로 뽑아요.",
          ],
        },
      ],
    },
    {
      id: "special",
      h2: "민영 아파트 특별공급 5가지",
      blocks: [
        {
          t: "table",
          table: {
            caption: `${Y}년 민영주택 특별공급 (전용 85㎡ 이하)`,
            head: ["유형", "비율", "소득 기준", "선정"],
            wrap: true,
            rows: [
              ["신생아", "10%", "160% 또는 부동산 기준", "추첨 (2026-06-15 신설)"],
              ["신혼부부", "15%", "140% (맞벌이 160%)", "순위(자녀 유무) + 추첨"],
              ["생애최초", "공공택지 17% · 민간택지 7%", "160% 또는 부동산 기준", "추첨"],
              ["다자녀", "10%", "없음", "100점 배점"],
              ["노부모부양", "3%", "없음", "가점제"],
            ],
            note: "다자녀 특별공급 가이드 페이지는 배점표를 원문과 맞춘 뒤 올려요. 그 전까지 공고 상세에서 보이는 다자녀 점수는 참고용 예상이에요.",
          },
        },
      ],
    },
  ],
  faq: [
    { q: "집이 있어도 민영 아파트 청약을 할 수 있나요?", a: "비규제지역에서는 할 수 있어요. 다만 가점제 물량은 무주택자 중심이에요. 규제지역에서는 2주택 이상 세대가 1순위에서 빠져요. 추첨 물량도 무주택자에게 먼저 배정해요." },
  ],
  sources: [SRC.supplyRule, SRC.depositTable, SRC.applyhomeCalc],
  related: ["gajeom", "deposit", "first-rank", "newlywed-special"],
  published: PUBLISHED,
  updated: UPDATED,
};

export const PROGRAM_GUIDES = [
  happyGuide,
  nationalGuide,
  permanentGuide,
  integratedGuide,
  purchaseGuide,
  jeonseGuide,
  youthSafeGuide,
  deundeunGuide,
  publicSaleGuide,
  privateAptGuide,
];
