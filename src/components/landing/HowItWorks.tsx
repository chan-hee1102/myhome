"use client";

import { AnimatePresence, motion, useInView } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { LineReveal } from "@/components/motion/Reveal";
import { StatusBadge } from "@/components/ui/Badge";
import { br } from "@/lib/text";

const EASE = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    title: [br("다섯 가지만"), br("답하세요")],
    body: br("몇 년생인지, 어디 사는지, 가족, 집, 소득. | 전부 눌러서 고르는 방식이라 1분이면 끝나요. | 통장이나 자산은 나중에 더해도 돼요."),
    foot: "입력한 정보는 이 기기에만 저장돼요",
  },
  {
    title: [br("공고마다"), br("대조해 드려요")],
    body: br("나이·혼인·무주택·소득·자산 기준을 | 공고별로 하나씩 맞춰 봐요. | 결과는 「신청 가능」「확인 필요」「해당 없음」 | 세 가지로만 말해요."),
    foot: "모르는 칸은 추측하지 않고 「확인 필요」로 남겨요",
  },
  {
    title: [br("순위와 가점까지"), br("계산해요")],
    body: br("임대주택은 예상 순위를, | 분양은 1순위 여부와 가점 84점 중 몇 점인지 | 보여 드려요. | 어떤 항목에서 점수가 났는지도 함께요."),
    foot: "근거가 되는 기준은 상세 화면에 그대로 적어 둬요",
  },
];

function ScreenQuestion() {
  return (
    <div className="flex h-full flex-col px-6 pb-6 pt-16">
      <div className="flex gap-1.5">
        {[1, 1, 1, 0, 0].map((on, i) => (
          <motion.span
            key={i}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.1 * i, duration: 0.6, ease: EASE }}
            className={`h-[3px] flex-1 origin-left rounded-full ${on ? "bg-pure" : "bg-white/15"}`}
          />
        ))}
      </div>
      <p className="eyebrow mt-8">3/5 · 가족</p>
      <p className="mt-3 font-[family-name:var(--font-display)] text-[28px] leading-[1.25] text-pure">가족 상황을 알려주세요</p>
      <div className="mt-7 grid grid-cols-2 gap-2">
        {["미혼", "결혼 예정", "결혼 7년 이내", "결혼 7년 넘음"].map((t, i) => (
          <motion.span
            key={t}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: EASE }}
            className={`flex h-12 items-center rounded-[14px] px-3.5 text-[14px] font-medium ${
              i === 0 ? "bg-pure text-void" : "text-cloud ring-1 ring-inset ring-white/14"
            }`}
          >
            {t}
          </motion.span>
        ))}
      </div>
      <p className="t-small mt-6 text-ash">미성년 자녀</p>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {["없음", "1명", "2명", "3명 이상"].map((t, i) => (
          <span
            key={t}
            className={`flex h-11 items-center justify-center rounded-[14px] text-[14px] font-medium whitespace-nowrap ${
              i === 0 ? "bg-pure text-void" : "text-cloud ring-1 ring-inset ring-white/14"
            }`}
          >
            {t}
          </span>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, ease: EASE }}
        className="mt-auto flex items-center justify-between rounded-[12px] bg-white/[0.07] px-4 py-3.5"
      >
        <span className="t-small text-ash">지금 조건으로 신청 가능</span>
        <span className="text-[15px] text-pure">
          <span className="num text-[24px]">12</span>건
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
    <div className="flex h-full flex-col px-5 pb-6 pt-16">
      <p className="font-[family-name:var(--font-display)] text-[26px] text-pure">
        신청 가능 <span className="num text-[30px]">7</span>건
      </p>
      <p className="t-small mt-1 text-ash">확인 필요 4 · 해당 없음 9</p>
      <ul className="mt-6 space-y-2">
        {ROWS.map((r, i) => (
          <motion.li
            key={r.t}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.7, ease: EASE }}
            className={`flex items-center gap-3 rounded-[14px] bg-white/[0.04] px-3.5 py-3 ring-1 ring-inset ring-line ${r.s === "no" ? "opacity-50" : ""}`}
          >
            <StatusBadge status={r.s}>{LABEL[r.s]}</StatusBadge>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-cloud">{r.t}</span>
              <span className="t-caption block truncate text-dim">{r.m}</span>
            </span>
            <span className="data text-[13px] text-mist">{r.d}</span>
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
    <div className="flex h-full flex-col px-6 pb-6 pt-16">
      <p className="eyebrow">청약홈 · 민영 아파트</p>
      <p className="t-small mt-3 text-ash">내 청약 가점</p>
      <p className="text-pure">
        <span className="num text-[64px] leading-none">54</span>
        <span className="num ml-1 text-[22px] text-ash">/ 84</span>
      </p>
      <div className="mt-7 space-y-5">
        {BARS.map((b, i) => (
          <div key={b.l}>
            <div className="flex justify-between text-[13px]">
              <span className="text-cloud">{b.l}</span>
              <span className="data text-ash">
                {b.v} / {b.m}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(b.v / b.m) * 100}%` }}
                transition={{ delay: 0.2 + i * 0.15, duration: 1.2, ease: EASE }}
                className="h-full rounded-full bg-signal"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-[12px] bg-white/[0.07] p-4">
        <p className="t-small text-ash">1순위 조건</p>
        <ul className="mt-2 space-y-1.5 text-[14px] text-cloud">
          {["청약통장 가입 2년 이상", "지역·면적별 예치금 충족", "세대주"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="text-ok">✓</span>
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
    <div className={`rounded-[52px] p-[10px] ${className}`} style={{ background: "linear-gradient(135deg, #3a3a3c, #131313 45%, #2b2b2c)" }}>
      <div className="relative h-[560px] overflow-hidden rounded-[43px] bg-obsidian md:h-[640px]">
        <div className="absolute left-1/2 top-3 z-10 h-[28px] w-[100px] -translate-x-1/2 rounded-full bg-black" />
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.5, ease: EASE }}
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
    <div ref={ref} className="flex flex-col justify-center py-12 lg:min-h-[92vh] lg:py-16">
      <p className="eyebrow">{i + 1}단계</p>
      <h3 className="t-display-l mt-4 text-pure">
        <LineReveal lines={s.title} />
      </h3>
      <p className="t-body-l mt-6 max-w-[27em] text-ash">{s.body}</p>
      <p className="t-small mt-6 inline-flex items-center gap-2 text-mist">
        <span className="size-1 rounded-full bg-signal" />
        {s.foot}
      </p>
      {/* 모바일은 옆에 붙는 폰이 없으니 단계마다 화면을 바로 아래 보여준다 */}
      <div className="mt-10 lg:hidden">
        <Phone active={i} className="mx-auto w-[min(84vw,340px)]" />
      </div>
    </div>
  );
}

export function HowItWorks() {
  const [active, setActive] = useState(0);
  return (
    <section id="how" aria-label="판정 방식" className="scroll-mt-10 py-8 md:py-16">
      <div className="wrap grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-24">
        <div>
          {STEPS.map((_, i) => (
            <Step key={i} i={i} onActive={setActive} />
          ))}
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-0 flex h-screen items-center">
            <div className="w-[380px]">
              <div className="mb-6 flex gap-2">
                {STEPS.map((_, i) => (
                  <span key={i} className={`h-[2px] flex-1 rounded-full transition-colors duration-500 ${i <= active ? "bg-pure" : "bg-white/15"}`} />
                ))}
              </div>
              <Phone active={active} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
