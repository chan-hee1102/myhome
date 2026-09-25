"use client";

import Link from "next/link";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import { DUR, EASE } from "@/components/motion/tokens";
import { dday } from "@/components/results/verdict";
import type { Announcement } from "@/lib/domain";
import { sampleAnnouncements } from "@/lib/data/sample";
import { placeText } from "@/lib/place";
import { useHydrated } from "@/lib/profile";
import { PROGRAMS } from "@/lib/rules/programs";
import { SITE } from "@/lib/site";

const DAY = 86_400_000;
const BEFORE = 7; // 오늘 앞으로 보여 줄 날
const SPAN = 30; // 띠 길이(일)

function parseDay(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d || 1).getTime();
}

interface Row {
  a: Announcement;
  s: number; // 띠 시작일 기준 접수 시작(일)
  e: number; // 접수 마감(일, 포함)
}

const pct = (d: number) => `${((d + 0.5) / SPAN) * 100}%`;

/**
 * 접수 일정 띠. 30일짜리 달력 위에 공고의 접수 기간이 막대로 놓인다.
 * 화면에 들어오면 「오늘」 세로선이 띠의 시작에서 오늘까지 한 번 걸어와 멈춘다(0.64초).
 * D-day는 처음부터 실제 오늘 기준으로 고정이다 — 선이 움직이는 동안 가짜 날짜를 보여 주지 않는다.
 * 모바일은 막대 대신 D-day 목록. 날짜는 브라우저에서만 계산한다.
 */
export function DeadlineBoard() {
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  const { rows, start } = useMemo(() => {
    if (!hydrated) return { rows: [] as Row[], start: 0 };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const start = today - BEFORE * DAY;
    const rows = sampleAnnouncements(now)
      .map((a) => ({ a, s: Math.round((parseDay(a.schedule.applyStart) - start) / DAY), e: Math.round((parseDay(a.schedule.applyEnd) - start) / DAY) }))
      .filter((r) => r.e >= BEFORE && r.s < SPAN)
      .sort((x, y) => x.e - y.e)
      .slice(0, 7);
    return { rows, start };
  }, [hydrated]);

  const line = useMotionValue(reduce ? BEFORE : 0);
  const left = useTransform(line, (v) => pct(v));
  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      line.set(BEFORE);
      return;
    }
    const c = animate(line, BEFORE, { duration: DUR.slow, ease: EASE.move });
    return () => c.stop();
  }, [inView, reduce, line]);

  const label = (i: number) => {
    const d = new Date(start + i * DAY);
    return `${d.getMonth() + 1}.${d.getDate()}`;
  };
  const openNow = rows.filter((r) => r.s <= BEFORE && BEFORE <= r.e).length;

  return (
    <section aria-labelledby="board-title" className="py-12 md:py-20">
      <div className="wrap">
        <div className="grid gap-3 lg:grid-cols-12 lg:items-end">
          <h2 id="board-title" className="t-h2 lg:col-span-6">
            마감이 가까운 공고부터
          </h2>
          <p className="t-body-l text-sub lg:col-span-6">
            LH, SH, GH, 청약홈 공고를 한 줄에 모았어요.{SITE.sampleData && <span className="ml-1.5 text-muted">(예시)</span>}
          </p>
        </div>

        <div ref={ref} className="mt-10 md:mt-12">
          {/* 데스크탑: 날짜 눈금 + 막대 */}
          <div className="hidden md:block">
            <div className="grid grid-cols-[260px_minmax(0,1fr)]">
              <div />
              <div className="relative h-7 text-[14px] md:text-[15px] font-medium text-muted">
                {hydrated &&
                  [0, 14, 21, 28].map((t) => (
                    <span key={t} className="absolute -translate-x-1/2 tabular" style={{ left: pct(t) }}>
                      {label(t)}
                    </span>
                  ))}
                {hydrated && (
                  <motion.span className="absolute -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-ink px-1.5 py-0.5 text-[14px] md:text-[15px] font-semibold text-white" style={{ left }}>
                    오늘 {label(BEFORE)}
                  </motion.span>
                )}
              </div>
            </div>
            <div className="relative">
              {/* 오늘 선 — 막대 아래 층 */}
              <div aria-hidden className="pointer-events-none absolute inset-y-0 left-[260px] right-0">
                <motion.div className="absolute inset-y-0 w-[1.5px] -translate-x-1/2 bg-ink" style={{ left }} />
              </div>
              <ul className="relative border-t border-ink">
                {(hydrated ? rows : Array.from({ length: 6 }, () => null)).map((r, i) => (
                  <li key={r ? r.a.id : i} className="border-b border-line">
                    {r ? <BarRow r={r} /> : <div className="h-[64px]" />}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 모바일: D-day 목록 */}
          <ul className="border-t border-line-strong md:hidden">
            {(hydrated ? rows : Array.from({ length: 5 }, () => null)).map((r, i) => (
              <li key={r ? r.a.id : i} className="border-b border-line">
                {r ? <ListRow r={r} /> : <div className="h-[68px]" />}
              </li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="t-small text-sub">
              {hydrated && (
                <>
                  오늘 접수 중인 공고 <span className="data text-ink">{openNow}</span>건
                </>
              )}
            </p>
            <Link href="/results" className="inline-flex h-11 items-center text-[16px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              공고 전체 보기
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** 문구는 목록·상세와 같은 dday()로 만든다 */
function dayOf(r: Row) {
  const dates = { start: r.a.schedule.applyStart, end: r.a.schedule.applyEnd };
  if (BEFORE > r.e) return { ...dday("closed", 0, 0, dates), tone: "text-muted" };
  if (BEFORE < r.s) return { ...dday("upcoming", r.s - BEFORE, 0, dates), tone: "text-sub" };
  const left = r.e - BEFORE;
  return { ...dday("open", 0, left, dates), tone: left <= 3 ? "text-hot-ink" : "text-ink" };
}

function BarRow({ r }: { r: Row }) {
  const s = Math.max(0, r.s);
  const e = Math.min(SPAN - 1, r.e);
  const open = r.s <= BEFORE && BEFORE <= r.e;
  const hot = open && r.e - BEFORE <= 3;
  const d = dayOf(r);
  return (
    <Link href={`/notice/${r.a.id}`} className="group grid grid-cols-[260px_minmax(0,1fr)] items-center">
      <span className="min-w-0 py-3 pr-4">
        <span className="block truncate text-[16px] font-semibold text-ink group-hover:underline">{r.a.complex}</span>
        <span className="block truncate text-[14px] md:text-[15px] text-muted">
          {r.a.agency} · {PROGRAMS[r.a.program].name} · {r.a.sido}
        </span>
      </span>
      <span className="relative block h-[64px]">
        <span
          className={`absolute top-1/2 h-2.5 -translate-y-1/2 rounded-[2px] ${hot ? "bg-hot" : open ? "bg-bar" : "bg-page ring-[1.5px] ring-inset ring-bar"}`}
          style={{ left: `${(s / SPAN) * 100}%`, width: `${((e - s + 1) / SPAN) * 100}%` }}
        />
        <span
          className={`data absolute top-1/2 -translate-y-1/2 whitespace-nowrap pl-2 text-[15px] ${d.tone}`}
          style={{ left: `min(${((e + 1) / SPAN) * 100}%, calc(100% - 116px))` }}
        >
          {BEFORE < r.s ? d.line : BEFORE > r.e ? "마감" : r.e === BEFORE ? "오늘 마감" : d.big}
        </span>
      </span>
    </Link>
  );
}

function ListRow({ r }: { r: Row }) {
  const d = dayOf(r);
  return (
    <Link href={`/notice/${r.a.id}`} className="grid grid-cols-[96px_minmax(0,1fr)] items-center gap-3 py-3.5">
      <span className="min-w-0">
        <span className={`num block whitespace-nowrap text-[20px] leading-tight ${d.tone}`}>{d.big}</span>
        <span className="block whitespace-nowrap text-[14px] md:text-[15px] font-medium text-sub">{d.small}</span>
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[16px] font-semibold text-ink">{r.a.complex}</span>
        <span className="block truncate text-[14px] md:text-[15px] text-muted">
          {r.a.agency} · {PROGRAMS[r.a.program].name} · {placeText(r.a)}
        </span>
      </span>
    </Link>
  );
}
