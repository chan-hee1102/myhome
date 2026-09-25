"use client";

import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef } from "react";
import { Odometer } from "@/components/motion/Odometer";
import { EASE } from "@/components/motion/tokens";
import { sampleAnnouncements } from "@/lib/data/sample";
import { useHydrated } from "@/lib/profile";
import { SITE } from "@/lib/site";

function dayOf(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d || 1).getTime();
}

/**
 * 히어로 아래에 걸친 숫자 카드 세 장 — 지금 접수 중 · 3일 안에 마감 · 곧 접수 시작.
 * 화면에 들어오면 0에서 실제 숫자로 굴러간다. 날짜는 브라우저에서만 계산한다.
 */
export function StatStrip() {
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  const stats = useMemo(() => {
    if (!hydrated) return { open: 0, soon: 0, upcoming: 0 };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let open = 0;
    let soon = 0;
    let upcoming = 0;
    for (const a of sampleAnnouncements(now)) {
      const s = dayOf(a.schedule.applyStart);
      const e = dayOf(a.schedule.applyEnd);
      if (s > today) upcoming++;
      else if (e >= today) {
        open++;
        if ((e - today) / 86_400_000 <= 3) soon++;
      }
    }
    return { open, soon, upcoming };
  }, [hydrated]);

  const show = inView || reduce;
  const cards = [
    { k: "지금 접수 중", v: stats.open, tone: "text-ink", bar: "bg-ink", href: "/results?tab=all&sort=deadline" },
    { k: "3일 안에 마감", v: stats.soon, tone: "text-hot-ink", bar: "bg-hot", href: "/results?tab=all&sort=deadline" },
    { k: "곧 접수 시작", v: stats.upcoming, tone: "text-ink", bar: "bg-bar", href: "/results?tab=all" },
  ];

  return (
    <div ref={ref} className="wrap relative z-10 -mt-8 md:-mt-12">
      <ul className="grid grid-cols-3 gap-2 md:gap-4" aria-label={SITE.sampleData ? "예시 공고 현황" : "공고 현황"}>
        {cards.map((c, i) => (
          <motion.li
            key={c.k}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={show ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.5, ease: EASE.out, delay: i * 0.08 }}
          >
            <Link href={c.href} className="card card-hover relative block overflow-hidden px-3 py-4 md:px-6 md:py-5">
              <span aria-hidden className={`absolute inset-x-0 top-0 h-1 ${c.bar}`} />
              <span className="block text-[13px] font-semibold text-sub md:text-[15px]">{c.k}</span>
              <span className={`t-num-l mt-1 flex items-baseline gap-1 ${c.tone}`}>
                <Odometer value={show && hydrated ? c.v : 0} />
                <span className="text-[15px] font-semibold text-sub md:text-[18px]">건</span>
              </span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
