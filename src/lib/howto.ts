import type { Announcement, Profile } from "@/lib/domain";
import { withJosa } from "@/lib/josa";
import { localAreaName } from "@/lib/place";
import { manwon } from "@/lib/rules/core";
import { depositShortfall, sameLocal } from "@/lib/rules/checks";
import { depositFor } from "@/lib/rules/standards";

/**
 * 「다음에 뭘 하면 되나요」 — 공고별 접수처·접수 방법·준비물.
 * 가이드(src/lib/guides)와 출처(src/lib/guides/sources.ts)에 근거가 있는 것만 적는다. 확실하지 않은 건 쓰지 않는다.
 * 주소는 공식 누리집 첫 화면(루트)만 — 세부 경로는 바뀌기 쉽다.
 */

export interface HowTo {
  /** 접수처 이름. 예) 「LH청약플러스」, 「주민등록지 행정복지센터(주민센터)」 */
  where: string;
  /** 접수처 공식 누리집(루트). 방문 접수라 누리집이 없으면 없음 */
  url?: string;
  /** 접수 방법 한 줄 */
  method: string;
  /** 신청할 때 챙길 것 */
  bring: string[];
  /** 준비물은 공고마다 다르다는 안내 */
  caveat: string;
  /** 방문 접수(주민센터 등)인가 — 주말·거주지 경고에 쓴다 */
  visit?: boolean;
  /** 인터넷 접수에 인증서가 필요할 때, 인증서가 없는 사람을 위한 한 줄 */
  certHelp?: string;
}

const PORTAL = {
  applyhome: { where: "청약홈", url: "https://www.applyhome.co.kr" },
  lh: { where: "LH청약플러스", url: "https://apply.lh.or.kr" },
  sh: { where: "SH 인터넷청약", url: "https://www.i-sh.co.kr" },
  gh: { where: "GH 경기주택도시공사", url: "https://www.gh.or.kr" },
  hug: { where: "주택도시보증공사(HUG)", url: "https://www.khug.or.kr" },
  myhome: { where: "마이홈포털", url: "https://www.myhome.go.kr" },
  youthSafe: { where: "서울시 청년안심주택 누리집", url: "https://soco.seoul.go.kr" },
} as const;

const CAVEAT = "필요한 서류와 제출 시기는 공고마다 달라요. 공고문의 「제출 서류」를 꼭 확인하세요.";
const CERT = "공동인증서나 금융인증서 같은 인증서";
const LATER = "당첨되거나 서류 심사 대상이 되면 주민등록등본·가족관계증명서 등 서류를 내요";

/** 공고를 받는 공공기관(임대·공공분양)의 누리집 */
function agencyPortal(a: Pick<Announcement, "agency">) {
  if (a.agency === "SH") return PORTAL.sh;
  if (a.agency === "GH") return PORTAL.gh;
  if (a.agency === "HUG") return PORTAL.hug;
  if (a.agency === "LH") return PORTAL.lh;
  // IH·BMC 등 지방공사는 기관 누리집이 공고마다 달라 적지 않는다 — 공고 원문 링크로 보낸다
  return undefined;
}

/** 인증서가 없는 사람에게 — 금융인증서는 거래 은행 앱·누리집에서 발급한다 */
export const CERT_HELP = "인증서가 없으면 거래하는 은행 앱에서 금융인증서를 먼저 발급받으세요.";

export function howTo(a: Pick<Announcement, "agency" | "program" | "source">): HowTo {
  const h = howToBase(a);
  return h.bring.includes(CERT) ? { ...h, certHelp: CERT_HELP } : h;
}

function howToBase(a: Pick<Announcement, "agency" | "program" | "source">): HowTo {
  switch (a.program) {
    case "privateApt":
      return {
        ...PORTAL.applyhome,
        method: "청약홈에서 인터넷으로 신청해요. 특별공급·1순위·2순위 접수일이 서로 달라요.",
        bring: [CERT, "청약통장(가입 은행 확인)", LATER],
        caveat: CAVEAT,
      };
    case "permanent":
      // 가이드(permanent-rental): 「주민등록지 읍·면·동 주민센터에 신청하면 지자체가 자격을 확인해 순위와 배점을 매긴다」
      return {
        where: "주민등록지 행정복지센터(주민센터)",
        method: "주민등록지 행정복지센터(주민센터)에 가서 신청해요. 지자체가 자격을 확인하고 순위를 매겨요.",
        bring: ["신분증", "주민센터에서 안내하는 서류"],
        caveat: CAVEAT,
        visit: true,
      };
    case "youthSafe":
      return {
        ...PORTAL.youthSafe,
        method: "서울시 청년안심주택 누리집에 올라온 모집공고를 보고 신청해요. 공공임대분과 민간임대분의 접수 방법이 다를 수 있어요.",
        bring: [CERT, LATER],
        caveat: CAVEAT,
      };
    case "deundeun":
      return {
        ...PORTAL.hug,
        method: "주택도시보증공사(HUG) 누리집의 차수별 공고에 따라 신청해요. 접수 기간이 짧고 마감되면 공고가 내려가요.",
        bring: [CERT, LATER],
        caveat: CAVEAT,
      };
    default: {
      const portal = agencyPortal(a);
      const sale = a.program === "publicSale";
      return {
        where: portal?.where ?? "공고한 기관",
        url: portal?.url,
        method: portal
          ? `${portal.where} 누리집에서 인터넷으로 신청해요.${sale ? " 특별공급과 일반공급 접수일이 달라요." : ""}`
          : "공고문에 적힌 기관·방법으로 신청해요.",
        bring: sale ? [CERT, "청약통장(가입 은행 확인)", LATER] : [CERT, LATER],
        caveat: CAVEAT,
      };
    }
  }
}

/** 공고 모아보기 포털(마이홈) — 여러 기관 공고를 한곳에서 볼 때 */
export const MYHOME_PORTAL = PORTAL.myhome;

/**
 * 민영 1순위 예치금이 모자라면 최소 부족분(만원). 구간 위 끝까지 있다고 보고 센다 — 실제로는 더 모자랄 수 있다.
 * 주택형 면적은 공고의 가장 작은 주택형으로 본다(판정 엔진과 같음). 거주지·예치금을 모르거나 충분하면 null.
 */
export function depositGap(a: Pick<Announcement, "units" | "program">, p: Profile): number | null {
  // 예치금은 민영주택 기준 — 공공분양은 납입 횟수·저축 총액으로 본다
  if (a.program !== "privateApt" || !p.sido || p.hasAccount === false) return null;
  const area = Math.min(...a.units.map((u) => u.area));
  return depositShortfall(p.deposit, depositFor(p.sido, area));
}

/** 「예치금 약 50만 원 더」 */
export function depositGapText(a: Pick<Announcement, "units" | "program">, p: Profile): string | undefined {
  const g = depositGap(a, p);
  return g ? `예치금 약 ${manwon(g)} 더` : undefined;
}

/* ───────────────────────── 날짜·거주지 경고 (브라우저에서 호출 — 로컬 날짜 기준) ───────────────────────── */

/** "2026-10-04" → 로컬 자정 Date */
function localDay(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** 「10.3(금)」 */
function md(d: Date): string {
  return `${d.getMonth() + 1}.${d.getDate()}(${"일월화수목금토"[d.getDay()]})`;
}

function mdOf(s: string): string {
  return md(localDay(s));
}

/**
 * 방문 접수인데 접수 마감일이 토·일이면 경고 한 줄. 인터넷 접수·평일 마감이면 undefined.
 *   「마감일 10.4(토)는 주말이라 주민센터가 쉬어요. 금요일 10.2까지 방문하세요.」
 * 공휴일은 따지지 않는다(표가 없다) — 금요일이 공휴일이면 그 전 평일이어야 한다.
 */
export function weekendNote(a: Pick<Announcement, "agency" | "program" | "source" | "schedule">): string | undefined {
  const how = howTo(a);
  if (!how.visit) return undefined;
  const end = localDay(a.schedule.applyEnd);
  const dow = end.getDay();
  if (dow !== 0 && dow !== 6) return undefined;
  const place = a.program === "permanent" ? "주민센터" : "접수처";
  const fri = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (dow === 6 ? 1 : 2));
  if (fri < localDay(a.schedule.applyStart))
    return `접수 기간(${mdOf(a.schedule.applyStart)}~${md(end)})이 주말뿐이라 ${withJosa(place, "이/가")} 쉬어요. 방문할 수 있는 날을 공고문에서 확인하세요.`;
  return `마감일 ${withJosa(md(end), "은/는")} 주말이라 ${withJosa(place, "이/가")} 쉬어요. 금요일 ${fri.getMonth() + 1}.${fri.getDate()}까지 방문하세요.`;
}

/**
 * 주민등록지에서 접수하는 공고(영구임대 등)인데 사는 곳이 공고 지역과 다르면 한 줄.
 *   「이 공고는 보통 인천에 주민등록이 있어야 신청할 수 있어요.」
 * 사는 곳을 모르거나(시·군을 몰라 가릴 수 없을 때 포함) 같은 지역이면 undefined.
 */
export function residenceNote(a: Pick<Announcement, "agency" | "program" | "source" | "sido" | "sigungu">, p: Profile): string | undefined {
  if (!howTo(a).visit) return undefined;
  if (sameLocal({ a: a as Announcement, p }) !== "fail") return undefined;
  return `이 공고는 보통 ${localAreaName(a)}에 주민등록이 있어야 신청할 수 있어요. 공고문의 신청 자격 지역을 확인하세요.`;
}

/**
 * 분양 접수 순서 한 줄 — 특별공급·1순위·2순위 접수일이 다를 때만.
 *   「특별공급 9.29(화) → 1순위 9.30(수) → 2순위 10.1(목) 순서로 접수해요.」
 * 특별공급과 일반공급 중복 신청·당첨 규칙은 가이드에 근거가 없어 쓰지 않는다(날짜 순서만).
 */
export function scheduleNote(a: Pick<Announcement, "program" | "schedule">): string | undefined {
  if (a.program !== "privateApt" && a.program !== "publicSale") return undefined;
  const s = a.schedule;
  const all: [string, string | undefined][] = [
    ["특별공급", s.special],
    ["1순위", s.rank1],
    ["2순위", s.rank2],
  ];
  const steps = all.filter((x): x is [string, string] => !!x[1]);
  if (steps.length < 2 || new Set(steps.map((x) => x[1])).size < 2) return undefined;
  return `${steps.map(([k, d]) => `${k} ${mdOf(d)}`).join(" → ")} 순서로 접수해요.`;
}
