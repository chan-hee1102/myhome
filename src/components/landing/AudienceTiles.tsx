"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { LineReveal } from "@/components/motion/Reveal";
import { br } from "@/lib/text";

const EASE = [0.16, 1, 0.3, 1] as const;

// 색은 카테고리 타일에만 쓴다. 대비 4.5:1 이상이 되도록 밝은 타일은 검은 글자, 진한 타일만 흰 글자.
// 제목은 모두 두 줄로 맞춰 같은 줄의 타일끼리 기준선이 맞게 한다.
const TILES = [
  {
    key: "youth",
    tag: "청년",
    title: ["만 19~39세", "청년이라면"],
    body: "혼자 살 집을 찾는 중이라면 | 가장 많은 공고가 열려 있는 계층이에요.",
    links: [
      ["행복주택 청년", "happy-housing"],
      ["매입임대 청년", "purchase-rental"],
      ["청년안심주택", "youth-safe-housing"],
    ],
    bg: "bg-iris",
    dark: false,
  },
  {
    key: "newlywed",
    tag: "신혼부부",
    title: ["결혼 7년 이내", "또는 예비부부"],
    body: "아이가 있거나 태어날 예정이면 | 순위가 올라가는 공고가 많아요.",
    links: [
      ["신혼부부 특별공급", "newlywed-special"],
      ["신생아 특별공급", "newborn-special"],
      ["행복주택 신혼", "happy-housing"],
    ],
    bg: "bg-orchid",
    dark: false,
  },
  {
    key: "household",
    tag: "무주택 세대",
    title: ["우리 집 모두", "집이 없다면"],
    body: "나이·혼인과 상관없이 | 세대 전체가 무주택이면 | 신청할 수 있는 유형이에요.",
    links: [
      ["국민임대", "national-rental"],
      ["통합공공임대", "integrated-rental"],
      ["든든전세", "deundeun-jeonse"],
    ],
    bg: "bg-periwinkle",
    dark: false,
  },
  {
    key: "first",
    tag: "첫 집",
    title: ["집을 한 번도", "가져 본 적 없다면"],
    body: "세대원 모두 집을 가져 본 적이 없으면 | 추첨으로 뽑는 특별공급이 있어요.",
    links: [["생애최초 특별공급", "first-home-special"]],
    bg: "bg-pale-iris",
    dark: false,
  },
  {
    key: "multichild",
    tag: "다자녀",
    title: ["미성년 자녀가", "둘 이상이라면"],
    body: "자녀 수·무주택 기간·거주 기간으로 매기는 | 별도 배점표로 뽑아요.",
    links: [
      ["국민임대 가점", "national-rental"],
      ["공공분양", "public-sale"],
    ],
    bg: "bg-deep-iris",
    dark: true,
  },
  {
    key: "parents",
    tag: "노부모 부양",
    title: ["부모님을 3년 넘게", "모시고 있다면"],
    body: "만 65세 이상 부모님을 모시고 사는 | 무주택 세대주를 위한 특별공급이에요.",
    links: [["노부모부양 특별공급", "parents-special"]],
    bg: "bg-silver",
    dark: false,
  },
];

export function AudienceTiles() {
  return (
    <section aria-labelledby="audience-title" className="py-20 md:py-32">
      <div className="wrap">
        <div className="text-center">
          <p className="eyebrow">대상별 공고</p>
          <h2 id="audience-title" className="t-display-l mt-4 text-pure">
            <LineReveal lines={[br("나한테 열린 문은"), br("생각보다 많아요")]} />
          </h2>
        </div>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 md:mt-16 lg:grid-cols-3 lg:gap-4">
          {TILES.map((t, i) => {
            const ink = t.dark ? "text-pure" : "text-void";
            const sub = t.dark ? "text-white/85" : "text-black/70";
            const ring = t.dark ? "ring-white/35 hover:bg-white/12" : "ring-black/25 hover:bg-black/8";
            return (
              <motion.div
                key={t.key}
                initial={{ opacity: 0, y: 48 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 1.1, delay: (i % 3) * 0.1, ease: EASE }}
                className={`grain group relative flex min-h-[360px] flex-col overflow-hidden rounded-[28px] p-6 transition-transform duration-500 ease-out hover:-translate-y-1.5 md:min-h-[400px] md:p-8 ${t.bg} ${ink}`}
              >
                <div className="flex items-start justify-between">
                  <span className={`text-[13px] font-semibold ${sub}`}>{t.tag}</span>
                  <span
                    aria-hidden
                    className={`grid size-10 place-items-center rounded-full ring-1 ring-inset transition-transform duration-500 ease-out group-hover:-rotate-45 ${t.dark ? "ring-white/35" : "ring-black/25"}`}
                  >
                    <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M3 8h9.5M8.5 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
                <h3 className="t-display-s mt-12 md:mt-16">
                  {/* 타일 전체를 누르면 조건 입력으로 — 안쪽 링크는 z-10으로 위에 둔다 */}
                  <Link href={`/check?for=${t.key}`} className="after:absolute after:inset-0 after:content-['']">
                    <span className="block">{br(t.title[0])}</span>
                    <span className="block">{br(t.title[1])}</span>
                  </Link>
                </h3>
                <p className={`t-body mt-4 ${sub}`}>{br(t.body)}</p>
                <ul className="relative z-10 mt-auto flex flex-wrap gap-1.5 pt-8">
                  {t.links.map(([label, slug]) => (
                    <li key={label}>
                      <Link
                        href={`/guide/${slug}`}
                        className={`inline-flex h-8 items-center rounded-full px-3 text-[13px] font-medium ring-1 ring-inset transition-colors ${ring}`}
                      >
                        {label} 자격
                      </Link>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
