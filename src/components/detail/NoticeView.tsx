"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState } from "react";
import { DUR, EASE, SPRING } from "@/components/motion/tokens";
import { WinMark } from "@/components/motion/WinMark";
import { badgeStatus, dayText, isUrgent, rankTone, shortDate, topicFor, VERDICT } from "@/components/results/verdict";
import { AppHeader } from "@/components/ui/AppHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { SampleNotice } from "@/components/ui/SampleNotice";
import { WinGlyph } from "@/components/ui/Window";
import type { Announcement } from "@/lib/domain";
import { sampleAnnouncements } from "@/lib/data/sample";
import { SOURCES } from "@/lib/data/sources";
import { placeText } from "@/lib/place";
import { isEmptyProfile, useHydrated, useProfile } from "@/lib/profile";
import type { Check } from "@/lib/rules/core";
import { manwon } from "@/lib/rules/core";
import { basisText, evaluate, type GroupResult, type NoticeResult } from "@/lib/rules/evaluate";
import { PROGRAMS } from "@/lib/rules/programs";
import { soft } from "@/lib/text";
import { NextSteps } from "./NextSteps";


/** 유형별 가이드 — 조건 줄에서 「기준 근거」로 연결 */
const GUIDE_SLUG: Record<string, string> = {
  happy: "happy-housing",
  national: "national-rental",
  permanent: "permanent-rental",
  integrated: "integrated-rental",
  purchase: "purchase-rental",
  jeonse: "jeonse-rental",
  youthSafe: "youth-safe-housing",
  deundeun: "deundeun-jeonse",
  publicSale: "public-sale",
  privateApt: "private-apt",
};

/**
 * 조건 한 줄. 계층 탭을 바꿀 때마다 위에서부터 한 줄씩 맞춰 본다(줄당 60ms):
 * 표시가 튀어나오고 ✓·?·✕가 그려지고, 미달이면 내 값에 취소선이 왼쪽부터 그어진다.
 */
function CheckRow({ c, i }: { c: Check; i: number }) {
  const reduce = useReducedMotion();
  const topic = c.tri === "unknown" && c.ask?.length ? topicFor(c.ask) : undefined;
  const t = reduce ? 0 : i * 0.06;
  return (
    <li className="grid grid-cols-[20px_minmax(0,1fr)] gap-x-3 border-b border-line py-4 last:border-b-0 md:grid-cols-[20px_112px_minmax(0,1fr)_minmax(0,1fr)]">
      <WinMark tri={c.tri} delay={t} className="mt-1" />
      <span className="text-[15px] font-semibold text-ink">{c.label}</span>
      <span className="t-small col-start-2 mt-1 text-sub md:col-start-auto md:mt-0.5">
        <span className="mr-1.5 text-muted md:hidden">필요 조건</span>
        {soft(c.need)}
      </span>
      <span className={`t-small relative col-start-2 mt-0.5 w-fit md:col-start-auto ${c.tri === "fail" ? "text-muted" : c.tri === "unknown" ? "font-semibold text-maybe-ink" : "font-semibold text-ink"}`}>
        <span className="mr-1.5 font-normal text-muted md:hidden">내 상황</span>
        {soft(c.mine)}
        {c.tri === "fail" && (
          <motion.span
            aria-hidden
            className="absolute inset-x-0 top-1/2 h-px origin-left bg-muted"
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.24, ease: EASE.move, delay: t + 0.12 }}
          />
        )}
      </span>
      {(c.hint || topic) && (
        <span className="col-start-2 mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 md:col-span-3 md:col-start-2">
          {c.hint && <span className="t-small text-sub">{c.hint}</span>}
          {topic && (
            <Link href={`/check?topic=${topic}`} className="text-[14px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              알려주기
            </Link>
          )}
        </span>
      )}
    </li>
  );
}

/** 점수 카드 — 항목 막대는 scaleX로 채운다 */
function ScoreCard({ g }: { g: GroupResult }) {
  const s = g.score!;
  return (
    <div className="rounded-[4px] bg-page p-5 ring-1 ring-inset ring-line md:p-6">
      <p className="text-[13px] font-semibold text-sub">{s.title}</p>
      <p className="mt-1 text-ink">
        <span className="t-num-l text-brand">{s.total}</span>
        <span className="ml-1.5 text-[18px] font-semibold text-muted">/ {s.max}점</span>
      </p>
      {s.partialNote && <p className="t-caption mt-2 text-maybe-ink">{s.partialNote}</p>}
      <ul className="mt-5 space-y-3.5">
        {s.lines.map((l, i) => (
          <li key={l.label}>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="font-medium text-body">{l.label}</span>
              <span className="data shrink-0 text-[13px] text-ink">
                {l.points === null ? "?" : l.points}
                <span className="text-muted"> / {l.max}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-[2px] bg-well">
              <motion.div
                className={`h-full origin-left rounded-[2px] ${l.points === null ? "bg-maybe/50" : "bg-brand"}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: (l.points ?? 0) / l.max }}
                transition={{ duration: DUR.slow, ease: EASE.out, delay: 0.1 + i * 0.06 }}
              />
            </div>
            <p className="t-caption mt-1 text-muted">{l.note}</p>
          </li>
        ))}
      </ul>
      <p className="t-caption mt-5 border-t border-line pt-3 text-muted">답한 조건으로 계산한 참고용 점수예요. 공고문의 배점표가 우선이에요.</p>
    </div>
  );
}

/**
 * 접수 기간 띠 — 전체 기간 중 지난 몫은 회색, 남은 몫은 군청(3일 이하면 빨강). 지난 몫이 왼쪽부터 차오른다.
 * 접수 전은 홈의 접수 일정 띠와 같이 테두리만 그린다(아직 켜지지 않은 기간).
 */
function DayBar({ r }: { r: NoticeResult }) {
  const reduce = useReducedMotion();
  const s = new Date(r.a.schedule.applyStart).getTime();
  const e = new Date(r.a.schedule.applyEnd).getTime();
  const total = Math.max(1, Math.round((e - s) / 86_400_000) + 1);
  const left = r.phase === "open" ? Math.max(0, Math.min(total, r.daysLeft + 1)) : r.phase === "upcoming" ? total : 0;
  const hot = isUrgent(r);
  return (
    <div className="mt-4" aria-hidden>
      <div
        className={`relative h-2 overflow-hidden rounded-[2px] ${r.phase === "closed" ? "bg-well" : r.phase === "upcoming" ? "bg-page ring-[1.5px] ring-inset ring-brand/60" : hot ? "bg-hot" : "bg-brand"}`}
      >
        {r.phase === "open" && (
          <motion.div
            className="absolute inset-y-0 left-0 w-full origin-left bg-line-strong"
            initial={reduce ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 - left / total }}
            transition={{ duration: DUR.slow, ease: EASE.out, delay: 0.2 }}
          />
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[12px] font-medium text-muted tabular">
        <span>{shortDate(r.a.schedule.applyStart)}</span>
        <span>{shortDate(r.a.schedule.applyEnd)}</span>
      </div>
    </div>
  );
}

function DayCard({ r }: { r: NoticeResult }) {
  const a = r.a;
  const day = dayText(r);
  const hot = isUrgent(r);
  return (
    <div className="rounded-[4px] bg-page p-5 ring-1 ring-inset ring-line md:p-6">
      <p className={`t-num-l ${hot ? "text-hot-ink" : "text-ink"}`}>{day.big}</p>
      <p className="mt-1 text-[13px] font-semibold text-sub">{day.small}</p>
      <DayBar r={r} />
      <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[14px]">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">접수</dt>
          <dd className="data text-ink">
            {shortDate(a.schedule.applyStart)} – {shortDate(a.schedule.applyEnd)}
          </dd>
        </div>
        {a.schedule.winners && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">당첨 발표</dt>
            <dd className="data text-ink">{shortDate(a.schedule.winners)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-muted">공급</dt>
          <dd className="data text-ink">{a.units.reduce((s, u) => s + u.units, 0).toLocaleString("ko-KR")}세대</dd>
        </div>
      </dl>
      {a.noticeUrl && !a.sample ? (
        <a href={a.noticeUrl} target="_blank" rel="noopener noreferrer" className={`${buttonClass("primary", "md", { block: true })} mt-5`}>
          공고 원문 보기
        </a>
      ) : (
        <p className="t-small mt-5 text-muted">예시 공고라 원문이 없어요.</p>
      )}
    </div>
  );
}

/** 공급 세대 중 이 계층 몫 — 가는 비율 막대. 계층 탭을 바꾸면 막대가 그 몫으로 움직인다 */
function SupplyShare({ a, pick }: { a: Announcement; pick: string }) {
  const reduce = useReducedMotion();
  const withUnits = a.groups.filter((g) => g.units);
  const total = withUnits.reduce((s, g) => s + (g.units ?? 0), 0);
  if (!total) return null;
  const mine = withUnits.find((g) => g.id === pick);
  const share = (mine?.units ?? 0) / total;
  return (
    <figure className="mt-5">
      <div className="h-1.5 overflow-hidden rounded-[2px] bg-well" aria-hidden>
        <motion.div className="h-full origin-left bg-ink" initial={false} animate={{ scaleX: share }} transition={reduce ? { duration: 0 } : { duration: DUR.base, ease: EASE.move }} />
      </div>
      <figcaption className="t-small mt-2 text-sub">
        공급 <span className="data text-ink">{total.toLocaleString("ko-KR")}</span>세대 중 {mine ? mine.label : "이 계층"}{" "}
        <span className="data text-ink">{(mine?.units ?? 0).toLocaleString("ko-KR")}</span>세대
      </figcaption>
    </figure>
  );
}

function Timeline({ r }: { r: NoticeResult }) {
  const reduce = useReducedMotion();
  const s = r.a.schedule;
  const steps = [
    { k: "공고", d: s.announced },
    ...(s.special ? [{ k: "특별공급", d: s.special }] : []),
    ...(s.rank1 ? [{ k: "1순위", d: s.rank1 }] : []),
    ...(s.rank2 ? [{ k: "2순위", d: s.rank2 }] : []),
    ...(!s.special ? [{ k: "접수 시작", d: s.applyStart }, { k: "접수 마감", d: s.applyEnd }] : []),
    ...(s.winners ? [{ k: "당첨 발표", d: s.winners }] : []),
    ...(s.moveIn ? [{ k: "입주 예정", d: s.moveIn }] : []),
  ];
  const today = new Date();
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const toTime = (d: string) => {
    const [y, m, dd] = d.split("-").map(Number);
    return new Date(y, m - 1, dd || 1).getTime();
  };
  const passed = steps.filter((x) => toTime(x.d) <= t).length;
  return (
    <ol className="relative grid gap-5 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))] md:gap-0">
      <span aria-hidden className="absolute bottom-2 left-[5px] top-2 w-[1.5px] bg-line md:bottom-auto md:left-[5px] md:right-0 md:top-[5px] md:h-[1.5px] md:w-auto" />
      <motion.span
        aria-hidden
        className="absolute left-[5px] top-[5px] hidden h-[1.5px] origin-left bg-ink md:block"
        initial={reduce ? false : { scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: DUR.slow, ease: EASE.move }}
        style={{ width: `${Math.max(0, (passed - 0.5) / steps.length) * 100}%` }}
      />
      {steps.map((x) => {
        const done = toTime(x.d) <= t;
        return (
          <li key={x.k} className="relative flex items-center gap-4 md:block md:pr-3">
            <span className={`relative z-10 block size-3 shrink-0 rounded-[2px] border-[1.5px] ${done ? "border-ink bg-ink" : "border-line-strong bg-page"}`} />
            <div className="md:mt-3">
              <p className={`text-[14px] font-semibold ${done ? "text-muted" : "text-ink"}`}>{x.k}</p>
              <p className="data mt-0.5 text-[13px] font-medium text-sub">{shortDate(x.d)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Units({ a }: { a: Announcement }) {
  const prog = PROGRAMS[a.program];
  const priceOf = (u: Announcement["units"][number]) =>
    u.price ? manwon(u.price) : u.deposit ? `${u.minimum ? "최소 " : ""}보증금 ${manwon(u.deposit)}${u.rent ? ` · 월 ${u.rent}만 원` : ""}` : "–";
  return (
    <>
      {/* 데스크탑 표 */}
      <table className="hidden w-full text-left text-[15px] md:table">
        <thead>
          <tr className="border-b border-ink text-[12px] text-muted">
            <th className="py-2.5 pr-4 font-semibold">주택형</th>
            <th className="py-2.5 pr-4 font-semibold">세대</th>
            <th className="py-2.5 text-right font-semibold">{prog.kind === "rent" ? "보증금 · 월 임대료" : "분양가"}</th>
          </tr>
        </thead>
        <tbody>
          {a.units.map((u) => (
            <tr key={u.name} className="border-b border-line last:border-b-0">
              <td className="py-3.5 pr-4 font-semibold text-ink">{u.name}</td>
              <td className="data py-3.5 pr-4 font-medium text-sub">{u.units.toLocaleString("ko-KR")}세대</td>
              <td className="data py-3.5 text-right text-ink">{priceOf(u)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* 모바일: 한 줄에 다 보이게 쌓는다 */}
      <ul className="md:hidden">
        {a.units.map((u) => (
          <li key={u.name} className="border-b border-line py-3.5 last:border-b-0">
            <p className="flex items-baseline justify-between gap-3">
              <span className="text-[16px] font-semibold text-ink">{u.name}</span>
              <span className="data text-[14px] text-sub">{u.units.toLocaleString("ko-KR")}세대</span>
            </p>
            <p className="data mt-1 text-[15px] text-ink">{priceOf(u)}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

export function NoticeView({ id }: { id: string }) {
  const hydrated = useHydrated();
  const { profile } = useProfile();
  const a = useMemo(() => (hydrated ? sampleAnnouncements().find((x) => x.id === id) : undefined), [hydrated, id]);
  const r = useMemo(() => (a ? evaluate(a, profile) : undefined), [a, profile]);
  const [pick, setPick] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <div className="min-h-dvh bg-wash">
        <AppHeader />
        <div className="wrap-app pt-28">
          <div className="h-10 w-2/3 animate-pulse rounded-[4px] bg-well" />
          <div className="mt-6 h-64 animate-pulse rounded-[4px] bg-well" />
        </div>
      </div>
    );
  }
  if (!a || !r) {
    return (
      <div className="min-h-dvh bg-wash">
        <AppHeader />
        <div className="wrap-app pt-40">
          <p className="t-h2">공고를 찾을 수 없어요</p>
          <div className="mt-6">
            <ButtonLink href="/results" arrow>
              공고 목록으로
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  const g = r.groups.find((x) => x.group.id === pick) ?? r.best;
  const v = VERDICT[r.phase === "closed" ? "closed" : g.verdict];
  const prog = PROGRAMS[a.program];
  const source = SOURCES.find((s) => s.id === a.source);
  const empty = isEmptyProfile(profile);
  const guide = GUIDE_SLUG[a.program];
  const totalUnits = a.units.reduce((s, u) => s + u.units, 0);
  const cheapest = [...a.units].sort((x, y) => (x.price ?? x.deposit ?? 0) - (y.price ?? y.deposit ?? 0))[0];

  const figures = [
    { k: "공급", v: `${totalUnits.toLocaleString("ko-KR")}세대` },
    prog.kind === "rent"
      ? { k: cheapest?.minimum ? "보증금(최소)" : "보증금", v: cheapest?.deposit ? manwon(cheapest.deposit) : "공고 참고", sub: cheapest?.rent ? `월 ${cheapest.rent}만 원부터` : undefined }
      : { k: "분양가", v: cheapest?.price ? `${manwon(cheapest.price)}부터` : "공고 참고" },
    { k: "당첨 발표", v: a.schedule.winners ? shortDate(a.schedule.winners) : "공고 참고" },
  ];

  return (
    <div className="min-h-dvh bg-wash">
      <AppHeader />
      <main className="wrap-app pb-20 pt-24 md:pb-28 md:pt-28">
        <Link href="/results" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-sub hover:text-ink">
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M13 8H3.5M7.5 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          공고 목록
        </Link>
        {a.sample && (
          <div className="mt-4">
            <SampleNotice />
          </div>
        )}

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
          <div className="min-w-0">
            {/* 제목 */}
            <p className="text-[13px] font-semibold text-sub">
              {a.agency} · {prog.name} · {prog.kind === "rent" ? "임대" : "분양"} · {placeText(a)}
            </p>
            <h1 className="t-h1 mt-2">{a.complex}</h1>
            <p className="t-body mt-2 text-sub">{a.title}</p>
            {!empty && (
              <a href="#verdict-title" className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-y border-line py-3 lg:hidden">
                <StatusBadge status={badgeStatus(r)}>{VERDICT[badgeStatus(r)].label}</StatusBadge>
                {r.best.rank && r.verdict !== "no" && r.phase !== "closed" && (
                  <span className={`text-[15px] font-bold ${rankTone(r.verdict, r.best.rank)}`}>{r.best.rank.label}</span>
                )}
                <span className={`ml-auto text-[14px] font-semibold tabular ${isUrgent(r) ? "text-hot-ink" : "text-sub"}`}>{dayText(r).line}</span>
              </a>
            )}

            {/* 핵심 수치 */}
            <dl className="mt-6 grid grid-cols-3 border-y border-ink">
              {figures.map((f, i) => (
                <div key={f.k} className={`py-4 ${i ? "border-l border-line pl-4" : ""}`}>
                  <dt className="text-[12px] font-semibold text-muted">{f.k}</dt>
                  <dd className="num mt-1 text-[17px] leading-tight text-ink md:text-[22px]">{f.v}</dd>
                  {"sub" in f && f.sub && <dd className="mt-0.5 text-[12px] text-sub">{f.sub}</dd>}
                </div>
              ))}
            </dl>
            <ul className="mt-4 space-y-1.5">
              {[...a.summary, prog.blurb].map((s) => (
                <li key={s} className="t-small flex gap-2.5 text-body">
                  <span aria-hidden className="mt-[0.7em] h-px w-2 shrink-0 bg-ink" />
                  {s}
                </li>
              ))}
            </ul>


            {/* 내 자격 */}
            <section className="mt-12 md:mt-14" aria-labelledby="verdict-title">
              <div className="section-head">
                <span id="verdict-title">나도 신청할 수 있을까?</span>
                {empty && (
                  <Link href="/check" className="text-ink underline decoration-line-strong underline-offset-4">
                    조건 넣고 확인하기
                  </Link>
                )}
              </div>

              {r.groups.length > 1 && (
                <div role="tablist" aria-label="공급 대상" className="no-scrollbar mask-fade-r mt-4 flex gap-5 overflow-x-auto border-b border-line md:[mask-image:none]">
                  {r.groups.map((x) => {
                    const on = x.group.id === g.group.id;
                    const xs = r.phase === "closed" ? "closed" : x.verdict;
                    return (
                      <button
                        key={x.group.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => setPick(x.group.id)}
                        className={`relative inline-flex shrink-0 items-center gap-1.5 pb-3 pt-1 text-[15px] font-semibold ${on ? "text-ink" : "text-muted hover:text-ink"}`}
                      >
                        <WinGlyph state={xs} />
                        {x.group.label}
                        {on && <motion.span layoutId="group-line" className="absolute inset-x-0 -bottom-px h-[2px] bg-ink" transition={SPRING.ui} />}
                      </button>
                    );
                  })}
                </div>
              )}

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={g.group.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: DUR.fast }}
                  className="mt-5 rounded-[4px] bg-page px-5 py-5 ring-1 ring-inset ring-line md:px-7 md:py-6"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <StatusBadge status={r.phase === "closed" ? "closed" : g.verdict}>{v.label}</StatusBadge>
                    {basisText(g.group) && <span className="t-caption text-muted">{basisText(g.group)}</span>}
                  </div>
                  <p className="t-h2 mt-2">{v.headline}</p>
                  {g.rank && g.verdict !== "no" && (
                    <div className="mt-4">
                      <p className={`t-num-m ${rankTone(g.verdict, g.rank)}`}>{g.rank.label}</p>
                      {g.rank.detail && <p className="t-small mt-1 text-sub">{g.rank.detail}</p>}
                    </div>
                  )}

                  <SupplyShare a={a} pick={g.group.id} />

                  <ul className="mt-6 border-t border-ink">
                    <li className="hidden grid-cols-[20px_112px_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 py-2.5 text-[12px] font-semibold text-muted md:grid">
                      <span />
                      <span>조건</span>
                      <span>필요 조건</span>
                      <span>내 상황</span>
                    </li>
                    {g.checks.map((c, i) => (
                      <CheckRow key={`${c.key}-${i}`} c={c} i={i} />
                    ))}
                  </ul>
                  {g.rankChecks.length > 0 && g.verdict !== "no" && (
                    <>
                      <p className="mt-7 text-[14px] font-semibold text-ink">1순위 조건 — 하나라도 모자라면 2순위로 신청해요</p>
                      <ul className="mt-2 border-t border-ink">
                        {g.rankChecks.map((c, i) => (
                          <CheckRow key={`r-${c.key}-${i}`} c={c} i={g.checks.length + i} />
                        ))}
                      </ul>
                    </>
                  )}
                  <div className="mt-7 border-t border-line pt-4">
                    <p className="text-[14px] font-semibold text-ink">뽑는 방식</p>
                    <ul className="mt-2 space-y-1.5">
                      {g.notes.map((n) => (
                        <li key={n} className="t-small flex gap-2.5 text-body">
                          <span aria-hidden className="mt-[0.7em] h-px w-2 shrink-0 bg-muted" />
                          {n}
                        </li>
                      ))}
                    </ul>
                    {guide && (
                      <Link href={`/guide/${guide}`} className="mt-3 inline-block text-[14px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                        {prog.name} 자격 기준 근거 보기
                      </Link>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              {g.score && (
                <div className="mt-4 lg:hidden">
                  <ScoreCard g={g} />
                </div>
              )}
            </section>

            {/* 모바일: 날짜 카드는 판정 다음 */}
            <div className="mt-6 lg:hidden">
              <DayCard r={r} />
            </div>

            <NextSteps r={r} g={g} />

            <section className="mt-12 md:mt-14" aria-labelledby="schedule-title">
              <div className="section-head">
                <span id="schedule-title">일정</span>
              </div>
              <div className="mt-5 rounded-[4px] bg-page p-5 ring-1 ring-inset ring-line md:p-7">
                <Timeline r={r} />
              </div>
            </section>

            <section className="mt-12 md:mt-14" aria-labelledby="units-title">
              <div className="section-head">
                <span id="units-title">주택형</span>
              </div>
              <div className="mt-3 rounded-[4px] bg-page px-5 py-2 ring-1 ring-inset ring-line md:px-7">
                <Units a={a} />
              </div>
            </section>

            <p className="t-small mt-10 max-w-[46em] text-muted">
              {a.sample ? "예시 공고라 실제 출처가 없어요. " : `출처: ${source?.owner} ${source?.name}${source?.kind === "manual" ? " (원문 확인 후 직접 정리)" : " (공공데이터포털)"}. `}
              결과는 공고문과 법령 기준을 옮겨 계산한 참고용이고, 최종 자격은 공급기관의 서류 심사로 정해져요.
            </p>
          </div>

          {/* 오른쪽 레일(데스크탑) */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <DayCard r={r} />
              {g.score && <ScoreCard g={g} />}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
