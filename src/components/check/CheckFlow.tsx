"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { dayText, programLine } from "@/components/results/verdict";
import { StatusBadge } from "@/components/ui/Badge";
import { Arrow, BackArrow, Button, ButtonLink, IconButton, buttonClass } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { SIDO, type Profile, type Sido } from "@/lib/domain";
import { SIGUNGU } from "@/lib/data/regions";
import { sampleAnnouncements } from "@/lib/data/sample";
import { useHydrated, useProfile } from "@/lib/profile";
import {
  ACCOUNT_MONTHS,
  ASSETS,
  CAR,
  CHILDREN,
  DEPOSIT,
  HOME,
  HOMELESS_YEARS,
  INCOME,
  MARITAL,
  PAYMENTS,
  RESIDENCE_YEARS,
  SPECIAL,
} from "@/lib/questions";
import { derive, manwon } from "@/lib/rules/core";
import { countVerdicts, evaluateAll, type NoticeResult } from "@/lib/rules/evaluate";
import { income100, standardsFor } from "@/lib/rules/standards";
import { br } from "@/lib/text";
import { bandEq, Chip, ChipGroup, YesNo } from "./Choice";

const EASE = [0.16, 1, 0.3, 1] as const;

type StepId = "birth" | "region" | "family" | "home" | "income" | "done" | "account" | "assets" | "household" | "special";

const CORE: StepId[] = ["birth", "region", "family", "home", "income"];
const EXTRA: StepId[] = ["account", "assets", "household", "special"];

const TOPIC_TO_STEP: Record<string, StepId> = {
  basics: "birth",
  income: "income",
  account: "account",
  assets: "assets",
  region: "region",
  household: "household",
  special: "special",
};

const META: Record<Exclude<StepId, "done">, { tag: string; title: string; help?: string }> = {
  birth: { tag: "나이", title: "몇 년생이세요?", help: "청년·고령자 기준과 가점 계산에 써요." },
  region: { tag: "사는 곳", title: "지금 어디 사세요?", help: br("주민등록상 주소 기준이에요. | 해당 지역 거주자가 순위에서 앞서요.") },
  family: { tag: "가족", title: "가족 상황을 알려주세요", help: br("자녀에는 | 임신 중인 아이도 넣어 주세요.") },
  home: { tag: "주택", title: "집이 있나요?", help: br("대부분의 공고가 | 무주택을 기본 조건으로 봐요.") },
  income: { tag: "소득", title: br("한 달 소득은 | 얼마쯤이에요?"), help: br("세전 금액이에요. | 같이 사는 가족 소득을 모두 합쳐 주세요.") },
  account: { tag: "청약통장", title: "청약통장이 있나요?", help: br("분양 1순위와 가점, | 국민임대 순위에 쓰여요.") },
  assets: { tag: "자산", title: br("자산은 | 어느 정도예요?"), help: br("부동산·예금·자동차를 합치고 빚을 뺀 금액이에요. | 대략이면 충분해요.") },
  household: { tag: "세대", title: br("몇 가지만 | 더 여쭤볼게요"), help: "모르는 건 비워 두셔도 돼요." },
  special: { tag: "해당 계층", title: "해당되는 게 있나요?", help: br("영구임대·매입임대 순위와 | 일부 특별공급에 쓰여요.") },
};

function Section({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease: EASE }}>
      {children}
    </motion.div>
  );
}

interface StepProps {
  profile: Profile;
  update: (p: Partial<Profile>) => void;
  onNext: () => void;
}

function BirthStep({ profile, update, onNext }: StepProps) {
  const [text, setText] = useState(profile.birthYear ? String(profile.birthYear) : "");
  const year = new Date().getFullYear();
  const n = Number(text);
  const valid = text.length === 4 && n >= 1930 && n <= year - 15;
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <div className="flex flex-col items-start">
      <label className="flex items-center gap-3">
        <input
          ref={ref}
          value={text}
          inputMode="numeric"
          autoComplete="off"
          placeholder="1997"
          aria-label="출생연도 네 자리"
          maxLength={4}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
            setText(v);
            const y = Number(v);
            if (v.length === 4 && y >= 1930 && y <= year - 15) update({ birthYear: y });
          }}
          onKeyDown={(e) => e.key === "Enter" && valid && onNext()}
          className="num w-[5.2ch] rounded-[18px] bg-well px-5 py-3 text-[48px] leading-none text-ink outline-none ring-2 ring-inset ring-transparent transition-[background-color,box-shadow] placeholder:text-ghost focus:bg-page focus:ring-brand focus-visible:outline-none md:text-[64px]"
        />
        <span className="text-[24px] font-bold text-ink md:text-[28px]">년생</span>
      </label>
      <p className="t-body mt-5 h-6 text-sub">
        {valid ? (
          <>
            올해 만 <span className="data text-brand">{year - n - 1}</span>세 또는 <span className="data text-brand">{year - n}</span>세 (생일 전·후)
          </>
        ) : text.length === 4 ? (
          "1930년부터 입력할 수 있어요"
        ) : (
          ""
        )}
      </p>
    </div>
  );
}

function RegionStep({ profile, update }: StepProps) {
  const sido = profile.sido;
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {SIDO.map((s) => (
          <Chip
            key={s}
            size="compact"
            selected={sido === s}
            onClick={() => update({ sido: s as Sido, sigungu: sido === s ? profile.sigungu : undefined })}
          >
            {s}
          </Chip>
        ))}
      </div>
      <AnimatePresence>
        {sido && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="mb-3 text-[15px] font-semibold text-ink">
              {br("시·군·구도 고르면 | 임대주택 순위가 정확해져요")} <span className="font-medium text-muted">(선택)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {SIGUNGU[sido].map((g) => (
                <div key={g}>
                  <Chip size="pill" selected={profile.sigungu === g} onClick={() => update({ sigungu: profile.sigungu === g ? undefined : g })}>
                    {g}
                  </Chip>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FamilyStep({ profile, update }: StepProps) {
  return (
    <div className="space-y-8">
      <Section>
        <ChipGroup label="혼인" options={MARITAL} value={profile.marital} onChange={(v) => update({ marital: v })} cols="grid-cols-2" />
      </Section>
      <Section delay={0.06}>
        <ChipGroup label="미성년 자녀" size="compact" options={CHILDREN} value={profile.children} onChange={(v) => update({ children: v })} cols="grid-cols-4" />
      </Section>
      <Section delay={0.12}>
        <button
          type="button"
          aria-pressed={!!profile.infant}
          onClick={() => update({ infant: !profile.infant })}
          className="flex min-h-11 items-center gap-3 text-left text-[16px] font-medium text-body"
        >
          <span
            className={`grid size-6 shrink-0 place-items-center rounded-[8px] transition-colors ${
              profile.infant ? "bg-brand text-white" : "bg-page ring-2 ring-inset ring-line-strong"
            }`}
          >
            {profile.infant && (
              <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
          {br("2세 미만 아기가 있거나 | 임신 중이에요")}
        </button>
      </Section>
    </div>
  );
}

function HomeStep({ profile, update, onNext }: StepProps) {
  return (
    <div className="grid gap-2">
      {HOME.map((o, i) => (
        <Section key={o.value} delay={i * 0.06}>
          <Chip
            selected={profile.home === o.value}
            sub={o.sub}
            onClick={() => {
              update({ home: o.value, ...(o.value !== "none" ? { neverOwned: false } : {}) });
              setTimeout(onNext, 260);
            }}
          >
            {o.label}
          </Chip>
        </Section>
      ))}
    </div>
  );
}

function IncomeStep({ profile, update }: StepProps) {
  const d = derive(profile);
  const size = d.householdSize;
  const base = size ? income100(standardsFor(), size, "rent") : undefined;
  return (
    <div className="space-y-6">
      <ChipGroup options={INCOME} value={profile.income} onChange={(v) => update({ income: v })} equals={bandEq} cols="grid-cols-2" />
      <div className="flex flex-wrap items-center gap-2">
        <div>
          <Chip size="pill" selected={false} onClick={() => update({ income: undefined })}>
            잘 모르겠어요
          </Chip>
        </div>
        {d.married && (
          <div>
            <Chip size="pill" selected={!!profile.dualIncome} onClick={() => update({ dualIncome: !profile.dualIncome })}>
              맞벌이예요
            </Chip>
          </div>
        )}
      </div>
      {base && (
        <p className="t-small rounded-[14px] bg-wash px-4 py-3.5 text-sub">
          {br(`우리 가족(${size}인) 기준 | 도시근로자 월평균소득 100%는 | `)}
          <span className="font-semibold text-ink">{br(`월 ${manwon(base)}`)}</span>
          {br("이에요. | 대부분의 공공임대는 | 이 금액의 70~150%를 기준으로 봐요.")}
        </p>
      )}
    </div>
  );
}

function AccountStep({ profile, update }: StepProps) {
  return (
    <div className="space-y-8">
      <YesNo
        label="주택청약종합저축(또는 청약저축·예금·부금)"
        value={profile.hasAccount}
        yes="있어요"
        no="없어요"
        onChange={(v) => update(v ? { hasAccount: true } : { hasAccount: false, accountMonths: undefined, payments: undefined, deposit: undefined })}
      />
      <AnimatePresence>
        {profile.hasAccount && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="space-y-8 overflow-hidden"
          >
            <ChipGroup label="가입한 지" size="compact" options={ACCOUNT_MONTHS} value={profile.accountMonths} onChange={(v) => update({ accountMonths: v })} equals={bandEq} cols="grid-cols-2 sm:grid-cols-4" />
            <ChipGroup label="납입 횟수(인정 회차)" size="compact" options={PAYMENTS} value={profile.payments} onChange={(v) => update({ payments: v })} equals={bandEq} cols="grid-cols-2 sm:grid-cols-4" />
            <ChipGroup label="지금까지 넣은 돈" size="compact" options={DEPOSIT} value={profile.deposit} onChange={(v) => update({ deposit: v })} equals={bandEq} cols="grid-cols-2 sm:grid-cols-4" />
            <p className="t-small text-muted">{br("은행 앱의 청약통장 화면이나 | 청약홈 「청약통장 순위확인서」에서 | 볼 수 있어요.")}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AssetsStep({ profile, update }: StepProps) {
  return (
    <div className="space-y-8">
      <ChipGroup label="총자산" size="compact" options={ASSETS} value={profile.assets} onChange={(v) => update({ assets: v })} equals={bandEq} cols="grid-cols-2 sm:grid-cols-4" />
      <ChipGroup label="자동차(가장 비싼 차 기준)" size="compact" options={CAR} value={profile.car} onChange={(v) => update({ car: v })} equals={bandEq} cols="grid-cols-2 sm:grid-cols-4" />
    </div>
  );
}

function HouseholdStep({ profile, update }: StepProps) {
  return (
    <div className="space-y-8">
      <div className="grid gap-8 sm:grid-cols-2">
        <YesNo label="세대주인가요?" value={profile.householdHead} onChange={(v) => update({ householdHead: v })} />
        <YesNo label={br("만 65세 이상 부모님을 | 3년 넘게 모시고 있나요?")} value={profile.livesWithParents} onChange={(v) => update({ livesWithParents: v })} />
      </div>
      <ChipGroup
        label={`${profile.sido ?? "지금 사는 시·도"}에 산 지`}
        size="compact"
        options={RESIDENCE_YEARS}
        value={profile.residenceYears}
        onChange={(v) => update({ residenceYears: v })}
        cols="grid-cols-3 sm:grid-cols-5"
      />
      {profile.home === "none" && (
        <ChipGroup
          label="무주택이 된 지"
          size="compact"
          options={HOMELESS_YEARS}
          value={profile.homelessYears}
          onChange={(v) => update({ homelessYears: v })}
          cols="grid-cols-3"
        />
      )}
      <div className="grid gap-8 sm:grid-cols-2">
        {profile.home === "none" && (
          <YesNo label={br("세대원 모두 | 집을 가져 본 적이 없나요?")} value={profile.neverOwned} yes="없어요" no="있어요" onChange={(v) => update({ neverOwned: v })} />
        )}
        <YesNo label={br("최근 5년 안에 | 청약에 당첨된 적 있나요?")} value={profile.wonRecently} yes="있어요" no="없어요" onChange={(v) => update({ wonRecently: v })} />
      </div>
    </div>
  );
}

function SpecialStep({ profile, update }: StepProps) {
  const cur = profile.special ?? [];
  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="mb-3 text-[15px] font-semibold text-ink">여러 개 골라도 돼요</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SPECIAL.map((o) => (
            <Chip
              key={o.value}
              size="compact"
              selected={cur.includes(o.value)}
              onClick={() => update({ special: cur.includes(o.value) ? cur.filter((x) => x !== o.value) : [...cur, o.value] })}
            >
              {o.label}
            </Chip>
          ))}
          <Chip size="compact" selected={profile.special !== undefined && cur.length === 0} onClick={() => update({ special: [] })}>
            해당 없음
          </Chip>
        </div>
      </fieldset>
      <div className="grid gap-8 sm:grid-cols-2">
        <YesNo label={br("대학생(재학·입학 예정·졸업 2년 이내)인가요?")} value={profile.student} onChange={(v) => update({ student: v })} />
        <YesNo label={br("근로·사업소득세를 | 5년 넘게 냈나요?")} value={profile.taxFiveYears} onChange={(v) => update({ taxFiveYears: v })} />
      </div>
    </div>
  );
}

const STEP_VIEW: Record<Exclude<StepId, "done">, (p: StepProps) => React.ReactNode> = {
  birth: BirthStep,
  region: RegionStep,
  family: FamilyStep,
  home: HomeStep,
  income: IncomeStep,
  account: AccountStep,
  assets: AssetsStep,
  household: HouseholdStep,
  special: SpecialStep,
};

function canNext(step: StepId, p: Profile): boolean {
  switch (step) {
    case "birth":
      return !!p.birthYear;
    case "region":
      return !!p.sido;
    case "family":
      return p.marital !== undefined && p.children !== undefined;
    case "home":
      return !!p.home;
    default:
      return true;
  }
}

function DoneView({ ok, maybe, onMore, top }: { ok: number; maybe: number; onMore: () => void; top: NoticeResult[] }) {
  return (
    <div className="flex flex-col items-start">
      <p className="eyebrow">입력 완료</p>
      <h1 className="t-display-m mt-3">
        {br("신청할 수 있는")}
        <br />
        공고 <span className="num text-[1.25em] text-brand">
          <AnimatedNumber value={ok} />
        </span>
        건
      </h1>
      <p className="t-body-l mt-5 max-w-[30em] text-sub">
        {br("정보가 모자라서 아직 모르는 공고가 |")} <span className="font-semibold text-maybe-ink">{maybe}건</span>{" "}
        {br("있어요. | 통장·자산을 1분만 더 답하면 | 이 중 상당수가 확정되고, | 분양 공고는 가점까지 계산돼요.")}
      </p>
      <div className="mt-8 grid w-full gap-2.5 sm:w-auto sm:grid-cols-2">
        <ButtonLink href="/results" size="lg" arrow block>
          결과 보기
        </ButtonLink>
        <Button size="lg" variant="soft" onClick={onMore} block>
          1분 더 답하기
        </Button>
      </div>
      {top.length > 0 && (
        <ul className="mt-10 grid w-full gap-3 md:grid-cols-3">
          {top.map((r, k) => (
            <motion.li key={r.a.id} initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.35 + k * 0.12, ease: EASE }}>
              <Link href={`/notice/${r.a.id}`} className="block rounded-[20px] bg-page p-5 shadow-card ring-1 ring-inset ring-line transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lift">
                <span className="flex items-center justify-between gap-3">
                  <StatusBadge status={r.verdict === "ok" ? "ok" : "maybe"}>{r.verdict === "ok" ? "신청 가능" : "확인 필요"}</StatusBadge>
                  <span className="data text-[14px] text-ink">{dayText(r).big}</span>
                </span>
                <span className="t-caption mt-4 block truncate text-muted">{programLine(r)}</span>
                <span className="mt-1 block truncate text-[18px] font-bold tracking-[-0.02em] text-ink">{r.a.complex}</span>
                <span className="t-small mt-1 block truncate text-sub">
                  {r.a.sido} {r.a.sigungu} · {r.best.rank?.label ?? r.best.group.label}
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function CheckFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile, update } = useProfile();
  const topic = params.get("topic");
  const startExtra = topic ? TOPIC_TO_STEP[topic] : undefined;
  const seq = useMemo<StepId[]>(() => {
    if (startExtra && EXTRA.includes(startExtra)) return [...EXTRA.slice(EXTRA.indexOf(startExtra))];
    if (startExtra) return [...CORE.slice(CORE.indexOf(startExtra)), "done", ...EXTRA];
    return [...CORE, "done", ...EXTRA];
  }, [startExtra]);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const step = seq[i];
  const inExtra = EXTRA.includes(step);
  const rail = inExtra ? EXTRA : CORE;
  const railIndex = rail.indexOf(step);

  // 날짜 판정(D-day)이 서버(UTC)와 브라우저(KST)에서 어긋나지 않게, 판정은 브라우저에서만 한다
  const hydrated = useHydrated();
  const results = useMemo(() => (hydrated ? evaluateAll(sampleAnnouncements(), profile) : []), [profile, hydrated]);
  const counts = countVerdicts(results);
  const topPicks = useMemo(
    () =>
      results
        .filter((r) => r.phase !== "closed" && r.verdict !== "no")
        .sort((x, y) => (x.verdict === y.verdict ? (x.best.rank?.order ?? 5) - (y.best.rank?.order ?? 5) : x.verdict === "ok" ? -1 : 1))
        .slice(0, 3),
    [results],
  );

  const go = (delta: number) => {
    const next = i + delta;
    if (next < 0) return router.push("/");
    if (next >= seq.length) return router.push("/results");
    setDir(delta);
    setI(next);
    window.scrollTo({ top: 0 });
  };

  const meta = step !== "done" ? META[step] : undefined;
  const View = step !== "done" ? STEP_VIEW[step] : undefined;
  const nextOk = canNext(step, profile);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="glass sticky top-0 z-30">
        <div className="wrap-form flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2">
            {step !== "done" && (
              <span className="data text-[14px] text-muted">
                {inExtra && <span className="mr-2 font-medium">정확도 올리기</span>}
                <span className="text-brand">{railIndex + 1}</span> / {rail.length}
              </span>
            )}
            <Link href="/results" className={buttonClass("ghost", "sm")}>
              {inExtra || step === "done" ? "결과로" : "나중에"}
            </Link>
          </div>
        </div>
        {step !== "done" && (
          <div className="wrap-form flex gap-1.5 pb-1">
            {rail.map((s, k) => (
              <span key={s} className="h-1 flex-1 overflow-hidden rounded-full bg-well">
                <motion.span
                  className="block h-full origin-left rounded-full bg-brand"
                  initial={false}
                  animate={{ scaleX: k <= railIndex ? 1 : 0 }}
                  transition={{ duration: 0.6, ease: EASE }}
                />
              </span>
            ))}
          </div>
        )}
      </header>

      <main className="wrap-form flex-1 pb-44 pt-8 md:pb-36 md:pt-14">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.section
            key={step}
            custom={dir}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 48 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -48 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: EASE }}
          >
            {step === "done" ? (
              <DoneView ok={counts.ok} maybe={counts.maybe} onMore={() => go(1)} top={topPicks} />
            ) : (
              <>
                <p className="eyebrow">
                  {railIndex + 1}/{rail.length} · {meta!.tag}
                  {inExtra && <span className="ml-2 font-medium text-muted">선택</span>}
                </p>
                <h1 className="t-display-m mt-3">{meta!.title}</h1>
                {meta!.help && <p className="t-body mt-3 max-w-[34em] text-sub">{meta!.help}</p>}
                <div className="mt-8 md:mt-10">{View && <View profile={profile} update={update} onNext={() => go(1)} />}</div>
              </>
            )}
          </motion.section>
        </AnimatePresence>
      </main>

      {step !== "done" && (
        <footer className="glass fixed inset-x-0 bottom-0 z-30 border-t border-line shadow-bar">
          <div className="wrap-form flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
            <Link href="/results" className="group flex h-10 items-center justify-between gap-4 rounded-[12px] bg-ok-soft px-4 sm:justify-start">
              <span className="flex items-center gap-2 text-[14px] font-semibold text-ok-ink">
                <span className="size-2 rounded-full bg-ok" />
                신청 가능
                <span>
                  <span className="num text-[20px] leading-none">
                    <AnimatedNumber value={counts.ok} />
                  </span>
                  <span className="ml-0.5 text-[14px]">건</span>
                </span>
              </span>
              <span className="text-[13px] font-medium text-sub group-hover:text-ink">
                확인 필요 <span className="data">{counts.maybe}</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <IconButton size="lg" aria-label="이전" onClick={() => go(-1)}>
                <BackArrow />
              </IconButton>
              {inExtra && (
                <Button variant="ghost" size="lg" onClick={() => go(1)} className="px-4">
                  건너뛰기
                </Button>
              )}
              <Button size="lg" onClick={() => go(1)} disabled={!nextOk} className="flex-1 sm:w-48 sm:flex-none">
                {i === seq.length - 1 ? "결과 보기" : "다음"}
                <Arrow size="lg" />
              </Button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
