"use client";

import Link from "next/link";
import { motion, useInView, useReducedMotion } from "motion/react";
import { useMemo, useRef } from "react";
import { EASE, SPRING } from "@/components/motion/tokens";
import { WinMark } from "@/components/motion/WinMark";
import { StatusBadge } from "@/components/ui/Badge";
import { EXAMPLE_PROFILE, sampleAnnouncements } from "@/lib/data/sample";
import { placeText } from "@/lib/place";
import { useHydrated } from "@/lib/profile";
import { evaluate, type GroupResult } from "@/lib/rules/evaluate";
import { PROGRAMS } from "@/lib/rules/programs";
import { soft } from "@/lib/text";

const BEAT = 0.32; // 조건 한 줄에 걸리는 시간

/**
 * 예시 조건으로 판정했을 때 ✓와 ?가 섞여 나오는 공고 계층을 고른다 — 전부 ✓면 「맞춰 본다」는 게 안 보인다.
 * 섞인 게 없으면 강동 행복주택 청년 계층.
 */
function pickExample() {
  const list = sampleAnnouncements();
  let best: { a: (typeof list)[number]; g: GroupResult; score: number } | null = null;
  for (const a of list) {
    const r = evaluate(a, EXAMPLE_PROFILE);
    if (r.phase === "closed") continue;
    for (const g of r.groups) {
      const n = g.checks.length;
      if (n < 4 || n > 7) continue;
      const kinds = new Set(g.checks.map((c) => c.tri));
      // ✓ 여러 개 + ? 하나(「이것만 알려주면 정해져요」)가 가장 좋은 예시. 해당 없음으로 끝나는 건 뒤로
      const passes = g.checks.filter((c) => c.tri === "pass").length;
      const score = (kinds.has("unknown") ? 15 : 0) + (kinds.has("fail") ? 4 : 0) + passes * 2 - Math.abs(n - 6) - (g.verdict === "no" ? 20 : 0);
      if (!best || score > best.score) best = { a, g, score };
    }
  }
  if (best) return best;
  const a = list.find((x) => x.id === "happy-gangdong")!;
  const r = evaluate(a, EXAMPLE_PROFILE);
  return { a, g: r.groups.find((x) => x.group.id === "youth") ?? r.best, score: 0 };
}

/**
 * 「공고문을 대신 읽어요」. 공고문의 자격 조건 줄에 형광펜이 글자 길이만큼 그어지고,
 * 오른쪽 대조표에 같은 조건이 한 줄씩 채워지며 창 표시가 켜진다. 표의 값은 실제 판정 엔진 결과다.
 */
export function NoticeReader() {
  const hydrated = useHydrated();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const play = inView || !!reduce;

  const data = useMemo(() => (hydrated ? pickExample() : null), [hydrated]);
  const checks = data?.g.checks ?? [];
  const verdictAt = checks.length * BEAT + 0.3;
  const v = data?.g.verdict;

  return (
    <section aria-labelledby="reader-title" className="border-t border-line bg-wash py-14 md:py-20">
      <div className="wrap">
        <div className="section-head">
          <span>결과를 읽는 법</span>
          <span className="text-muted">예시 조건 · 97년생 · 서울 강동구 · 미혼 · 무주택 · 월 300만 원대</span>
        </div>
        <h2 id="reader-title" className="t-h2 mt-6 max-w-[18em] md:mt-8">
          수십 쪽 공고문에서 자격 조건만 찾아, 내 상황과 한 줄씩 맞춰 봐요
        </h2>

        <div ref={ref} className="mt-10 grid items-start gap-6 md:mt-12 lg:grid-cols-12 lg:gap-8">
          {/* 공고문 */}
          <figure className="self-start rounded-[4px] bg-page p-5 ring-1 ring-inset ring-line md:p-7 lg:col-span-5">
            <figcaption className="border-b border-ink pb-3">
              <span className="block text-[12px] font-semibold text-muted">{data ? `${data.a.agency} · ${placeText(data.a)} · 예시 공고` : " "}</span>
              <span className="mt-1 block text-[17px] font-bold tracking-[-0.03em] text-ink">
                {data ? `${PROGRAMS[data.a.program].name} 입주자 모집공고 — ${data.a.complex}` : "입주자 모집공고"}
              </span>
            </figcaption>
            {data && <p className="mt-3 text-[13px] leading-[1.7] text-muted">{data.a.summary.join(" ")}</p>}
            <p className="mt-4 text-[13px] font-bold text-ink">■ 신청 자격 — {data?.g.group.label ?? ""}</p>
            <ol className="mt-2 space-y-1.5">
              {checks.map((c, i) => (
                <li key={c.key + i} className="text-[13px] leading-[1.7] text-body">
                  <span className="relative inline">
                    <motion.span
                      aria-hidden
                      className="absolute inset-x-[-2px] bottom-0 h-[60%] origin-left rounded-[1px] bg-brand/20"
                      initial={reduce ? false : { scaleX: 0 }}
                      animate={play ? { scaleX: 1 } : undefined}
                      transition={{ duration: 0.24, ease: EASE.move, delay: i * BEAT }}
                    />
                    <span className="relative">
                      {"가나다라마바사"[i] ?? "·"}. {c.label}: {soft(c.need)}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-[13px] leading-[1.7] text-muted">
              소득·자산은 공급기관이 직접 조회해 확인해요. 제출 서류와 일정은 공고문에 따로 안내돼요.
            </p>
          </figure>

          {/* 대조표 */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-[24px_minmax(0,0.9fr)_minmax(0,1fr)] gap-x-3 border-b border-ink pb-2 text-[13px] font-semibold text-muted">
              <span />
              <span>필요 조건</span>
              <span>내 상황</span>
            </div>
            <ul>
              {checks.map((c, i) => (
                <motion.li
                  key={c.key + i}
                  className="grid grid-cols-[24px_minmax(0,0.9fr)_minmax(0,1fr)] items-start gap-x-3 border-b border-line py-3.5"
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  animate={play ? { opacity: 1, x: 0 } : undefined}
                  transition={{ ...SPRING.land, delay: i * BEAT + 0.12 }}
                >
                  <WinMark tri={c.tri} delay={i * BEAT + 0.22} play={play} className="mt-1" />
                  <span className="min-w-0">
                    <span className="block text-[15px] font-semibold text-ink">{c.label}</span>
                    <span className="block text-[13px] text-muted">{soft(c.need)}</span>
                  </span>
                  <span className={`text-[15px] ${c.tri === "fail" ? "text-muted line-through decoration-no" : c.tri === "unknown" ? "font-semibold text-maybe-ink" : "font-medium text-ink"}`}>
                    {soft(c.mine)}
                  </span>
                </motion.li>
              ))}
            </ul>
            <motion.div
              className="mt-6 flex flex-wrap items-center justify-between gap-4"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={play && data ? { opacity: 1, y: 0 } : undefined}
              transition={{ duration: 0.32, ease: EASE.out, delay: verdictAt }}
            >
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {v && <StatusBadge status={v}>{v === "ok" ? "신청 가능" : v === "maybe" ? "확인 필요" : "해당 없음"}</StatusBadge>}
                <span className="text-[15px] text-body">{data?.g.rank && data.g.verdict !== "no" ? `${data.g.rank.label}${data.g.rank.detail ? ` · ${data.g.rank.detail}` : ""}` : ""}</span>
              </span>
              {data && (
                <Link href={`/notice/${data.a.id}`} className="inline-flex h-11 items-center text-[15px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
                  이 공고 자세히 보기
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
