import type { ProgramId } from "@/lib/domain";

export interface ProgramInfo {
  id: ProgramId;
  name: string;
  kind: "rent" | "sale";
  /** 한 줄 설명 */
  blurb: string;
}

export const PROGRAMS: Record<ProgramId, ProgramInfo> = {
  happy: { id: "happy", name: "행복주택", kind: "rent", blurb: "청년, 신혼부부, 고령자에게 시세보다 싸게 빌려주는 공공임대예요." },
  national: { id: "national", name: "국민임대", kind: "rent", blurb: "무주택 저소득 세대가 최장 30년 사는 공공임대예요." },
  permanent: { id: "permanent", name: "영구임대", kind: "rent", blurb: "수급자 등 주거취약계층을 위한 공공임대예요." },
  integrated: { id: "integrated", name: "통합공공임대", kind: "rent", blurb: "소득에 따라 임대료가 달라지는 새 공공임대예요." },
  purchase: { id: "purchase", name: "매입임대", kind: "rent", blurb: "LH·SH가 사들인 집을 다시 빌려주는 임대예요." },
  jeonse: { id: "jeonse", name: "전세임대", kind: "rent", blurb: "내가 구한 전셋집을 LH가 계약해 다시 빌려줘요." },
  youthSafe: { id: "youthSafe", name: "청년안심주택", kind: "rent", blurb: "서울 역세권에 짓는 청년·신혼부부 임대예요." },
  deundeun: { id: "deundeun", name: "든든전세", kind: "rent", blurb: "HUG가 시세 90% 이하 전세로 최대 8년 빌려줘요." },
  publicSale: { id: "publicSale", name: "공공분양", kind: "sale", blurb: "LH·SH 등이 짓는 국민주택 분양이에요. 뉴홈도 여기 속해요." },
  privateApt: { id: "privateApt", name: "민영 아파트", kind: "sale", blurb: "민간 건설사가 분양하고, 청약홈에서 접수해요." },
};

export const PROGRAM_COUNT = Object.keys(PROGRAMS).length;
