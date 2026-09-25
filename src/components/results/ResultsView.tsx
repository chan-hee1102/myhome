"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { LineReveal } from "@/components/motion/Reveal";
import { AppHeader } from "@/components/ui/AppHeader";
import { CountPill, StatusBadge, Tag } from "@/components/ui/Badge";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { SampleNotice } from "@/components/ui/SampleNotice";
import { sampleAnnouncements } from "@/lib/data/sample";
import { isEmptyProfile, useHydrated, useProfile } from "@/lib/profile";
import { profileChips } from "@/lib/questions";
import { countVerdicts, evaluateAll, suggestAsks, type NoticeResult } from "@/lib/rules/evaluate";
import { PROGRAMS } from "@/lib/rules/programs";
import { br } from "@/lib/text";
import { badgeStatus, dayText, programLine, reasonLine, shortDate, VERDICT, verdictKey } from "./verdict";

const EASE = [0.16, 1, 0.3, 1] as const;

type Tab = "all" | "ok" | "maybe" | "no" | "closed";
type Kind = "all" | "rent" | "sale";
type Sort = "match" | "deadline";

const TABS: { id: Tab; label: string }[] = [
  { id: "ok", label: "신청 가능" },
  { id: "maybe", label: "확인 필요" },
  { id: "no", label: "해당 없음" },
  { id: "closed", label: "마감" },
  { id: "all", label: "전체" },
];

const V_ORDER = { ok: 0, maybe: 1, no: 2 } as const;

function NoticeCard({ r, index }: { r: NoticeResult; index: number }) {
  const v = VERDICT[verdictKey(r)];
  const day = dayText(r);
  const reason = reasonLine(r);
  const dim = r.verdict === "no" || r.phase === "closed";
  const score = r.best.score;
  const urgent = r.phase === "open" && r.daysLeft <= 3;
  const meta = [
    `${r.a.sido} ${r.a.sigungu}`,
    r.best.group.label,
    ...(r.best.rank && r.verdict !== "no" ? [r.best.rank.label] : []),
    ...(score && r.verdict !== "no" ? [`${score.title} ${score.total}${score.partial ? "+" : ""}/${score.max}`] : []),
  ];
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.6, delay: Math.min(index, 8) * 0.045, ease: EASE }}
    >
      <Link
        href={`/notice/${r.a.id}`}
        className={`group grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 rounded-[20px] bg-page p-5 shadow-card transition-[box-shadow,transform,opacity] duration-300 hover:-translate-y-0.5 hover:shadow-lift md:grid-cols-[120px_minmax(0,1fr)_104px] md:items-start md:gap-x-6 md:p-6 ${
          dim ? "opacity-70 hover:opacity-100" : ""
        }`}
      >
        {/* 상태 */}
        <div className="flex items-center md:block">
          <StatusBadge status={badgeStatus(r)}>{v.label}</StatusBadge>
        </div>
        {/* D-day: 모바일은 상태 옆 오른쪽 위, 데스크탑은 오른쪽 열 */}
        <div className="flex flex-col items-end text-right md:col-start-3 md:row-start-1">
          <span className={`num text-[20px] leading-none md:text-[26px] ${urgent ? "text-hot-ink" : "text-ink"}`}>{day.big}</span>
          <span className="t-caption mt-1.5 whitespace-nowrap text-muted">
            {day.small} · {r.phase === "upcoming" ? shortDate(r.a.schedule.applyStart) : shortDate(r.a.schedule.applyEnd)}
          </span>
        </div>
        {/* 내용 */}
        <div className="col-span-2 min-w-0 md:col-span-1 md:col-start-2 md:row-start-1">
          <p className="t-caption flex items-center gap-2 text-muted">
            <span className="truncate">{programLine(r)}</span>
            {r.a.sample && <span className="shrink-0 rounded-[6px] bg-maybe-soft px-1.5 font-semibold text-maybe-ink">예시</span>}
          </p>
          <h3 className="mt-1 truncate text-[19px] font-bold leading-snug tracking-[-0.025em] text-ink md:text-[21px]">{r.a.complex}</h3>
          <p className="t-small mt-1.5 flex flex-wrap gap-x-2 text-sub">
            {meta.map((m, k) => (
              <span key={m} className="whitespace-nowrap">
                {m}
                {k < meta.length - 1 && <span aria-hidden className="ml-2 text-ghost">·</span>}
              </span>
            ))}
          </p>
          {reason && (
            <p className={`t-small mt-3 line-clamp-2 rounded-[10px] px-3 py-2 ${r.verdict === "maybe" ? "bg-maybe-soft text-maybe-ink" : r.verdict === "no" ? "bg-well text-muted" : "bg-ok-soft text-ok-ink"}`}>{reason}</p>
          )}
        </div>
      </Link>
    </motion.li>
  );
}

export function ResultsView() {
  const hydrated = useHydrated();
  const { profile } = useProfile();
  const empty = isEmptyProfile(profile);
  const results = useMemo(() => (hydrated ? evaluateAll(sampleAnnouncements(), profile) : []), [hydrated, profile]);
  const counts = countVerdicts(results);
  const asks = useMemo(() => suggestAsks(results), [results]);
  const [tabChoice, setTab] = useState<Tab | null>(null);
  const tab: Tab = tabChoice ?? (empty ? "all" : counts.ok > 0 ? "ok" : "all");
  const [kind, setKind] = useState<Kind>("all");
  const [sort, setSort] = useState<Sort>("match");

  const shown = useMemo(() => {
    const list = results.filter((r) => {
      if (kind !== "all" && PROGRAMS[r.a.program].kind !== kind) return false;
      if (tab === "all") return true;
      if (tab === "closed") return r.phase === "closed";
      return r.phase !== "closed" && r.verdict === tab;
    });
    return list.sort((x, y) => {
      if (sort === "match") {
        const v = (x.phase === "closed" ? 3 : V_ORDER[x.verdict]) - (y.phase === "closed" ? 3 : V_ORDER[y.verdict]);
        if (v) return v;
        const rk = (x.best.rank?.order ?? 5) - (y.best.rank?.order ?? 5);
        if (rk) return rk;
      }
      const dx = x.phase === "upcoming" ? x.daysToStart + 100 : x.daysLeft;
      const dy = y.phase === "upcoming" ? y.daysToStart + 100 : y.daysLeft;
      return dx - dy;
    });
  }, [results, tab, kind, sort]);

  const tabCount = (t: Tab) => (t === "all" ? counts.total : t === "closed" ? counts.closed : counts[t as "ok" | "maybe" | "no"]);
  const chips = profileChips(profile);

  return (
    <div className="min-h-dvh bg-wash">
      <AppHeader />
      <main className="wrap-app pb-20 pt-24 md:pb-28 md:pt-28">
        <SampleNotice />

        <section className="mt-8">
          <p className="eyebrow">{empty ? "전체 공고" : "내 조건으로 찾은 공고"}</p>
          {empty ? (
            <h1 className="t-display-l mt-3">
              <LineReveal immediate lines={[br("진행 중인 공고"), br("먼저 둘러보세요")]} />
            </h1>
          ) : (
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE }} className="t-display-l mt-3">
              신청 가능 <span className="num text-brand">{hydrated ? <AnimatedNumber value={counts.ok} duration={1.2} /> : "–"}</span>건
            </motion.h1>
          )}
          <p className="t-body-l mt-3 text-sub">
            {empty ? (
              br("조건을 넣으면 공고마다 | 신청 가능 여부와 예상 순위를 | 계산해 드려요.")
            ) : (
              <>
                확인 필요 <span className="data text-maybe-ink">{counts.maybe}</span> · 해당 없음 <span className="data">{counts.no}</span> · 마감{" "}
                <span className="data">{counts.closed}</span>
              </>
            )}
          </p>
          {empty ? (
            <div className="mt-8">
              <ButtonLink href="/check" size="lg" arrow>
                내 조건 넣기
              </ButtonLink>
            </div>
          ) : (
            <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="내 조건">
              {chips.map((c) => (
                <li key={c}>
                  <Tag>{c}</Tag>
                </li>
              ))}
            </ul>
          )}
        </section>

        {!empty && asks.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: EASE }}
            className="mt-8 rounded-[24px] bg-brand-soft p-5 md:p-7"
          >
            <p className="t-small font-bold text-brand">이것만 알려주시면 더 정확해져요</p>
            <p className="t-title mt-1.5 text-ink">
              {br(`${asks[0].label} 정보만 알려주시면 | 공고 ${asks[0].count}건의 결과가 | 확실해져요.`)}
            </p>
            <div className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
              {asks.slice(0, 4).map((a, k) => (
                <Link key={a.topic} href={`/check?topic=${a.topic}`} className={buttonClass(k === 0 ? "primary" : "outline", "sm")}>
                  {a.label}
                  <CountPill inverted={k === 0}>{a.count}</CountPill>
                </Link>
              ))}
            </div>
          </motion.section>
        )}

        {/* 필터: 모바일은 탭만 고정, md 이상은 한 줄 */}
        <div className="sticky top-16 z-20 -mx-5 mt-10 bg-wash/90 px-5 py-3 backdrop-blur-xl md:-mx-8 md:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <LayoutGroup>
              <div className="no-scrollbar mask-fade-r -mx-1 flex gap-1 overflow-x-auto px-1 md:mask-none">
                {TABS.map((t) => {
                  const on = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTab(t.id)}
                      className={`relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 text-[14px] font-semibold transition-colors ${
                        on ? "text-white" : "text-sub hover:text-ink"
                      }`}
                    >
                      {on && <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-[10px] bg-ink" transition={{ type: "spring", stiffness: 420, damping: 36 }} />}
                      <span className="relative">{t.label}</span>
                      {hydrated && (
                        <span className="relative">
                          <CountPill inverted={on}>{tabCount(t.id)}</CountPill>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </LayoutGroup>
            <div className="hidden items-center gap-2 md:flex">
              <KindSwitch kind={kind} setKind={setKind} />
              <button type="button" onClick={() => setSort(sort === "match" ? "deadline" : "match")} className={buttonClass("ghost", "sm")}>
                <SortIcon />
                {sort === "match" ? "잘 맞는 순" : "마감 임박순"}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between md:hidden">
          <KindSwitch kind={kind} setKind={setKind} />
          <button type="button" onClick={() => setSort(sort === "match" ? "deadline" : "match")} className={buttonClass("ghost", "sm")}>
            <SortIcon />
            {sort === "match" ? "잘 맞는 순" : "마감 임박순"}
          </button>
        </div>

        <ul className="mt-4 space-y-3">
          {!hydrated && Array.from({ length: 4 }).map((_, k) => <li key={k} className="h-[132px] animate-pulse rounded-[20px] bg-page shadow-card" />)}
          <AnimatePresence mode="popLayout">
            {shown.map((r, k) => (
              <NoticeCard key={r.a.id} r={r} index={k} />
            ))}
          </AnimatePresence>
        </ul>
        {hydrated && shown.length === 0 && <p className="t-body mt-10 text-center text-sub">이 조건에 맞는 공고가 없어요. 다른 탭을 눌러 보세요.</p>}
      </main>
    </div>
  );
}

function KindSwitch({ kind, setKind }: { kind: Kind; setKind: (k: Kind) => void }) {
  return (
    <div className="flex h-9 items-center gap-0.5 rounded-[10px] bg-page p-0.5 ring-1 ring-inset ring-line">
      {(
        [
          ["all", "전체"],
          ["rent", "임대"],
          ["sale", "분양"],
        ] as const
      ).map(([k, l]) => (
        <button
          key={k}
          type="button"
          onClick={() => setKind(k)}
          className={`h-8 rounded-[8px] px-3 text-[14px] font-semibold transition-colors ${kind === k ? "bg-brand-soft text-brand-ink" : "text-sub hover:text-ink"}`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function SortIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M5 3v10M5 13l-2.5-2.5M5 13l2.5-2.5M11 13V3M11 3 8.5 5.5M11 3l2.5 2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
