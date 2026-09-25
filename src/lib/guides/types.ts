import type { ProgramId } from "@/lib/domain";

/**
 * 가이드(검색·AI 답변용 공개 페이지) 구조.
 * 숫자는 손으로 적지 않는다 — standards.ts·criteria.ts에서 계산해 문장·표에 넣는다.
 */

export interface GuideTable {
  /** 다른 페이지에서 앵커로 링크할 때 쓰는 id(표의 주인 페이지에서만) */
  id?: string;
  caption: string;
  head: string[];
  rows: string[][];
  note?: string;
  /** 칸 안에서 줄바꿈 허용(설명형 표) */
  wrap?: boolean;
}

export type Block =
  | { t: "p"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "table"; table: GuideTable }
  | { t: "calc" }
  | { t: "note"; text: string };

export interface Section {
  id: string;
  /** 본문 소제목 — 명사형·서술형과 질문형을 섞는다(전부 질문형이면 기계가 쓴 글처럼 읽힌다). FAQ의 q는 질문형 그대로 */
  h2: string;
  blocks: Block[];
}

export interface SourceRef {
  label: string;
  url: string;
  /** 법령이면 JSON-LD citation에 Legislation으로 넣는다 */
  law?: { id: string; date: string };
}

export interface Guide {
  slug: string;
  category: "기준표" | "주택 유형" | "특별공급";
  /** 목록·빵부스러기용 짧은 이름 */
  short: string;
  /** <title> — 사이트 이름은 템플릿이 붙인다 */
  title: string;
  description: string;
  h1: string;
  /** 답변 한 문단(AEO·GEO). 주어 + 2026 + 구체 숫자 + 조건, 2문장 이내 */
  answer: string;
  /** 요약 칩·공유 카드에 쓰는 핵심 숫자 3개 */
  facts: string[];
  sections: Section[];
  faq: { q: string; a: string }[];
  sources: SourceRef[];
  related: string[];
  published: string;
  updated: string;
  program?: ProgramId;
  /** 확인이 끝나지 않은 값이 있을 때 본문 위에 띄우는 안내 — 사용자에게 하는 말(해요체)로. 표 칸에는 ※ + PENDING_NOTE */
  pending?: string;
  /** Dataset JSON-LD(확인이 끝난 표만) */
  dataset?: { name: string; description: string; anchor: string; variables: string[] };
}
