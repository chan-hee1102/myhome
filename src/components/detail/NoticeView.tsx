"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { badgeStatus, dayText, shortDate, topicFor, VERDICT } from "@/components/results/verdict";
import { AppHeader } from "@/components/ui/AppHeader";
import { StatusBadge } from "@/components/ui/Badge";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { SampleNotice } from "@/components/ui/SampleNotice";
import { sampleAnnouncements } from "@/lib/data/sample";
import { SOURCES } from "@/lib/data/sources";
import { isEmptyProfile, useHydrated, useProfile } from "@/lib/profile";
import type { Check } from "@/lib/rules/core";
import { manwon } from "@/lib/rules/core";
import { evaluate, type GroupResult, type NoticeResult } from "@/lib/rules/evaluate";
import { PROGRAMS } from "@/lib/rules/programs";
import { br, soft } from "@/lib/text";

const EASE = [0.16, 1, 0.3, 1] as const;

const MARK = {
  pass: { sym: "✓", cls: "text-ok", label: "충족" },
  unknown: { sym: "?", cls: "text-maybe", label: "확인 필요" },
  fail: { sym: "✕", cls: "text-fog", label: "미달" },
} as const;

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

function CheckRow({ c, i }: { c: Check; i: number }) {
  const topic = c.tri === "unknown" && c.ask?.length ? topicFor(c.ask) : undefined;
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.05 * i, ease: EASE }}
      className="grid grid-cols-[20px_minmax(0,1fr)] gap-x-3 border-b border-line py-4 last:border-b-0 md:grid-cols-[20px_104px_minmax(0,1fr)_minmax(0,1fr)] md:items-baseline"
    >
      <span className={`text-center text-[15px] ${MARK[c.tri].cls}`} aria-label={MARK[c.tri].label}>
        {MARK[c.tri].sym}
      </span>
      <span className="text-[15px] font-medium text-cloud">{c.label}</span>
      <span className="t-small col-start-2 mt-1 text-ash md:col-start-auto md:mt-0">
        <span className="mr-1.5 text-dim md:hidden">기준</span>
        {soft(c.need)}
      </span>
      <span className={`t-small col-start-2 mt-0.5 md:col-start-auto md:mt-0 ${c.tri === "fail" ? "text-dim line-through decoration-fog/50" : c.tri === "unknown" ? "text-maybe" : "text-cloud"}`}>
        <span className="mr-1.5 text-dim no-underline md:hidden">내 값</span>
        {soft(c.mine)}
      </span>
      {(c.hint || topic) && (
        <span className="col-start-2 mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 md:col-span-3 md:col-start-2">
          {c.hint && <span className="t-small text-mist">{c.hint}</span>}
          {topic && (
            <Link href={`/check?topic=${topic}`} className={buttonClass("secondary", "sm")}>
              알려주기
            </Link>
          )}
        </span>
      )}
    </motion.li>
  );
}

function ScoreCard({ g }: { g: GroupResult }) {
  const s = g.score!;
  return (
    <div className="rounded-[24px] bg-coal p-6 ring-1 ring-inset ring-line">
      <p className="t-small text-ash">{s.title}</p>
      <p className="mt-1 text-pure">
        <span className="num text-[64px] leading-none">
          <AnimatedNumber value={s.total} duration={1.2} />
        </span>
        <span className="num ml-1.5 text-[22px] text-ash">/ {s.max}</span>
      </p>
      {s.partial && <p className="t-caption mt-2 text-maybe">빈 칸은 0점으로 두고 계산했어요</p>}
      <ul className="mt-6 space-y-4">
        {s.lines.map((l, i) => (
          <li key={l.label}>
            <div className="flex items-baseline justify-between gap-3 text-[14px]">
              <span className="text-cloud">{l.label}</span>
              <span className="data shrink-0 text-[13px] text-mist">
                {l.points === null ? "?" : l.points} / {l.max}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
              <motion.div
                className={`h-full rounded-full ${l.points === null ? "bg-maybe/40" : "bg-signal"}`}
                initial={{ width: 0 }}
                animate={{ width: `${((l.points ?? 0) / l.max) * 100}%` }}
                transition={{ duration: 1.1, delay: 0.15 + i * 0.1, ease: EASE }}
              />
            </div>
            <p className="t-caption mt-1.5 text-dim">{l.note}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DayCard({ r }: { r: NoticeResult }) {
  const a = r.a;
  const day = dayText(r);
  return (
    <div className="rounded-[24px] bg-coal p-6 ring-1 ring-inset ring-line">
      <p className="t-small text-ash">{day.small}</p>
      <p className={`data mt-1 text-[44px] leading-none ${r.phase === "open" && r.daysLeft <= 3 ? "text-hot" : "text-pure"}`}>{day.big}</p>
      <dl className="mt-6 space-y-2.5 border-t border-line pt-5 text-[14px]">
        <div className="flex justify-between gap-4">
          <dt className="text-ash">접수</dt>
          <dd className="data text-cloud">
            {shortDate(a.schedule.applyStart)} – {shortDate(a.schedule.applyEnd)}
          </dd>
        </div>
        {a.schedule.winners && (
          <div className="flex justify-between gap-4">
            <dt className="text-ash">당첨 발표</dt>
            <dd className="data text-cloud">{shortDate(a.schedule.winners)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-ash">공급</dt>
          <dd className="data text-cloud">{a.units.reduce((s, u) => s + u.units, 0).toLocaleString("ko-KR")}세대</dd>
        </div>
      </dl>
      {a.noticeUrl && !a.sample ? (
        <a href={a.noticeUrl} target="_blank" rel="noopener noreferrer" className={`${buttonClass("primary", "md", { block: true })} mt-6`}>
          공고 원문 보기
        </a>
      ) : (
        <p className="t-small mt-6 rounded-[12px] px-3 py-2.5 text-center text-dim ring-1 ring-inset ring-line">예시 공고라 원문이 없어요</p>
      )}
    </div>
  );
}

function Timeline({ r }: { r: NoticeResult }) {
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
    <ol className="relative grid gap-6 md:grid-cols-[repeat(auto-fit,minmax(0,1fr))] md:gap-0">
      {/* 연결선: 모바일 세로 / 데스크탑 가로 */}
      <span aria-hidden className="absolute bottom-2 left-[5px] top-2 w-px bg-white/10 md:bottom-auto md:left-[5px] md:right-0 md:top-[5px] md:h-px md:w-auto" />
      <motion.span
        aria-hidden
        className="absolute left-[5px] top-[5px] hidden h-px origin-left bg-pure md:block"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: EASE }}
        style={{ width: `${Math.max(0, (passed - 0.5) / steps.length) * 100}%` }}
      />
      {steps.map((x, i) => {
        const done = toTime(x.d) <= t;
        return (
          <motion.li
            key={x.k}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.07, ease: EASE }}
            className="relative flex items-center gap-4 md:block md:pr-3"
          >
            <span className={`relative z-10 block size-[11px] shrink-0 rounded-full border-2 ${done ? "border-pure bg-pure" : "border-white/30 bg-obsidian"}`} />
            <div className="md:mt-4">
              <p className={`text-[14px] font-medium ${done ? "text-ash" : "text-cloud"}`}>{x.k}</p>
              <p className="data mt-0.5 text-[13px] text-mist">{shortDate(x.d)}</p>
            </div>
          </motion.li>
        );
      })}
    </ol>
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
      <div className="min-h-dvh">
        <AppHeader />
        <div className="wrap-app pt-36">
          <div className="h-10 w-2/3 animate-pulse rounded-[12px] bg-coal" />
          <div className="mt-6 h-64 animate-pulse rounded-[24px] bg-coal" />
        </div>
      </div>
    );
  }
  if (!a || !r) {
    return (
      <div className="min-h-dvh">
        <AppHeader />
        <div className="wrap-app pt-40 text-center">
          <p className="t-display-m text-pure">공고를 찾을 수 없어요</p>
          <div className="mt-8">
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

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <main className="wrap-app pb-20 pt-28 md:pb-32 md:pt-36">
        <Link href="/results" className={`${buttonClass("ghost", "sm")} -ml-3.5`}>
          <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M13 8H3.5M7.5 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          공고 목록
        </Link>
        {a.sample && (
          <div className="mt-4">
            <SampleNotice />
          </div>
        )}

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {/* 제목 */}
            <p className="t-caption text-dim">
              {a.agency} · {prog.name} · {prog.kind === "rent" ? "임대" : "분양"}
            </p>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.1, ease: EASE }} className="t-display-m mt-3 text-pure">
              {a.complex}
            </motion.h1>
            <p className="t-body mt-3 text-mist">
              {a.sido} {a.sigungu} · {a.title}
            </p>
            <ul className="mt-6 space-y-2">
              {[...a.summary, prog.blurb].map((s) => (
                <li key={s} className="t-body flex gap-3 text-ash">
                  <span aria-hidden className="mt-[0.7em] size-1 shrink-0 rounded-full bg-ash" />
                  {s}
                </li>
              ))}
            </ul>

            {/* 모바일: D-day 요약을 제목 바로 아래 */}
            <div className="mt-8 lg:hidden">
              <DayCard r={r} />
            </div>

            {/* 내 판정 */}
            <section className="mt-16 md:mt-20" aria-labelledby="verdict-title">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id="verdict-title" className="t-display-s text-pure">
                  내 판정
                </h2>
                {empty && (
                  <Link href="/check" className={buttonClass("secondary", "sm")}>
                    조건 넣고 판정받기
                  </Link>
                )}
              </div>
              {r.groups.length > 1 && (
                <div className="no-scrollbar mask-fade-r -mx-5 mt-6 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0 md:mask-none" role="tablist" aria-label="공급 대상">
                  {r.groups.map((x) => {
                    const on = x.group.id === g.group.id;
                    const xv = VERDICT[r.phase === "closed" ? "closed" : x.verdict];
                    return (
                      <button
                        key={x.group.id}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => setPick(x.group.id)}
                        className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-[10px] px-3.5 text-[14px] font-semibold transition-colors ${
                          on ? "bg-pure text-void" : "text-mist ring-1 ring-inset ring-white/14 hover:text-pure"
                        }`}
                      >
                        <span className={`size-1.5 rounded-full ${xv.dot}`} />
                        {x.group.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={g.group.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="mt-6 rounded-[24px] bg-coal p-6 ring-1 ring-inset ring-line md:p-8"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={r.phase === "closed" ? "closed" : g.verdict}>{v.label}</StatusBadge>
                    {g.group.basis === "template" && <span className="t-caption text-dim">법령 기본값으로 추정</span>}
                  </div>
                  <p className="t-display-s mt-4 text-pure">{v.headline}</p>
                  {g.rank && g.verdict !== "no" && (
                    <div className="mt-5 rounded-[12px] bg-white/[0.05] px-4 py-3.5">
                      <p className="text-[15px] font-semibold text-pure">{g.rank.label}</p>
                      {g.rank.detail && <p className="t-small mt-1 text-ash">{g.rank.detail}</p>}
                    </div>
                  )}
                  <ul className="mt-6 border-t border-line">
                    <li className="t-caption hidden grid-cols-[20px_104px_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 py-3 text-dim md:grid">
                      <span />
                      <span>조건</span>
                      <span>기준</span>
                      <span>내 값</span>
                    </li>
                    {g.checks.map((c, i) => (
                      <CheckRow key={`${c.key}-${i}`} c={c} i={i} />
                    ))}
                  </ul>
                  {g.rankChecks.length > 0 && g.verdict !== "no" && (
                    <>
                      <p className="t-small mt-8 font-medium text-ash">{br("1순위 조건 · | 하나라도 모자라면 2순위로 신청해요")}</p>
                      <ul className="mt-2 border-t border-line">
                        {g.rankChecks.map((c, i) => (
                          <CheckRow key={`r-${c.key}-${i}`} c={c} i={g.checks.length + i} />
                        ))}
                      </ul>
                    </>
                  )}
                  <div className="mt-8 rounded-[12px] bg-white/[0.03] px-4 py-4 ring-1 ring-inset ring-line">
                    <p className="t-small font-medium text-ash">뽑는 방식</p>
                    <ul className="mt-2 space-y-2">
                      {g.notes.map((n) => (
                        <li key={n} className="t-small flex gap-3 text-mist">
                          <span aria-hidden className="mt-[0.65em] size-1 shrink-0 rounded-full bg-fog" />
                          {n}
                        </li>
                      ))}
                    </ul>
                    {guide && (
                      <Link href={`/guide/${guide}`} className="t-small mt-3 inline-flex items-center gap-1.5 font-semibold text-pale-iris hover:text-pure">
                        {prog.name} 자격 기준 근거 보기 →
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

            <section className="mt-16 md:mt-20" aria-labelledby="schedule-title">
              <h2 id="schedule-title" className="t-display-s text-pure">
                일정
              </h2>
              <div className="mt-8">
                <Timeline r={r} />
              </div>
            </section>

            <section className="mt-16 md:mt-20" aria-labelledby="units-title">
              <h2 id="units-title" className="t-display-s text-pure">
                주택형
              </h2>
              <div className="no-scrollbar mt-6 overflow-x-auto rounded-[20px] ring-1 ring-inset ring-line">
                <table className="w-full min-w-[480px] text-left text-[14px]">
                  <thead className="t-caption bg-white/[0.03] text-dim">
                    <tr>
                      <th className="px-5 py-3 font-semibold">타입</th>
                      <th className="px-4 py-3 font-semibold">전용면적</th>
                      <th className="px-4 py-3 font-semibold">세대</th>
                      <th className="px-5 py-3 text-right font-semibold">{prog.kind === "rent" ? "보증금 / 월세" : "분양가"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {a.units.map((u) => (
                      <tr key={u.name} className="border-t border-line">
                        <td className="px-5 py-3.5 text-cloud">{u.name}</td>
                        <td className="data px-4 py-3.5 font-normal text-mist">{u.area}㎡</td>
                        <td className="data px-4 py-3.5 font-normal text-mist">{u.units.toLocaleString("ko-KR")}</td>
                        <td className="data px-5 py-3.5 text-right font-normal text-cloud">
                          {u.price ? manwon(u.price) : u.deposit ? `${u.minimum ? "최소 " : ""}${manwon(u.deposit)}${u.rent ? ` / ${u.rent}만` : ""}` : "–"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="t-small mt-12 max-w-[46em] text-dim">
              출처: {source?.owner} {source?.name}
              {source?.kind === "manual" ? " (원문 확인 후 직접 정리)" : " (공공데이터포털)"}. {br("판정은 공고문과 법령 기준을 옮겨 계산한 참고용 결과이며, | 최종 자격은 공급기관의 서류 심사로 정해져요.")}
            </p>
          </div>

          {/* 오른쪽 레일(데스크탑) */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 space-y-4">
              <DayCard r={r} />
              {g.score && <ScoreCard g={g} />}
              <div className="rounded-[20px] p-5 ring-1 ring-inset ring-line">
                <p className="t-small text-ash">{badgeStatus(r) === "closed" ? "접수가 끝난 공고예요" : "조건이 바뀌었나요?"}</p>
                <Link href="/check" className={`${buttonClass("secondary", "sm", { block: true })} mt-3`}>
                  조건 수정하기
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
