"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { LineReveal } from "@/components/motion/Reveal";
import { StatusBadge } from "@/components/ui/Badge";
import { br } from "@/lib/text";

const EASE = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    title: [br("다섯 가지만"), br("눌러 주세요")],
    body: br("나이, 사는 곳, 가족, 집, 소득. | 고르기만 하면 돼서 1분이면 끝나요."),
    foot: "입력한 정보는 이 기기에만 저장돼요",
  },
  {
    title: [br("공고마다"), br("대신 확인해요")],
    body: br("공고별 나이·소득·자산·무주택 기준을 | 하나씩 맞춰 보고 | 신청할 수 있는지 알려 드려요."),
    foot: "모르는 칸은 짐작하지 않고 「확인 필요」로 남겨요",
  },
  {
    title: [br("순위와 가점까지"), br("알려 드려요")],
    body: br("임대주택은 예상 순위를, | 분양은 1순위인지와 가점을 | 계산해 보여 드려요."),
    foot: "어떤 기준으로 계산했는지 그대로 보여 드려요",
  },
];

function ScreenQuestion() {
  return (
    <div className="flex h-full flex-col bg-page px-6 pb-6 pt-14">
      <div className="flex gap-1.5">
        {[1, 1, 1, 0, 0].map((on, i) => (
          <motion.span
            key={i}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.08 * i, duration: 0.5, ease: EASE }}
            className={`h-1 flex-1 origin-left rounded-full ${on ? "bg-brand" : "bg-well"}`}
          />
        ))}
      </div>
      <p className="mt-7 text-[13px] font-bold text-brand">3/5 · 가족</p>
      <p className="mt-2 text-[24px] font-bold leading-[1.3] tracking-[-0.03em] text-ink">가족 상황을 알려주세요</p>
      <div className="mt-6 grid grid-cols-2 gap-2">
        {["미혼", "결혼 예정", "결혼 7년 이내", "결혼 7년 넘음"].map((t, i) => (
          <motion.span
            key={t}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.05, duration: 0.5, ease: EASE }}
            className={`flex h-12 items-center rounded-[14px] px-3.5 text-[14px] font-semibold ${
              i === 0 ? "bg-brand-soft text-brand-ink ring-2 ring-inset ring-brand" : "text-body ring-1 ring-inset ring-line"
            }`}
          >
            {t}
          </motion.span>
        ))}
      </div>
      <p className="mt-6 text-[13px] font-semibold text-sub">미성년 자녀</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {["없음", "1명", "2명", "3명+"].map((t, i) => (
          <span
            key={t}
            className={`flex h-11 items-center justify-center rounded-[14px] text-[14px] font-semibold whitespace-nowrap ${
              i === 0 ? "bg-brand-soft text-brand-ink ring-2 ring-inset ring-brand" : "text-body ring-1 ring-inset ring-line"
            }`}
          >
            {t}
          </span>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6, ease: EASE }}
        className="mt-auto flex items-center justify-between rounded-[14px] bg-ok-soft px-4 py-3.5"
      >
        <span className="text-[13px] font-semibold text-ok-ink">지금 조건으로 신청 가능</span>
        <span className="text-[15px] font-bold text-ok-ink">
          <span className="num text-[22px]">12</span>건
        </span>
      </motion.div>
    </div>
  );
}

const ROWS = [
  { s: "ok", t: "행복주택 청년 · 강동 고덕", m: "LH · 예상 1순위", d: "D-6" },
  { s: "ok", t: "든든전세 · 수원 영통", m: "HUG · 추첨", d: "D-11" },
  { s: "maybe", t: "청년안심주택 · 마포 합정", m: "SH · 자산 정보 필요", d: "D-3" },
  { s: "ok", t: "민영 아파트 · 광명 철산", m: "청약홈 · 1순위 · 가점 54", d: "D-8" },
  { s: "no", t: "국민임대 · 부산 명지", m: "해당 지역 거주 아님", d: "D-14" },
] as const;

const LABEL = { ok: "가능", maybe: "확인", no: "없음" } as const;

function ScreenList() {
  return (
    <div className="flex h-full flex-col bg-wash px-4 pb-6 pt-14">
      <p className="px-1 text-[24px] font-bold tracking-[-0.03em] text-ink">
        신청 가능 <span className="text-brand">7</span>건
      </p>
      <p className="mt-1 px-1 text-[13px] text-muted">확인 필요 4 · 해당 없음 9</p>
      <ul className="mt-5 space-y-2">
        {ROWS.map((r, i) => (
          <motion.li
            key={r.t}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.07 * i, duration: 0.55, ease: EASE }}
            className={`flex items-center gap-3 rounded-[16px] bg-page px-3.5 py-3 shadow-card ${r.s === "no" ? "opacity-55" : ""}`}
          >
            <StatusBadge status={r.s}>{LABEL[r.s]}</StatusBadge>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-semibold text-ink">{r.t}</span>
              <span className="block truncate text-[12px] text-muted">{r.m}</span>
            </span>
            <span className={`data text-[13px] ${r.d === "D-3" ? "text-hot-ink" : "text-ink"}`}>{r.d}</span>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

const BARS = [
  { l: "무주택 기간", v: 18, m: 32 },
  { l: "부양가족", v: 20, m: 35 },
  { l: "통장 가입 기간", v: 16, m: 17 },
];

function ScreenScore() {
  return (
    <div className="flex h-full flex-col bg-page px-6 pb-6 pt-14">
      <p className="text-[13px] font-bold text-brand">청약홈 · 민영 아파트</p>
      <p className="mt-3 text-[14px] font-semibold text-sub">내 청약 가점</p>
      <p className="text-ink">
        <span className="num text-[56px] leading-none">54</span>
        <span className="ml-1 text-[18px] font-semibold text-faint">/ 84점</span>
      </p>
      <div className="mt-6 space-y-4">
        {BARS.map((b, i) => (
          <div key={b.l}>
            <div className="flex justify-between text-[13px]">
              <span className="font-medium text-body">{b.l}</span>
              <span className="data text-sub">
                {b.v} / {b.m}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-well">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(b.v / b.m) * 100}%` }}
                transition={{ delay: 0.15 + i * 0.12, duration: 1, ease: EASE }}
                className="h-full rounded-full bg-brand"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-[14px] bg-wash p-4">
        <p className="text-[13px] font-semibold text-sub">1순위 조건</p>
        <ul className="mt-2 space-y-1.5 text-[14px] text-body">
          {["청약통장 가입 2년 이상", "지역·면적별 예치금 충족", "세대주"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="grid size-4 place-items-center rounded-full bg-ok text-[10px] font-bold text-white">✓</span>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

const SCREENS = [ScreenQuestion, ScreenList, ScreenScore];

function Phone({ active, className = "" }: { active: number; className?: string }) {
  const Screen = SCREENS[active];
  return (
    <div className={`rounded-[46px] bg-[#e9edf2] p-[9px] shadow-lift ring-1 ring-inset ring-white ${className}`}>
      <div className="relative h-[540px] overflow-hidden rounded-[38px] bg-page md:h-[600px]">
        <div className="absolute left-1/2 top-2.5 z-10 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-ink" />
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="absolute inset-0"
          >
            <Screen />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function Step({ i, onActive }: { i: number; onActive: (i: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.55 });
  useEffect(() => {
    if (inView) onActive(i);
  }, [inView, i, onActive]);
  const s = STEPS[i];
  return (
    <div ref={ref} className="flex flex-col justify-center py-10 lg:min-h-[60vh] lg:py-12">
      <span className="grid size-10 place-items-center rounded-full bg-brand text-[17px] font-bold text-white">{i + 1}</span>
      <h3 className="t-display-l mt-5">
        <LineReveal lines={s.title} />
      </h3>
      <p className="t-body-l mt-5 max-w-[26em] text-sub">{s.body}</p>
      <p className="t-small mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-wash px-3.5 py-2 font-medium text-sub">
        <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-ok" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {s.foot}
      </p>
      {/* 모바일은 옆에 붙는 폰이 없으니 단계마다 화면을 바로 아래 보여준다 */}
      <div className="mt-8 lg:hidden">
        <Phone active={i} className="mx-auto w-[min(84vw,330px)]" />
      </div>
    </div>
  );
}

export function HowItWorks() {
  const [active, setActive] = useState(0);
  return (
    <section id="how" aria-labelledby="how-title" className="scroll-mt-16 py-16 md:py-24">
      <div className="wrap">
        <div className="text-center lg:text-left">
          <p className="eyebrow">이용 방법</p>
          <h2 id="how-title" className="t-display-l mt-3">
            <LineReveal lines={[br("세 단계면 끝나요")]} />
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-24">
          <div>
            {STEPS.map((_, i) => (
              <Step key={i} i={i} onActive={setActive} />
            ))}
          </div>
          <div className="hidden lg:block">
            <div className="sticky top-0 flex h-screen items-center">
              <div className="w-[360px]">
                <div className="mb-5 flex gap-2">
                  {STEPS.map((_, i) => (
                    <span key={i} className={`h-1 flex-1 rounded-full transition-colors duration-500 ${i <= active ? "bg-brand" : "bg-well"}`} />
                  ))}
                </div>
                <Phone active={active} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
