import { PROGRAM_GUIDES } from "./programs";
import { SPECIAL_GUIDES } from "./specials";
import { TABLE_GUIDES, UPDATED } from "./tables";
import type { Guide } from "./types";

export type { Guide, Section, Block, GuideTable, SourceRef } from "./types";
export { SRC } from "./sources";
export { STD, UPDATED } from "./tables";

/** 공개 가이드 전체(순서 = 허브·사이트맵·llms.txt 순서) */
export const GUIDES: Guide[] = [...TABLE_GUIDES, ...PROGRAM_GUIDES, ...SPECIAL_GUIDES];

export const GUIDE_HUB = {
  path: "/guide",
  title: `${UPDATED.slice(0, 4)} 청약·공공임대 자격 기준 총정리`,
  h1: `${UPDATED.slice(0, 4)} 청약·공공임대 자격 기준 한눈에 보기`,
  description:
    "행복주택·국민임대·공공분양·민영 아파트 등 10개 유형의 2026년 나이·소득·자산·통장 기준과 특별공급 조건을 정리했습니다. 기준표와 가점 계산기로 이어집니다.",
  answer:
    "청약·공공임대 자격은 무주택 여부, 소득(도시근로자 월평균소득 또는 기준 중위소득 대비 %), 자산, 청약통장 네 가지로 갈리며, 기준 비율은 유형과 공급 대상마다 다릅니다. 2026년에는 소득 기준이 1월 1일, 자산 기준이 2월 27일 이후 모집공고부터 새 값으로 바뀌었습니다.",
  updated: UPDATED,
};

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function guidePath(slug: string) {
  return `/guide/${slug}`;
}
