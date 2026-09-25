/** 사이트 공통 설정. 이름·주소를 바꿀 땐 여기 한 곳만 고치면 된다. */
export const SITE = {
  name: "청약핏",
  nameEn: "Cheongyak Fit",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://cheongyakfit.vercel.app").replace(/\/$/, ""),
  tagline: "내 조건에 맞는 청약만",
  description:
    "나이·사는 곳·가족·집·소득·재산, 여섯 가지에 답하면 행복주택·국민임대·공공분양·민영 아파트 공고마다 신청할 수 있는지와 예상 순위·가점을 계산해요. 2026년 청약·공공임대 자격 기준표도 한곳에.",
  /**
   * true면 공고가 예시 데이터라는 뜻이다. 공고 화면에 「예시」 표시가 붙고 그 화면만 색인을 막는다.
   * 가이드·기준표는 실제 법령 기준이라 색인한다. 공공데이터 API를 연결하면 false로 바꾼다(docs/DESIGN.md 3장).
   */
  sampleData: true,
  /** 운영 주소에서만 true. false면 사이트 전체 noindex */
  indexable: true,
  launched: "2026-09-25",
  /** 홈 등 고정 페이지의 최종 수정일 — 내용이 바뀔 때만 올린다(배포 때 now() 금지) */
  updated: "2026-09-25",
} as const;

export const PAGE_DATES = {
  home: "2026-09-25",
  privacy: "2026-09-25",
} as const;
