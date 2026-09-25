import { manwon } from "@/lib/rules/core";
import { won } from "@/lib/rules/criteria";
import { SRC } from "./sources";
import { PUBLISHED, STD, UPDATED, limitWon } from "./tables";
import type { Guide } from "./types";

const Y = STD.year;
const A = STD.assets;
const S3 = won(STD.incomeSaleUpTo3);

/* 특별공급 4종 — 공공분양과 민영주택을 나란히 비교한다. 다자녀는 배점표 원문 재확인 후 공개. */

export const newlywedSpecialGuide: Guide = {
  slug: "newlywed-special",
  category: "특별공급",
  short: "신혼부부 특별공급",
  title: `신혼부부 특별공급 자격 ${Y} — 공공·민영 비교`,
  description: `신혼부부 특별공급은 혼인 7년 이내 무주택 세대가 대상입니다. 공공분양은 소득 130%(맞벌이 200%), 민영주택은 140%(맞벌이 160%)가 기준이며 선정 방식도 다릅니다.`,
  h1: `신혼부부 특별공급 자격 (${Y}년 기준)`,
  answer: `신혼부부 특별공급은 혼인 7년 이내이고 세대원 모두 무주택인 가구가 대상이며, 공공분양은 소득이 3인 이하 기준 월 ${S3}의 130%(맞벌이 200%) 이하, 민영주택은 140%(맞벌이 160%) 이하여야 합니다. 민영주택은 혼인 중 자녀가 있으면 1순위, 없으면 2순위이고, 공공분양은 예비부부·한부모 가구도 신청할 수 있습니다.`,
  facts: ["혼인 7년 이내", "공공 130%", "민영 140%"],
  sections: [
    {
      id: "compare",
      h2: "공공분양과 민영주택 신혼부부 특별공급은 무엇이 다른가요?",
      blocks: [
        {
          t: "table",
          table: {
            caption: `표 1. ${Y}년 신혼부부 특별공급 비교`,
            head: ["항목", "공공분양", "민영주택"],
            wrap: true,
            rows: [
              ["대상", "혼인 7년 이내 · 예비부부 · 6세 이하 자녀를 둔 한부모", "혼인 7년 이내(예비부부 불가)"],
              ["소득", `130% 이하 (맞벌이 200%) — 3인 이하 월 ${limitWon("publicNewlywed", 3)}`, `140% 이하 (맞벌이 160%) — 3인 이하 월 ${limitWon("privateNewlywed", 3)}`],
              ["자산", `부동산 ${manwon(A.publicSaleSmall)} · 자동차 ${manwon(A.car)}`, `소득 초과 시 부동산 ${manwon(A.special29)} 이하면 추첨분 신청 (확인 중)`],
              ["통장", "가입 6개월 · 6회 납입", "가입 6개월 · 지역별 예치금"],
              ["선정", "70%는 소득 100%(맞벌이 120%) 이하에서 순위·배점, 20%는 130% 이하, 나머지 추첨", "50%는 100%(맞벌이 120%), 20%는 140%(160%) 이하에서 순위 → 30% 추첨"],
              ["비율", "공급량의 최대 10%", "15%"],
            ],
          },
        },
      ],
    },
    {
      id: "score",
      h2: "공공분양 신혼부부 특별공급 배점은?",
      blocks: [
        {
          t: "table",
          table: {
            caption: "표 2. 공공분양 신혼부부 특별공급 배점 (항목별 최대 3점)",
            head: ["항목", "3점", "2점", "1점"],
            wrap: true,
            rows: [
              ["소득", "—", "—", "80% 이하(맞벌이 100%)"],
              ["자녀 수", "3명 이상", "2명", "1명"],
              ["해당 지역 거주기간", "3년 이상", "1~3년", "1년 미만"],
              ["청약통장 납입 횟수", "24회 이상", "12회 이상", "6회 이상"],
              ["혼인기간", "3년 이하", "5년 이하", "7년 이하"],
            ],
          },
        },
      ],
    },
  ],
  faq: [
    { q: "민영주택 신혼부부 특별공급에서 자녀가 없으면 불리한가요?", a: "그렇습니다. 민영주택은 혼인 중 자녀(태아·입양 포함)가 있으면 1순위, 없으면 2순위라 자녀가 있는 가구가 먼저 뽑힙니다. 같은 순위 안에서는 해당 지역 거주자, 자녀 수 순이고 그다음 추첨입니다." },
    { q: "맞벌이 기준은 부부 중 한 사람 소득만 봐도 되나요?", a: "합산 소득이 맞벌이 기준 이하여야 하고, 부부 중 한 사람의 소득이 일정 비율(예: 140%)을 넘으면 맞벌이 기준을 쓸 수 없습니다." },
  ],
  sources: [SRC.supplyRule, SRC.publicRule, SRC.newlywedNotice],
  related: ["newborn-special", "first-home-special", "public-sale", "private-apt"],
  published: PUBLISHED,
  updated: UPDATED,
};

export const firstHomeSpecialGuide: Guide = {
  slug: "first-home-special",
  category: "특별공급",
  short: "생애최초 특별공급",
  title: `생애최초 특별공급 자격 ${Y} — 공공·민영`,
  description: `생애최초 특별공급은 세대원 모두 집을 가져 본 적이 없고 소득세를 5년 이상 낸 1순위 무주택 세대가 대상입니다. 공공분양 130%(맞벌이 200%), 민영주택 160% 기준과 추첨 방식을 정리했습니다.`,
  h1: `생애최초 특별공급 자격 (${Y}년 기준)`,
  answer: `생애최초 특별공급은 세대원 모두 주택을 소유한 적이 없고, 혼인 중이거나 자녀가 있으며, 근로·사업소득세를 5년 이상 낸 1순위 무주택 세대가 대상입니다. 공공분양은 소득 130%(맞벌이 200%)·저축 600만 원 이상, 민영주택은 소득 160% 이하가 기준이고 모두 추첨으로 뽑습니다.`,
  facts: ["소유 이력 없음", "소득세 5년", "전량 추첨"],
  sections: [
    {
      id: "compare",
      h2: "공공분양과 민영주택 생애최초 특별공급은 어떻게 다른가요?",
      blocks: [
        {
          t: "table",
          table: {
            caption: `표 1. ${Y}년 생애최초 특별공급 비교`,
            head: ["항목", "공공분양", "민영주택"],
            wrap: true,
            rows: [
              ["공통", "세대원 모두 주택 소유 이력 없음 · 1순위 · 혼인 중이거나 자녀 있음 · 소득세 5년 이상 납부", "같음(1인 가구는 전용 60㎡ 이하 추첨분만)"],
              ["소득", `130% 이하 (맞벌이 200%) — 3인 이하 월 ${limitWon("publicFirst", 3)}`, `160% 이하 — 3인 이하 월 ${limitWon("privateFirst", 3)}`],
              ["자산·저축", `부동산 ${manwon(A.publicSaleSmall)} · 저축 600만 원 이상`, `소득 초과 시 부동산 ${manwon(A.special29)} 이하면 추첨분 (확인 중)`],
              ["선정", "70%는 소득 100%(맞벌이 120%), 20%는 130%(140%) 이하에서 추첨, 나머지 추첨", "50%는 130%, 20%는 160% 이하에서 추첨, 나머지 추첨"],
              ["비율", "공급량의 최대 15%", "공공택지 17% · 민간택지 7%"],
            ],
          },
        },
      ],
    },
  ],
  faq: [
    { q: "예전에 분양권을 가졌다가 팔았다면 생애최초가 안 되나요?", a: "세대원 누구라도 주택을 소유한 적이 있으면 생애최초 특별공급 대상이 아닙니다. 분양권·입주권도 주택 소유로 볼 수 있어 공고문의 무주택 판정 기준을 확인해야 합니다." },
    { q: "1인 가구도 생애최초 특별공급을 신청할 수 있나요?", a: "민영주택은 1인 가구도 전용 60㎡ 이하 추첨 물량에 한해 신청할 수 있습니다. 공공분양은 혼인 중이거나 자녀가 있어야 합니다." },
  ],
  sources: [SRC.supplyRule, SRC.publicRule, SRC.newlywedNotice],
  related: ["newlywed-special", "public-sale", "private-apt", "first-rank"],
  published: PUBLISHED,
  updated: UPDATED,
};

export const newbornSpecialGuide: Guide = {
  slug: "newborn-special",
  category: "특별공급",
  short: "신생아 특별공급",
  title: `신생아 특별공급 자격 ${Y} — 민영 신설 포함`,
  description: `신생아 특별공급은 2세 미만 자녀(임신 포함)가 있는 무주택 세대가 대상입니다. 공공분양은 소득 140%(맞벌이 200%), ${Y}년 6월 신설된 민영주택 신생아 특공은 160%가 기준입니다.`,
  h1: `신생아 특별공급 자격 (${Y}년 기준)`,
  answer: `신생아 특별공급은 입주자 모집공고일 기준 2세 미만 자녀(태아·입양 포함)가 있는 무주택 세대가 혼인 여부와 상관없이 신청할 수 있습니다. 공공분양은 소득 140%(맞벌이 200%) 이하, ${Y}년 6월 15일 새로 생긴 민영주택 신생아 특별공급(물량 10%)은 1순위이면서 소득 160% 이하가 기준입니다.`,
  facts: ["2세 미만 자녀", "공공 140%", "민영 10% 신설"],
  sections: [
    {
      id: "compare",
      h2: "공공분양과 민영주택 신생아 특별공급은 어떻게 다른가요?",
      blocks: [
        {
          t: "table",
          table: {
            caption: `표 1. ${Y}년 신생아 특별공급 비교`,
            head: ["항목", "공공분양", "민영주택"],
            wrap: true,
            rows: [
              ["대상", "2세 미만 자녀(태아·입양 포함) 무주택 세대", "같음 + 민영 1순위"],
              ["소득", `140% 이하 (맞벌이 200%) — 3인 이하 월 ${limitWon("publicNewborn", 3)}`, `160% 이하 — 3인 이하 월 ${limitWon("privateNewborn", 3)}`],
              ["자산", `부동산 ${manwon(A.publicSaleSmall)} · 자동차 ${manwon(A.car)}`, `소득 초과 시 부동산 ${manwon(A.special29)} 이하면 추첨분 (확인 중)`],
              ["선정", "70%는 100%(맞벌이 120%), 20%는 140%(150%) 이하 우선, 나머지 추첨. 경쟁 시 배점", "50%는 130%, 20%는 160% 이하에서 추첨, 30%는 전체 추첨"],
              ["비율", "공급량의 최대 20%", `10% (${Y}-06-15 신설)`],
            ],
          },
        },
      ],
    },
  ],
  faq: [
    { q: "임신 중이어도 신생아 특별공급을 신청할 수 있나요?", a: "네. 태아도 자녀로 인정합니다. 당첨 후 임신진단서 등 증빙을 내야 하고, 출산 여부를 확인하는 절차가 있습니다." },
  ],
  sources: [SRC.supplyRule, SRC.publicRule, SRC.newlywedNotice],
  related: ["newlywed-special", "public-sale", "private-apt"],
  published: PUBLISHED,
  updated: UPDATED,
};

export const parentsSpecialGuide: Guide = {
  slug: "parents-special",
  category: "특별공급",
  short: "노부모부양 특별공급",
  title: `노부모부양 특별공급 자격 ${Y}`,
  description: "노부모부양 특별공급은 만 65세 이상 직계존속을 3년 이상 모시고 사는 무주택 세대주가 대상입니다. 공공분양은 소득 120% 순차제, 민영주택은 가점제로 뽑습니다.",
  h1: `노부모부양 특별공급 자격 (${Y}년 기준)`,
  answer: `노부모부양 특별공급은 만 65세 이상 직계존속(배우자의 부모 포함)을 3년 이상 같은 주민등록에서 모시고 사는 무주택 세대주가 1순위일 때 신청할 수 있습니다. 공공분양은 소득 120%(맞벌이 200%, 3인 이하 월 ${limitWon("publicParents", 3)}) 이하에서 저축 총액 순으로, 민영주택은 소득 기준 없이 가점제로 뽑습니다.`,
  facts: ["만 65세 이상 부모", "3년 이상 부양", "무주택 세대주"],
  sections: [
    {
      id: "compare",
      h2: "공공분양과 민영주택 노부모부양 특별공급은 어떻게 다른가요?",
      blocks: [
        {
          t: "table",
          table: {
            caption: `표 1. ${Y}년 노부모부양 특별공급 비교`,
            head: ["항목", "공공분양", "민영주택"],
            wrap: true,
            rows: [
              ["대상", "만 65세 이상 직계존속 3년 이상 부양 · 무주택 세대주 · 1순위", "같음"],
              ["소득", `120% 이하 (맞벌이 200%)`, "기준 없음"],
              ["선정", "90%는 120%(맞벌이 130%) 이하에서 순차(저축 총액·납입 횟수), 나머지 추첨", "가점제(84점)"],
              ["비율", "공급량의 최대 5%", "3%"],
            ],
          },
        },
      ],
    },
  ],
  faq: [
    { q: "부모님이 집을 가지고 계시면 신청할 수 없나요?", a: "노부모부양 특별공급은 부양하는 직계존속과 그 배우자까지 무주택이어야 합니다. 일반공급에서 60세 이상 직계존속의 소형 주택을 무주택으로 봐 주는 예외가 여기에는 적용되지 않습니다." },
  ],
  sources: [SRC.supplyRule, SRC.parentsNotice],
  related: ["gajeom", "public-sale", "private-apt"],
  published: PUBLISHED,
  updated: UPDATED,
};

export const SPECIAL_GUIDES = [newlywedSpecialGuide, firstHomeSpecialGuide, newbornSpecialGuide, parentsSpecialGuide];
