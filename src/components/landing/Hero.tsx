"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { CountUp } from "@/components/motion/CountUp";
import { LineReveal } from "@/components/motion/Reveal";
import { StatusBadge, type Status } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { br } from "@/lib/text";

const EASE = [0.16, 1, 0.3, 1] as const;

const ROWS: { s: Status; label: string; prog: string; name: string; meta: string; d: string }[] = [
  { s: "ok", label: "신청 가능", prog: "LH 행복주택 · 청년", name: "강동 고덕 햇살마을", meta: "예상 1순위", d: "D-6" },
  { s: "ok", label: "신청 가능", prog: "HUG 든든전세", name: "수원 영통 든든전세", meta: "추첨으로 뽑아요", d: "D-11" },
  { s: "maybe", label: "확인 필요", prog: "SH 청년안심주택", name: "마포 합정 청년주택", meta: "자산만 알려주세요", d: "D-3" },
  { s: "ok", label: "신청 가능", prog: "청약홈 민영 아파트", name: "광명 철산 리버테라스", meta: "1순위 · 가점 54점", d: "D-8" },
];

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-brand" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 결과 화면을 줄인 폰 목업 + 둘레에 떠 있는 카드 두 장(스크롤하면 서로 다른 속도로 움직인다) */
function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const phoneY = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const cardAY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const cardBY = useTransform(scrollYProgress, [0, 1], [0, -70]);

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-[520px]">
      <motion.div
        initial={{ opacity: 0, y: 48 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.3, ease: EASE }}
      >
        <motion.div style={{ y: phoneY }} className="relative mx-auto w-[min(86vw,340px)] md:w-[360px]">
          {/* 기기 */}
          <div className="rounded-[48px] bg-[#e9edf2] p-[9px] shadow-pop ring-1 ring-inset ring-white">
            <div className="relative h-[560px] overflow-hidden rounded-[40px] bg-wash md:h-[620px]">
              <div className="absolute left-1/2 top-2.5 z-10 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-ink" />
              <div className="data flex items-center justify-between px-7 pt-3.5 text-[12px] text-ink">
                <span>9:41</span>
                <span className="flex items-center gap-1" aria-hidden>
                  <span className="h-2.5 w-4 rounded-[3px] border border-ink/70" />
                </span>
              </div>
              <div className="px-5 pt-9">
                <div className="flex flex-wrap gap-1">
                  {["97년생", "서울", "미혼", "무주택"].map((c) => (
                    <span key={c} className="rounded-full bg-page px-2.5 py-1 text-[11px] font-medium text-sub shadow-card">
                      {c}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-[15px] font-semibold text-sub">지금 신청할 수 있는 공고</p>
                <p className="mt-0.5 text-[40px] font-bold leading-tight tracking-[-0.03em] text-ink">
                  <span className="text-brand">
                    <CountUp to={7} duration={1.6} />
                  </span>
                  건
                </p>
              </div>
              <ul className="mt-4 space-y-2 px-3.5">
                {ROWS.map((r, i) => (
                  <motion.li
                    key={r.name}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.7 + i * 0.12, ease: EASE }}
                    className="rounded-[18px] bg-page p-4 shadow-card"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <StatusBadge status={r.s}>{r.label}</StatusBadge>
                      <span className={`data text-[14px] ${r.d === "D-3" ? "text-hot-ink" : "text-ink"}`}>{r.d}</span>
                    </div>
                    <p className="mt-2.5 text-[12px] font-medium text-muted">{r.prog}</p>
                    <p className="mt-0.5 truncate text-[16px] font-bold tracking-[-0.02em] text-ink">{r.name}</p>
                    <p className={`mt-0.5 text-[12px] ${r.s === "maybe" ? "text-maybe-ink" : "text-sub"}`}>{r.meta}</p>
                  </motion.li>
                ))}
              </ul>
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-wash to-transparent" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* 떠 있는 카드 — 가점 */}
      <motion.div
        style={{ y: cardAY }}
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 1.3, ease: EASE }}
        className="absolute -left-2 top-[58%] hidden w-[188px] sm:block md:-left-20"
      >
        <div className="animate-[float_6s_ease-in-out_infinite] rounded-[20px] bg-page p-4 shadow-lift">
          <p className="text-[12px] font-semibold text-muted">내 청약 가점</p>
          <p className="mt-1 text-ink">
            <span className="num text-[32px] leading-none">
              <CountUp to={54} duration={1.8} />
            </span>
            <span className="ml-1 text-[14px] font-semibold text-faint">/ 84점</span>
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-well">
            <motion.div
              className="h-full rounded-full bg-brand"
              initial={{ width: 0 }}
              animate={{ width: `${(54 / 84) * 100}%` }}
              transition={{ duration: 1.6, delay: 1.5, ease: EASE }}
            />
          </div>
        </div>
      </motion.div>

      {/* 떠 있는 카드 — 마감 알림 */}
      <motion.div
        style={{ y: cardBY }}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.9, delay: 1.6, ease: EASE }}
        className="absolute -right-2 top-[21%] hidden w-[212px] sm:block md:-right-14"
      >
        <div className="animate-[float_7s_ease-in-out_1s_infinite] flex items-center gap-3 rounded-[20px] bg-page p-3.5 shadow-lift">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-hot-soft text-hot-ink">
            <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="10" cy="10.5" r="6.5" />
              <path d="M10 7v3.5l2.2 1.5M8 2.5h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-bold text-ink">3일 뒤 마감</span>
            <span className="block truncate text-[12px] text-muted">마포 합정 청년주택</span>
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-16">
      {/* 은은한 색 번짐 — 흰 바탕이 밋밋하지 않게 */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(48% 56% at 82% 30%, rgba(74,144,247,0.16), transparent 70%), radial-gradient(40% 46% at 8% 12%, rgba(18,168,112,0.08), transparent 70%), linear-gradient(180deg, #ffffff 0%, #f5f8fd 100%)",
        }}
      />
      <div className="wrap relative grid items-center gap-14 pb-16 pt-10 md:pb-24 md:pt-16 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-8 lg:pb-28 lg:pt-20">
        <div className="flex flex-col items-start">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-page pl-1.5 pr-4 text-[14px] font-medium text-sub shadow-card ring-1 ring-inset ring-line"
          >
            <span className="inline-flex h-6 items-center rounded-full bg-brand-soft px-2.5 text-[12px] font-bold text-brand-ink">무료</span>
            <span>{br("LH · SH · GH · HUG · 청약홈 | 공고를 한곳에")}</span>
          </motion.p>

          <h1 className="t-display-xl mt-6 md:mt-8">
            <LineReveal
              immediate
              delay={0.15}
              lines={[
                <>
                  내 조건에 맞는 <span className="text-brand">청약</span>만
                </>,
                br("골라 드려요"),
              ]}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.45 }}
            className="t-body-l mt-5 max-w-[26em] text-sub md:mt-6"
          >
            {br("나이, 사는 곳, 가족, 집, 소득. | 다섯 가지만 누르면 | 지금 신청할 수 있는 공고를 | 바로 알려 드려요.")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
            className="mt-8 grid w-full gap-2.5 sm:w-auto sm:grid-cols-[auto_auto] md:mt-10"
          >
            <ButtonLink href="/check" size="lg" arrow block>
              1분 만에 확인하기
            </ButtonLink>
            <ButtonLink href="/guide" size="lg" variant="outline" block>
              청약 기준 알아보기
            </ButtonLink>
          </motion.div>

          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[14px] font-medium text-sub"
          >
            {["로그인 없이", "개인정보는 내 기기에만", "2026년 기준 반영"].map((t) => (
              <li key={t} className="flex items-center gap-1.5">
                <Check />
                {t}
              </li>
            ))}
          </motion.ul>
        </div>

        <HeroVisual />
      </div>
    </section>
  );
}
