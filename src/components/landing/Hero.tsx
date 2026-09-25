"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Facade, type FacadeItem } from "@/components/motion/Facade";
import { Odometer } from "@/components/motion/Odometer";
import { EASE } from "@/components/motion/tokens";
import { Arrow, ButtonLink } from "@/components/ui/Button";
import { WIN_LABEL, WinLegend, type WinState } from "@/components/ui/Window";
import type { Profile } from "@/lib/domain";
import { EXAMPLE_PROFILE as EX, sampleAnnouncements } from "@/lib/data/sample";
import { isEmptyProfile, useHydrated, useProfile } from "@/lib/profile";
import { countVerdicts, evaluateAll, type NoticeResult } from "@/lib/rules/evaluate";
import { PROGRAMS } from "@/lib/rules/programs";
import { SITE } from "@/lib/site";

/** 예시 조건 — 한 칸씩 더해지며 창이 걸러진다(실제 판정 엔진 결과) */
const DEMO: { chip: string; patch: Partial<Profile> }[] = [
  { chip: `${String(EX.birthYear).slice(2)}년생`, patch: { birthYear: EX.birthYear } },
  { chip: `${EX.sido} ${EX.sigungu}`, patch: { sido: EX.sido, sigungu: EX.sigungu } },
  { chip: "미혼 · 자녀 없음", patch: { marital: EX.marital, children: EX.children } },
  { chip: "무주택", patch: { home: EX.home } },
  { chip: "월 300만 원대", patch: { income: EX.income } },
  { chip: "자산 1억 800만 원 이하 · 차 없음", patch: { assets: EX.assets, car: EX.car, hasAccount: EX.hasAccount, special: EX.special } },
];

function stateOf(r: NoticeResult): WinState {
  if (r.phase === "closed") return "closed";
  return r.verdict;
}

function BirthStart() {
  const router = useRouter();
  const { profile, update } = useProfile();
  const [text, setText] = useState("");
  const [tried, setTried] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const year = new Date().getFullYear();
  const n = Number(text);
  const valid = text.length === 4 && n >= 1930 && n <= year - 15;
  const go = () => {
    if (!valid) {
      setTried(true);
      input.current?.focus();
      return;
    }
    update({ birthYear: n });
    router.push("/check?step=region");
  };
  return (
    <form
      className="mt-8 md:mt-10"
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
    >
      <label htmlFor="hero-birth" className="text-[15px] font-semibold text-ink">
        몇 년생이세요?
      </label>
      <div className="mt-2.5 flex max-w-[420px] gap-2">
        <input
          ref={input}
          id="hero-birth"
          value={text}
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          placeholder={profile.birthYear ? String(profile.birthYear) : "예: 1990"}
          onChange={(e) => setText(e.target.value.replace(/\D/g, "").slice(0, 4))}
          size={4}
          className="num h-14 w-0 min-w-0 flex-1 rounded-[10px] bg-page px-4 text-[22px] text-ink ring-1 ring-inset ring-line-strong outline-none transition-shadow placeholder:font-medium placeholder:text-faint focus:ring-2 focus:ring-brand"
        />
        <button
          type="submit"
          className="group/btn inline-flex h-14 shrink-0 items-center gap-2 rounded-[10px] bg-brand px-6 text-[17px] font-semibold text-white transition-colors hover:bg-brand-hover active:bg-brand-press"
        >
          시작
          <Arrow size="lg" />
        </button>
      </div>
      <p className="mt-2 h-5 text-[14px] text-sub">
        {valid ? (
          <>
            올해 만 <span className="data text-ink">{year - n - 1}</span>세 또는 <span className="data text-ink">{year - n}</span>세예요
          </>
        ) : text.length === 4 ? (
          "만 15세 이상부터 확인할 수 있어요"
        ) : tried ? (
          <span className="text-hot-ink">태어난 해를 네 자리로 넣어 주세요. 예: 1990</span>
        ) : null}
      </p>
    </form>
  );
}

/**
 * 오른쪽 입면도. 처음 보는 사람에겐 예시 조건을 한 칸씩 더하며 창이 걸러지는 걸 보여 주고,
 * 이미 조건을 넣은 사람에겐 자기 결과를 켠다. 판정·날짜는 브라우저에서만 계산한다.
 */
function HeroFacade() {
  const hydrated = useHydrated();
  const { profile } = useProfile();
  const mine = hydrated && !isEmptyProfile(profile);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const [step, setStep] = useState(-1);
  const [active, setActive] = useState<string | null>(null);

  const list = useMemo(() => (hydrated ? sampleAnnouncements() : []), [hydrated]);
  const demoProfiles = useMemo(() => DEMO.map((_, k) => Object.assign({}, ...DEMO.slice(0, k + 1).map((d) => d.patch)) as Profile), []);
  const results = useMemo(() => {
    if (!hydrated) return [];
    if (mine) return evaluateAll(list, profile);
    if (step < 0) return [];
    return evaluateAll(list, demoProfiles[step]);
  }, [hydrated, mine, list, profile, step, demoProfiles]);

  // 예시 재생: 화면에 들어오면 0.95초마다 조건 한 칸
  useEffect(() => {
    if (mine || !inView || !hydrated) return;
    if (step >= DEMO.length - 1) return;
    const t = setTimeout(() => setStep((s) => (reduce ? DEMO.length - 1 : s + 1)), step < 0 ? 500 : 950);
    return () => clearTimeout(t);
  }, [mine, inView, hydrated, reduce, step]);

  const byId = new Map(results.map((r) => [r.a.id, r]));
  const items: FacadeItem[] = list.length
    ? list.map((a) => {
        const r = byId.get(a.id);
        const state: WinState = r ? stateOf(r) : "off";
        return { id: a.id, state, label: `${a.complex} — ${WIN_LABEL[state]}`, href: r ? `/notice/${a.id}` : undefined };
      })
    : Array.from({ length: 16 }, (_, i) => ({ id: `s${i}`, state: "off" as const, label: "공고" }));
  const counts = countVerdicts(results);
  const activeR = active ? byId.get(active) : undefined;
  const done = mine || step >= DEMO.length - 1;

  return (
    <div ref={ref} className="relative">
      <div className="flex items-baseline justify-between gap-4 border-t border-ink pt-3.5 text-[13px] font-semibold text-sub">
        <span>{mine ? "내 조건으로 본 공고" : "예시 조건으로 본 공고"}</span>
        <span className="text-muted">{SITE.sampleData ? `예시 공고 ${items.length}건` : `공고 ${items.length}건`}</span>
      </div>

      {/* 조건 칩 줄 */}
      <div className="mt-4 flex min-h-[64px] flex-wrap content-start gap-1.5" aria-live="polite">
        {mine ? (
          <p className="t-small text-sub">창 1칸이 공고 1건이에요. 눌러서 자세히 보세요.</p>
        ) : (
          <AnimatePresence initial={false}>
            {DEMO.slice(0, step + 1).map((d) => (
              <motion.span
                key={d.chip}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.32, ease: EASE.out }}
                className="inline-flex h-7 items-center rounded-[4px] bg-page px-2.5 text-[13px] font-medium text-body ring-1 ring-inset ring-line-strong"
              >
                {d.chip}
              </motion.span>
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-5 md:gap-8">
        <Facade items={items} cols={4} onActive={setActive} className="max-w-[220px] sm:max-w-[340px]" />
        <div className="pb-2 text-right">
          <p className="text-[13px] font-semibold text-sub">신청 가능</p>
          <p className={`t-num-xl ${!results.length ? "text-faint" : counts.ok ? "text-brand" : "text-muted"}`}>{results.length ? <Odometer value={counts.ok} /> : "–"}</p>
          <p className="mt-4 text-[13px] font-semibold text-sub">확인 필요</p>
          <p className={`t-num-m ${!results.length ? "text-faint" : counts.maybe ? "text-maybe-ink" : "text-muted"}`}>{results.length ? <Odometer value={counts.maybe} /> : "–"}</p>
        </div>
      </div>

      {/* 캡션: 가리킨 창의 공고, 아니면 범례 */}
      <div className="mt-4 min-h-[44px]">
        {activeR ? (
          <p className="t-small text-body">
            <span className="font-semibold text-ink">{activeR.a.complex}</span> · {activeR.a.agency} {PROGRAMS[activeR.a.program].name} · {activeR.a.sido}
          </p>
        ) : (
          <WinLegend states={["ok", "maybe", "no", "closed"]} />
        )}
      </div>

      <div className="mt-1 flex h-6 items-center gap-4">
        {mine ? (
          <ButtonLink href="/results" variant="link" arrow>
            내 결과 전체 보기
          </ButtonLink>
        ) : (
          done && (
            <button
              type="button"
              onClick={() => setStep(-1)}
              className="text-[14px] font-semibold text-sub underline decoration-line-strong underline-offset-4 hover:text-ink"
            >
              다시 보기
            </button>
          )
        )}
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="overflow-x-clip pt-16">
      <div className="wrap grid gap-12 pb-16 pt-10 md:pb-24 md:pt-16 lg:grid-cols-12 lg:gap-8 lg:pt-20">
        <div className="lg:col-span-6">
          <h1 className="t-h1">
            청약 공고 중
            <br />
            내가 넣을 수 있는 것만
          </h1>
          <p className="t-body-l mt-5 max-w-[30em] text-sub md:mt-6">
            나이, 사는 곳, 가족, 집, 소득, 재산을 눌러서 답하면 공고마다 신청할 수 있는지 창에 불이 켜져요. 로그인은 없고, 입력한 내용은 이
            기기에만 남아요.
          </p>
          <BirthStart />
          {SITE.sampleData && (
            <p className="mt-8 max-w-[34em] border-t border-line pt-3 text-[14px] leading-relaxed text-sub">
              <span className="mr-1.5 font-semibold text-maybe-ink">예시 공고</span>
              지금 보이는 공고는 예시예요. 자격 기준은 2026년 법령 값이고, 실제 공고는 공공데이터 연결 후 바뀌어요.
            </p>
          )}
        </div>
        <div className="lg:col-span-5 lg:col-start-8">
          <HeroFacade />
        </div>
      </div>
    </section>
  );
}
