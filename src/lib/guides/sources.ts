import type { SourceRef } from "./types";

/** 가이드가 인용하는 원문. 조사일 2026-09-23 */
export const SRC = {
  supplyRule: {
    label: "주택공급에 관한 규칙 (국토교통부령 제1592호, 2026-06-15 시행)",
    url: "https://www.law.go.kr/법령/주택공급에관한규칙",
    law: { id: "국토교통부령 제1592호", date: "2026-06-15" },
  },
  depositTable: {
    label: "주택공급에 관한 규칙 [별표 2] 민영주택 청약 예치기준금액",
    url: "https://www.law.go.kr/LSW/flDownload.do?flSeq=164922735",
  },
  publicRule: {
    label: "공공주택 특별법 시행규칙 (2026-08-24 시행) 및 별표 3·4·5·5의2·6",
    url: "https://www.law.go.kr/법령/공공주택특별법시행규칙",
    law: { id: "공공주택 특별법 시행규칙", date: "2026-08-24" },
  },
  newlywedNotice: {
    label: "신혼부부·신생아 특별공급 운용지침 (국토교통부 고시 제2026-253호)",
    url: "https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000279932",
  },
  parentsNotice: {
    label: "다자녀·노부모부양 특별공급 운용지침 (국토교통부 고시 제2026-360호)",
    url: "https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2100000282330",
  },
  myhomeGuide: {
    label: "마이홈포털 공공주택 유형별 자격 안내 (국토교통부)",
    url: "https://www.myhome.go.kr/html/guide/QulifyGuideTypeAll.html",
  },
  lhSale: { label: "LH 공공분양 안내", url: "https://www.lh.or.kr/menu.es?mid=a10402010100" },
  lhApply: { label: "LH 청약플러스 공공임대 자격", url: "https://apply.lh.or.kr/lhapply/cm/cntnts/cntntsView.do?mi=1224&cntntsId=1111" },
  applyhomeCalc: {
    label: "청약홈 청약가점 계산기 (한국부동산원)",
    url: "https://www.applyhome.co.kr/ap/apg/selectAddpntCalculatorView.do",
  },
  youthSafe: {
    label: "서울시 청년안심주택 입주자격",
    url: "https://soco.seoul.go.kr/youth/pgm/home/yohome/supportYouth1.do?menuNo=400039",
  },
  hugNotice: {
    label: "HUG 든든전세주택 입주자 모집공고 (2026-07-24)",
    url: "https://www.khug.or.kr/hug/homepage_file_upload/jeonse_notice_260724.pdf",
  },
  regulation: {
    label: "투기과열지구·조정대상지역 지정 (국토교통부, 2025-10-15)",
    url: "https://www.korea.kr/news/policyNewsView.do?newsId=148950973",
  },
} satisfies Record<string, SourceRef>;
