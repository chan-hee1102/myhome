import type { SourceId } from "@/lib/domain";

/**
 * 공고 출처. 스크래핑은 쓰지 않는다 — 공식 API(공공데이터포털, 이용허락범위 제한 없음)와
 * API가 없는 기관의 수동 정리(사실만 옮기고 원문 링크)만 쓴다. 상세는 docs/DESIGN.md 2장.
 */
export interface SourceInfo {
  id: SourceId;
  name: string;
  owner: string;
  kind: "api" | "manual";
  covers: string;
}

export const SOURCES: SourceInfo[] = [
  {
    id: "applyhome",
    name: "청약홈 분양정보",
    owner: "한국부동산원",
    kind: "api",
    covers: "민영·국민 아파트, 신혼희망타운, 공공지원민간임대, 무순위",
  },
  {
    id: "myhome",
    name: "마이홈 공공주택 모집공고",
    owner: "국토교통부",
    kind: "api",
    covers: "행복·국민·영구·통합공공·매입·전세임대, 공공분양",
  },
  { id: "lh", name: "LH 분양임대공고", owner: "한국토지주택공사", kind: "api", covers: "LH 임대·분양, 공고문 PDF" },
  { id: "hug", name: "HUG 든든전세주택", owner: "주택도시보증공사", kind: "api", covers: "든든전세 모집 물건" },
  {
    id: "manual",
    name: "직접 정리",
    owner: "SH · GH · 서울 청년안심주택",
    kind: "manual",
    covers: "API가 없는 기관 — 원문 확인 후 사실만 옮기고 원문 링크",
  },
];
