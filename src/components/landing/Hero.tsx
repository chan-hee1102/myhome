"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { LineReveal } from "@/components/motion/Reveal";
import { StatusBadge } from "@/components/ui/Badge";
import { br } from "@/lib/text";
import { ButtonLink } from "@/components/ui/Button";
import { LogoMark } from "@/components/ui/Logo";

const EASE = [0.16, 1, 0.3, 1] as const;

/** 해 질 녘 하늘 + 천천히 흐르는 구름(이미지 없이 SVG 노이즈로 만든다) */
function SkyBackdrop() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #0f1011 0%, #111a23 16%, #173a6b 40%, #2f6fae 66%, #5d9ccd 86%, #7fb2d8 100%)",
        }}
      />
      {/* 먼 구름 */}
      <div
        className="absolute inset-y-0 -left-[10%] w-[160%] opacity-60 will-change-transform"
        style={{
          animation: "drift 140s var(--ease-soft) infinite alternate",
          maskImage: "linear-gradient(180deg, transparent 18%, #000 55%, #000 100%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 18%, #000 55%, #000 100%)",
        }}
      >
        <svg className="h-full w-full">
          <filter id="cloud-far" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.0019 0.0062" numOctaves="5" seed="4" />
            <feColorMatrix values="0 0 0 0 0.93  0 0 0 0 0.96  0 0 0 0 1  0 0 0 2.4 -1.25" />
          </filter>
          <rect width="100%" height="100%" filter="url(#cloud-far)" />
        </svg>
      </div>
      {/* 가까운 구름: 조금 더 빠르게, 반대 방향 */}
      <div
        className="absolute inset-y-0 -left-[30%] w-[180%] opacity-45 blur-[1.5px] will-change-transform"
        style={{
          animation: "drift 95s var(--ease-soft) infinite alternate-reverse",
          maskImage: "linear-gradient(180deg, transparent 38%, #000 80%)",
          WebkitMaskImage: "linear-gradient(180deg, transparent 38%, #000 80%)",
        }}
      >
        <svg className="h-full w-full">
          <filter id="cloud-near" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.0032 0.011" numOctaves="4" seed="19" />
            <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.1 -1.2" />
          </filter>
          <rect width="100%" height="100%" filter="url(#cloud-near)" />
        </svg>
      </div>
      <div className="grain absolute inset-0" />
    </div>
  );
}

const CARDS = [
  {
    tag: "LH · 행복주택 · 청년",
    title: "강동 고덕, 예상 1순위",
    body: "소득·자산 모두 기준 안쪽이에요. 접수는 9월 29일까지.",
    status: "신청 가능",
  },
  {
    tag: "HUG · 든든전세",
    title: "수원 영통, 추첨으로 뽑아요",
    body: "무주택 세대구성원이면 누구나. 소득 기준이 없어요.",
    status: "신청 가능",
  },
  {
    tag: "청약홈 · 민영 아파트",
    title: "가점 54점, 1순위 조건 충족",
    body: "85㎡ 이하는 가점 40% · 추첨 60%로 뽑아요.",
    status: "1순위",
  },
];

/** 히어로 아래 폰 목업. 스크롤하면 안쪽 카드가 한 장씩 비스듬히 펼쳐진다 */
function PhoneStack() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const lift = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const r1 = useTransform(scrollYProgress, [0.3, 0.62], [0, -3]);
  const y1 = useTransform(scrollYProgress, [0.3, 0.62], [0, -10]);
  const r2 = useTransform(scrollYProgress, [0.32, 0.66], [0, 7]);
  const y2 = useTransform(scrollYProgress, [0.32, 0.66], [0, 120]);
  const x2 = useTransform(scrollYProgress, [0.32, 0.66], [0, 26]);
  const r3 = useTransform(scrollYProgress, [0.36, 0.72], [0, -6]);
  const y3 = useTransform(scrollYProgress, [0.36, 0.72], [0, 250]);
  const x3 = useTransform(scrollYProgress, [0.36, 0.72], [0, -18]);
  const motionFor = [
    { rotate: r1, y: y1, x: 0 },
    { rotate: r2, y: y2, x: x2 },
    { rotate: r3, y: y3, x: x3 },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 160 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 2.2, delay: 0.9, ease: EASE }}
      className="relative mx-auto w-[min(88vw,400px)]"
    >
    <motion.div ref={ref} style={{ y: lift }}>
      {/* 기기 테두리 */}
      <div
        className="rounded-[58px] p-[11px] shadow-[0_40px_120px_-20px_rgba(0,0,0,0.55)]"
        style={{ background: "linear-gradient(135deg, #3a3a3c, #131313 45%, #2b2b2c)" }}
      >
        <div className="relative h-[660px] overflow-hidden rounded-[48px] bg-[#0d1620]/55 backdrop-blur-[2px] md:h-[720px]">
          <div className="absolute left-1/2 top-3 h-[30px] w-[108px] -translate-x-1/2 rounded-full bg-black" />
          <div className="data flex items-center justify-between px-8 pt-[18px] text-[13px] text-cloud/90">
            <span>9:41</span>
            <span className="tracking-widest">●●●</span>
          </div>
          <div className="mt-14 flex flex-col items-center px-7 text-center">
            <div className="grid size-12 place-items-center rounded-xl border border-white/20 bg-white/10 text-pure">
              <LogoMark className="size-6" />
            </div>
            <p className="mt-6 font-[family-name:var(--font-display)] text-[32px] font-light leading-[1.2] text-pure">
              지금 넣을 수 있는
              <br />
              공고 <span className="num text-[40px]">7</span>건
            </p>
            <p className="t-small mt-3 text-cloud/75">97년생 · 서울 · 미혼 · 무주택 · 소득 80%</p>
          </div>
          <div className="relative mx-5 mt-8">
            {CARDS.map((c, i) => (
              <motion.div
                key={c.tag}
                style={motionFor[i]}
                className="absolute inset-x-0 rounded-2xl border border-white/20 bg-white/[0.13] p-5 text-left shadow-[0_18px_40px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="t-caption truncate text-cloud/80">{c.tag}</span>
                  <StatusBadge status="ok">{c.status}</StatusBadge>
                </div>
                <p className="mt-3 font-[family-name:var(--font-display)] text-[21px] leading-snug text-pure">{c.title}</p>
                <p className="t-small mt-2 text-cloud/75">{c.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 md:pt-40">
      <SkyBackdrop />
      <div className="wrap relative flex flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASE, delay: 0.25 }}
          className="inline-flex h-9 items-center gap-2.5 rounded-full bg-white/10 pl-4 pr-1.5 text-[13px] font-medium text-cloud ring-1 ring-inset ring-white/15 backdrop-blur-md"
        >
          <span>{br("LH · SH · GH · HUG · 청약홈 | 공고를 한곳에")}</span>
          <span className="inline-flex h-6 items-center rounded-full bg-white/14 px-2.5 text-[12px] font-semibold">무료</span>
        </motion.p>

        <h1 className="t-display-xl mt-8 text-pure md:mt-10">
          <LineReveal immediate delay={0.35} lines={[br("내 조건에 맞는"), br("청약만 | 골라 드려요")]} />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, ease: EASE, delay: 0.9 }}
          className="t-body-l mt-6 max-w-[30em] text-cloud/85 md:mt-8"
        >
          {br("생년, 사는 곳, 가족, 집, 소득. | 다섯 가지만 답하면 | 지금 신청할 수 있는 공고와 | 예상 순위를 보여 드려요.")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.6, ease: EASE, delay: 1.1 }}
          className="mt-10 grid w-full max-w-[320px] gap-3 sm:w-auto sm:max-w-none sm:grid-cols-2"
        >
          <ButtonLink href="/check" size="lg" arrow block>
            1분 만에 확인하기
          </ButtonLink>
          <ButtonLink href="/guide" size="lg" variant="glass" block>
            자격 기준 먼저 보기
          </ButtonLink>
        </motion.div>

        <div className="relative mt-16 h-[440px] w-full md:mt-20 md:h-[520px]">
          <PhoneStack />
        </div>
      </div>
    </section>
  );
}
