"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { LineReveal } from "@/components/motion/Reveal";
import { br } from "@/lib/text";

const EASE = [0.16, 1, 0.3, 1] as const;

// 타일은 연한 파스텔 바탕 + 같은 계열 아이콘. 글자는 모두 검정 계열이라 대비 걱정이 없다.
// 제목은 모두 두 줄로 맞춰 같은 줄의 타일끼리 기준선이 맞게 한다.
const TILES = [
  {
    key: "youth",
    tag: "청년",
    title: ["만 19~39세", "청년이라면"],
    body: "혼자 살 집을 찾는다면 | 공고가 가장 많이 열려 있어요.",
    links: [
      ["행복주택 청년", "happy-housing"],
      ["매입임대 청년", "purchase-rental"],
      ["청년안심주택", "youth-safe-housing"],
    ],
    tint: "bg-tint-blue",
    icon: "bg-brand",
    glyph: <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM5.5 19.5a6.5 6.5 0 0 1 13 0" strokeLinecap="round" />,
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
    tint: "bg-tint-pink",
    icon: "bg-[#e5487b]",
    glyph: <path d="M12 19s-7-4.3-7-9.2A3.8 3.8 0 0 1 12 7.6a3.8 3.8 0 0 1 7 2.2C19 14.7 12 19 12 19Z" strokeLinejoin="round" />,
  },
  {
    key: "household",
    tag: "무주택 세대",
    title: ["우리 집 모두", "집이 없다면"],
    body: "나이·혼인과 상관없이 | 세대 전체가 무주택이면 신청할 수 있어요.",
    links: [
      ["국민임대", "national-rental"],
      ["통합공공임대", "integrated-rental"],
      ["든든전세", "deundeun-jeonse"],
    ],
    tint: "bg-tint-green",
    icon: "bg-ok",
    glyph: <path d="M4.5 11 12 5l7.5 6M6.5 9.5V19h11V9.5M10 19v-4.5h4V19" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    key: "first",
    tag: "첫 집",
    title: ["집을 한 번도", "가져 본 적 없다면"],
    body: "세대원 모두 집을 가져 본 적이 없으면 | 추첨으로 뽑는 특별공급이 있어요.",
    links: [["생애최초 특별공급", "first-home-special"]],
    tint: "bg-tint-violet",
    icon: "bg-[#6f5cf0]",
    glyph: (
      <>
        <circle cx="9" cy="12" r="3.5" />
        <path d="M12.5 12H20M17 12v3M20 12v2" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  {
    key: "multichild",
    tag: "다자녀",
    title: ["미성년 자녀가", "둘 이상이라면"],
    body: "자녀 수·무주택 기간·거주 기간으로 | 점수를 매겨 뽑아요.",
    links: [
      ["국민임대 가점", "national-rental"],
      ["공공분양", "public-sale"],
    ],
    tint: "bg-tint-orange",
    icon: "bg-[#f08c00]",
    glyph: (
      <>
        <circle cx="8.5" cy="9" r="2.5" />
        <circle cx="15.5" cy="9" r="2.5" />
        <path d="M4 18.5a4.5 4.5 0 0 1 9 0M11 18.5a4.5 4.5 0 0 1 9 0" strokeLinecap="round" />
      </>
    ),
  },
  {
    key: "parents",
    tag: "노부모 부양",
    title: ["부모님을 3년 넘게", "모시고 있다면"],
    body: "만 65세 이상 부모님을 모시는 | 무주택 세대주를 위한 특별공급이에요.",
    links: [["노부모부양 특별공급", "parents-special"]],
    tint: "bg-tint-teal",
    icon: "bg-[#0f9aa6]",
    glyph: <path d="M12 20V11M12 11c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6ZM12 13.5c0-3-2.2-5-5-5 0 3 2.2 5 5 5Z" strokeLinecap="round" strokeLinejoin="round" />,
  },
];

export function AudienceTiles() {
  return (
    <section aria-labelledby="audience-title" className="bg-wash py-20 md:py-28">
      <div className="wrap">
        <div className="text-center">
          <p className="eyebrow">대상별 공고</p>
          <h2 id="audience-title" className="t-display-l mt-3">
            <LineReveal lines={[br("이런 분이라면"), br("꼭 확인해 보세요")]} />
          </h2>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 md:mt-14 lg:grid-cols-3 lg:gap-4">
          {TILES.map((t, i) => (
            <motion.div
              key={t.key}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: (i % 3) * 0.08, ease: EASE }}
              className="group relative flex flex-col overflow-hidden rounded-[24px] bg-page p-6 shadow-card transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-1 hover:shadow-lift md:p-7"
            >
              <div className={`-mx-6 -mt-6 flex items-center justify-between px-6 pb-5 pt-6 md:-mx-7 md:-mt-7 md:px-7 md:pt-7 ${t.tint}`}>
                <span className={`grid size-11 place-items-center rounded-[14px] text-white ${t.icon}`}>
                  <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
                    {t.glyph}
                  </svg>
                </span>
                <span className="inline-flex h-7 items-center rounded-full bg-page/80 px-3 text-[13px] font-semibold text-body">{t.tag}</span>
              </div>
              <h3 className="t-display-s mt-5">
                {/* 타일 전체를 누르면 조건 입력으로 — 안쪽 링크는 z-10으로 위에 둔다 */}
                <Link href={`/check?for=${t.key}`} className="after:absolute after:inset-0 after:content-['']">
                  <span className="block">{br(t.title[0])}</span>
                  <span className="block">{br(t.title[1])}</span>
                </Link>
              </h3>
              <p className="t-body mt-3 text-sub">{br(t.body)}</p>
              <ul className="relative z-10 mt-auto flex flex-wrap gap-1.5 pt-6">
                {t.links.map(([label, slug]) => (
                  <li key={label}>
                    <Link
                      href={`/guide/${slug}`}
                      className="inline-flex h-8 items-center rounded-full bg-well px-3 text-[13px] font-medium text-sub transition-colors hover:bg-line hover:text-ink"
                    >
                      {label} 자격
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
