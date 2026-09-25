"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Facade, type FacadeItem } from "@/components/motion/Facade";
import { Odometer } from "@/components/motion/Odometer";
import { DUR, EASE, SPRING } from "@/components/motion/tokens";
import { dayText, isUrgent, programLine, rankTone } from "@/components/results/verdict";
import { StatusBadge } from "@/components/ui/Badge";
import { Arrow, BackArrow, Button, ButtonLink, IconButton } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { Pane, WIN_LABEL, WinLegend, type WinState } from "@/components/ui/Window";
import { WinMark } from "@/components/motion/WinMark";
import { BEFORE_KEY } from "@/components/results/ResultsView";
import { SIDO, type Band, type Profile, type Sido } from "@/lib/domain";
import { SIGUNGU } from "@/lib/data/regions";
import { sampleAnnouncements } from "@/lib/data/sample";
import { withJosa } from "@/lib/josa";
import { placeText } from "@/lib/place";
import { useHydrated, useProfile } from "@/lib/profile";
import {
  accountBandFromYears,
  accountYearsFromBand,
  accountYearsText,
  ASSETS,
  CAR,
  CHILDREN,
  DEPOSIT,
  exactBand,
  HOME,
  INCOME,
  MARITAL,
  PAYMENTS,
  PROPERTY,
  profileChips,
  SPECIAL,
  YES_NO,
  YOUNG_CHILDREN_HELP,
  YOUNG_CHILDREN_LABEL,
  youngChildrenOptions,
} from "@/lib/questions";
import { derive, manwon } from "@/lib/rules/core";
import { byRelevance, countVerdicts, evaluateAll, settleCount, suggestAsks, type AskTopicId, type NoticeResult } from "@/lib/rules/evaluate";
import { incomeRuler } from "@/lib/rules/ruler";
import { SITE } from "@/lib/site";
import { bandEq, Chip, ChipGroup, Stepper, YesNo } from "./Choice";

type StepId = "birth" | "region" | "family" | "home" | "income" | "assets" | "account" | "household" | "special";

const CORE: StepId[] = ["birth", "region", "family", "home", "income", "assets"];
const EXTRA: StepId[] = ["account", "household", "special"];
const ALL: StepId[] = [...CORE, ...EXTRA];

const TOPIC_STEP: Record<AskTopicId, StepId> = {
  basics: "birth",
  family: "family",
  region: "region",
  home: "home",
  income: "income",
  assets: "assets",
  account: "account",
  household: "household",
  special: "special",
};

const META: Record<StepId, { tag: string; title: string; help?: string }> = {
  birth: { tag: "나이", title: "몇 년생이세요?", help: "청년·고령자 기준과 가점 계산에 써요." },
  region: { tag: "사는 곳", title: "지금 어디 사세요?", help: "주민등록상 주소예요. 공고 지역에 살면 순위에서 앞서요." },
  family: { tag: "가족", title: "가족 상황을 알려주세요", help: "자녀에는 배 속 아이도 넣어 주세요." },
  home: { tag: "집", title: "집이 있나요?", help: "대부분의 공고가 무주택을 기본 조건으로 봐요." },
  income: { tag: "소득", title: "한 달 소득은 얼마쯤이에요?", help: "월급·연금처럼 매달 들어오는 돈을 세금 떼기 전 기준으로(연봉 ÷ 12). 결혼했다면 배우자 소득도 더해 주세요." },
  assets: { tag: "재산", title: "재산은 어느 정도예요?", help: "대략이면 충분해요. 모르면 건너뛰어도 돼요." },
  account: { tag: "청약통장", title: "청약통장을 알려주세요", help: "분양 1순위와 가점, 국민임대 순위에 쓰여요." },
  household: { tag: "세대", title: "세대 정보를 알려주세요", help: "모르는 건 비워 두셔도 돼요." },
  special: { tag: "해당 계층", title: "해당되는 게 있나요?", help: "영구·매입임대 순위와 일부 특별공급에 쓰여요." },
};

const YEAR = new Date().getFullYear();

/** 선택지 구간이 내 값(정확한 금액 포함)을 품는가 — 720을 적으면 「700만 원대」가 켜진다 */
const within = (v: Band, o: Band) => v.min >= o.min && (o.max == null || (v.max != null && v.max <= o.max));

interface StepProps {
  profile: Profile;
  update: (p: Partial<Profile>) => void;
  onNext: () => void;
  skip: Record<string, boolean>;
  setSkip: (k: string, v: boolean) => void;
}

/* ───────────────────────── 단계 화면 ───────────────────────── */

function BirthStep({ profile, update, onNext }: StepProps) {
  const [text, setText] = useState(profile.birthYear ? String(profile.birthYear) : "");
  const n = Number(text);
  const valid = text.length === 4 && n >= 1930 && n <= YEAR - 15;
  return (
    <div>
      <label htmlFor="birth" className="text-[16px] font-semibold text-ink">
        태어난 해(네 자리)
      </label>
      <div className="mt-3 flex items-center gap-3">
        <input
          id="birth"
          autoFocus
          value={text}
          inputMode="numeric"
          autoComplete="off"
          placeholder="예: 1990"
          maxLength={4}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
            setText(v);
            const y = Number(v);
            if (v.length === 4 && y >= 1930 && y <= YEAR - 15) update({ birthYear: y });
          }}
          onKeyDown={(e) => e.key === "Enter" && valid && onNext()}
          className="num h-16 w-[6.5em] rounded-[10px] bg-page px-4 text-[32px] text-ink ring-1 ring-inset ring-line-strong outline-none placeholder:text-[22px] placeholder:font-medium placeholder:text-faint focus:ring-2 focus:ring-brand"
        />
        <span className="text-[20px] font-bold text-ink">년생</span>
      </div>
      <p className="t-body mt-4 min-h-6 text-sub" aria-live="polite">
        {valid ? (
          <>
            올해 만 <span className="data text-ink">{YEAR - n - 1}</span>세 또는 <span className="data text-ink">{YEAR - n}</span>세예요(생일 전·후)
          </>
        ) : text.length === 4 ? (
          "만 15세 이상부터 확인할 수 있어요"
        ) : null}
      </p>
    </div>
  );
}

function RegionStep({ profile, update }: StepProps) {
  const sido = profile.sido;
  const list = useRef<HTMLDivElement>(null);
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {SIDO.map((s) => (
          <Chip
            key={s}
            size="compact"
            selected={sido === s}
            onClick={() => {
              update({ sido: s as Sido, sigungu: sido === s ? profile.sigungu : undefined });
              setTimeout(() => list.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
            }}
          >
            {s}
          </Chip>
        ))}
      </div>
      <div ref={list} className="scroll-mt-24">
        <AnimatePresence initial={false}>
          {sido && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: DUR.base, ease: EASE.out }}>
              <p className="text-[16px] font-semibold text-ink">
                {sido} 어디예요? <span className="font-medium text-muted">(고르면 임대주택 순위가 정확해져요)</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
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
    </div>
  );
}

function FamilyStep({ profile, update }: StepProps) {
  const married = profile.marital === "newlywed" || profile.marital === "married";
  const [my, setMy] = useState(profile.marriedYear ? String(profile.marriedYear) : "");
  return (
    <div className="space-y-8">
      <ChipGroup
        label="혼인"
        options={MARITAL}
        value={profile.marital}
        onChange={(v) => update({ marital: v, ...(v === "newlywed" || v === "married" ? {} : { marriedYear: undefined, dualIncome: undefined }) })}
        cols="grid-cols-1 sm:grid-cols-2"
      />
      {married && (
        <div>
          <label htmlFor="married-year" className="text-[16px] font-semibold text-ink">
            혼인신고한 해 <span className="font-medium text-muted">(선택)</span>
          </label>
          <p className="mt-0.5 text-[14px] text-muted">알려주시면 「7년 이내」와 신혼 배점을 정확히 계산해요.</p>
          <input
            id="married-year"
            value={my}
            inputMode="numeric"
            placeholder="예: 2022"
            maxLength={4}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, "").slice(0, 4);
              setMy(v);
              const y = Number(v);
              if (v.length === 4 && y >= 1950 && y <= YEAR) update({ marriedYear: y, marital: YEAR - y <= 7 ? "newlywed" : "married" });
              else if (!v) update({ marriedYear: undefined });
            }}
            className="num mt-3 h-12 w-[7em] rounded-[10px] bg-page px-4 text-[20px] text-ink ring-1 ring-inset ring-line-strong outline-none placeholder:text-[16px] placeholder:font-medium placeholder:text-faint focus:ring-2 focus:ring-brand"
          />
        </div>
      )}
      <ChipGroup
        label="만 19세 미만 자녀(배 속 아이 포함)"
        size="compact"
        options={CHILDREN}
        value={profile.children}
        onChange={(v) =>
          update(
            v === 0
              ? { children: 0, infant: false, youngChildren: 0 }
              : { children: v, ...(profile.children === 0 ? { infant: undefined, youngChildren: undefined } : {}), ...(profile.youngChildren !== undefined && profile.youngChildren > v ? { youngChildren: v } : {}) },
          )
        }
        cols="grid-cols-2 sm:grid-cols-4"
      />
      {!!profile.children && (
        <>
          <ChipGroup
            label={YOUNG_CHILDREN_LABEL}
            help={YOUNG_CHILDREN_HELP}
            size="compact"
            options={youngChildrenOptions(profile.children)}
            value={profile.youngChildren}
            onChange={(v) => update({ youngChildren: v })}
            cols="grid-cols-2 sm:grid-cols-4"
          />
          <YesNo q={YES_NO.infant} value={profile.infant} onChange={(v) => update({ infant: v })} />
        </>
      )}
    </div>
  );
}

/** 혼자 사는 사람에게 「등본에 같이 올라 있는 가족」은 낯설다 — 같은 값, 쉬운 문구 */
const HOME_SOLO = [
  { label: "집이 없어요", value: "none" as const, sub: "분양권·입주권도 집으로 쳐요" },
  { label: "제 이름으로 된 집이 있어요", value: "own" as const, sub: "분양권·입주권 포함" },
  { label: "같은 세대로 올라 있는 가족 중에 집 가진 사람이 있어요", value: "familyOwn" as const, sub: "부모님과 한 세대라면" },
];

function HomeStep({ profile, update }: StepProps) {
  const solo = (profile.marital === "single" || profile.marital === "solo") && profile.children === 0;
  return (
    <ChipGroup
      options={solo ? HOME_SOLO : HOME}
      value={profile.home}
      onChange={(v) => update({ home: v, ...(v !== "none" ? { neverOwned: false, homelessYears: undefined } : {}) })}
      cols="grid-cols-1"
    />
  );
}

function IncomeStep({ profile, update, skip, setSkip }: StepProps) {
  const d = derive(profile);
  const married = !!d.married;
  const exact = profile.income && profile.income.min === profile.income.max ? String(profile.income.min) : "";
  const [text, setText] = useState(exact);
  const ruler = incomeRuler(profile);
  const reduce = useReducedMotion();
  return (
    <div className="space-y-8">
      <div>
        <ChipGroup
          options={INCOME}
          value={profile.income}
          onChange={(v) => {
            setText("");
            setSkip("income", false);
            update({ income: v });
          }}
          equals={within}
          size="compact"
          cols="grid-cols-2 sm:grid-cols-3"
        />
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label htmlFor="income-exact" className="text-[15px] font-medium text-body">
            정확히 알면
          </label>
          <span className="flex items-center gap-2">
            <input
              id="income-exact"
              value={text}
              inputMode="numeric"
              placeholder="예: 320"
              maxLength={5}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 5);
                setText(v);
                if (v) {
                  setSkip("income", false);
                  update({ income: exactBand(Number(v)) });
                }
              }}
              className="num h-11 w-[6em] rounded-[10px] bg-page px-3 text-[18px] text-ink ring-1 ring-inset ring-line-strong outline-none placeholder:text-[15px] placeholder:font-medium placeholder:text-faint focus:ring-2 focus:ring-brand"
            />
            <span className="text-[15px] font-medium text-body">만 원</span>
          </span>
          <div>
            <Chip
              size="pill"
              selected={!!skip.income}
              onClick={() => {
                setText("");
                setSkip("income", true);
                update({ income: undefined });
              }}
            >
              잘 모르겠어요
            </Chip>
          </div>
        </div>
        {skip.income && <p className="t-small mt-2 text-sub">괜찮아요. 소득을 보는 공고는 「확인 필요」로 남겨 둘게요.</p>}
      </div>

      {married && <YesNo q={YES_NO.dualIncome} value={profile.dualIncome} onChange={(v) => update({ dualIncome: v })} />}

      {ruler && (
        <div>
          <p className="text-[16px] font-semibold text-ink">
            우리 집({ruler.size}인{ruler.dual ? " · 맞벌이" : ""}) 기준 소득 상한
          </p>
          <p className="mt-0.5 text-[14px] text-muted">
            유형마다 기준이 되는 금액과 %가 달라요.{" "}
            <Link href="/guide/income" target="_blank" className="font-semibold text-ink underline decoration-line-strong underline-offset-4">
              소득 기준표 보기
            </Link>
          </p>
          <ul className="mt-3 border-t border-ink">
            {ruler.rows.map((r, i) => (
              <li key={r.key} className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-line py-2.5">
                <WinMark tri={r.tri} delay={reduce ? 0 : i * 0.02} />
                <span className="min-w-0 text-[14px] text-body">
                  {r.label} <span className="text-muted">{r.basisShort} {r.pct}%</span>
                </span>
                <span className="data text-[14px] text-ink">월 {manwon(Math.round(r.limit))}</span>
              </li>
            ))}
          </ul>
          <ul className="t-small mt-3 space-y-0.5 text-muted">
            {ruler.bases.map((b) => (
              <li key={b.kind}>
                {b.short} 100% = 월 {manwon(Math.round(b.value))} · {b.note}
              </li>
            ))}
          </ul>
          {!profile.income && <p className="t-small mt-2 text-muted">소득을 고르면 어느 유형까지 되는지 표시돼요.</p>}
        </div>
      )}
    </div>
  );
}

function AssetsStep({ profile, update, skip, setSkip }: StepProps) {
  return (
    <div className="space-y-8">
      <ChipGroup
        label="총자산"
        help="집·땅·예금·차를 모두 더하고 빚을 뺀 금액이에요. 전세보증금도 넣어요."
        options={ASSETS.map(({ label, value }) => ({ label, value }))}
        value={profile.assets}
        onChange={(v) => {
          setSkip("assets", false);
          update({ assets: v });
        }}
        equals={bandEq}
        cols="grid-cols-1 sm:grid-cols-2"
      />
      <ChipGroup
        label="그중 부동산(집·땅·건물)"
        help="공공분양·특별공급이 따로 보는 값이에요."
        options={PROPERTY.map(({ label, value, sub }) => ({ label, value, sub: value.max === 0 ? sub : undefined }))}
        value={profile.property}
        onChange={(v) => update({ property: v })}
        equals={bandEq}
        cols="grid-cols-1 sm:grid-cols-2"
      />
      <ChipGroup label="자동차(가장 비싼 차 한 대)" options={CAR} value={profile.car} onChange={(v) => update({ car: v })} equals={bandEq} size="compact" cols="grid-cols-1 sm:grid-cols-3" />
      <div>
        <Chip
          size="pill"
          selected={!!skip.assets}
          onClick={() => {
            setSkip("assets", true);
          }}
        >
          잘 모르겠어요 — 나중에 할게요
        </Chip>
      </div>
    </div>
  );
}

function AccountStep({ profile, update }: StepProps) {
  const married = !!derive(profile).married;
  const yrs = accountYearsFromBand(profile.accountMonths);
  const spouse = accountYearsFromBand(profile.spouseAccountMonths);
  const stepYears = (v: number, dir: 1 | -1) => (dir > 0 ? (v < 0.5 ? 0.5 : v < 1 ? 1 : v + 1) : v <= 0.5 ? 0 : v <= 1 ? 0.5 : v - 1);
  return (
    <div className="space-y-8">
      <YesNo
        q={YES_NO.hasAccount}
        value={profile.hasAccount}
        onChange={(v) => update(v ? { hasAccount: true } : { hasAccount: false, accountMonths: undefined, payments: undefined, deposit: undefined })}
      />
      <AnimatePresence initial={false}>
        {profile.hasAccount && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: DUR.base, ease: EASE.out }} className="space-y-8">
            <Stepper
              label="가입한 지"
              value={yrs}
              onChange={(v) => update({ accountMonths: accountBandFromYears(v) })}
              max={15}
              step={stepYears}
              text={(v) => (v >= 15 ? "15년 이상" : accountYearsText(v))}
            />
            <ChipGroup label="납입 횟수" help="은행 앱의 「인정 회차」예요." size="compact" options={PAYMENTS} value={profile.payments} onChange={(v) => update({ payments: v })} equals={bandEq} cols="grid-cols-2 sm:grid-cols-4" />
            <ChipGroup label="지금까지 넣은 돈" size="compact" options={DEPOSIT} value={profile.deposit} onChange={(v) => update({ deposit: v })} equals={bandEq} cols="grid-cols-2 sm:grid-cols-4" />
            {married && (
              <Stepper
                label="배우자 통장 가입한 지(선택)"
                help="가점에 배우자 통장 기간 점수의 절반(최대 3점)이 더해져요."
                value={spouse}
                onChange={(v) => update({ spouseAccountMonths: accountBandFromYears(v) })}
                max={15}
                step={stepYears}
                text={(v) => (v >= 15 ? "15년 이상" : accountYearsText(v))}
              />
            )}
            <p className="t-small text-muted">은행 앱의 청약통장 화면이나 청약홈 「청약통장 순위확인서」에서 볼 수 있어요.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HouseholdStep({ profile, update }: StepProps) {
  const none = profile.home === "none";
  const always = profile.homelessYears === 99;
  const age = derive(profile).age;
  const senior = !!age && age[0] >= 60;
  useEffect(() => {
    if (senior && profile.livesWithParents === undefined) update({ livesWithParents: false });
  }, [senior, profile.livesWithParents, update]);
  return (
    <div className="space-y-8">
      <YesNo q={YES_NO.householdHead} value={profile.householdHead} onChange={(v) => update({ householdHead: v })} />
      <Stepper
        label={`${profile.sido ?? "지금 사는 시·도"}에 주민등록을 두고 계속 산 지`}
        value={profile.residenceYears}
        onChange={(v) => update({ residenceYears: v })}
        max={20}
        text={(v) => (v === 0 ? "1년 미만" : v >= 20 ? "20년 이상" : `${v}년`)}
      />
      {none && (
        <div>
          <Stepper
            label="집 없이 지낸 지"
            help="집을 판 적이 있다면 판 뒤부터 세요."
            value={always ? undefined : profile.homelessYears}
            onChange={(v) => update({ homelessYears: v })}
            max={30}
            text={(v) => (v === 0 ? "1년 미만" : v >= 30 ? "30년 이상" : `${v}년`)}
          />
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] text-body">
            <input
              type="checkbox"
              checked={always}
              onChange={(e) => update(e.target.checked ? { homelessYears: 99, neverOwned: true } : { homelessYears: undefined, neverOwned: undefined })}
              className="size-5 accent-[#2447d6]"
            />
            태어나서 지금까지 쭉 집이 없었어요
          </label>
        </div>
      )}
      {none && !always && <YesNo q={YES_NO.neverOwned} value={profile.neverOwned} onChange={(v) => update({ neverOwned: v })} />}
      {!senior && <YesNo q={YES_NO.livesWithParents} value={profile.livesWithParents} onChange={(v) => update({ livesWithParents: v })} />}
      <YesNo q={YES_NO.wonRecently} value={profile.wonRecently} onChange={(v) => update({ wonRecently: v })} />
    </div>
  );
}

function SpecialStep({ profile, update }: StepProps) {
  const cur = profile.special ?? [];
  const d = derive(profile);
  const age = d.age;
  const elder = age && age[1] >= 65;
  // 「대학생인가요?」는 만 40세 이상이거나 혼인 중이면 묻지 않는다(자동 아니요) — 행복주택 대학생 계층은
  // 만 39세 이하·혼인 중이 아닌 사람만이라, 묻지 않아도 계층이 계속 「확인 필요」로 남지 않게
  const askStudent = (!age || age[0] <= 39) && !d.married;
  useEffect(() => {
    if (!askStudent && profile.student === undefined) update({ student: false });
  }, [askStudent, profile.student, update]);
  // 소득세 5년 납부는 생애최초 특별공급(청약통장 필요)에만 쓰인다 — 통장이 없다고 답했으면 묻지 않는다
  const askTax = profile.hasAccount !== false;
  return (
    <div className="space-y-8">
      {elder && (
        <p className="border-y border-line py-3 text-[15px] font-medium text-ink">만 65세 이상이라 고령자 계층은 따로 고르지 않아도 자동으로 봐요.</p>
      )}
      <fieldset>
        <legend className="text-[16px] font-semibold text-ink">해당하는 걸 모두 골라 주세요</legend>
        <p className="mt-0.5 text-[14px] text-muted">기초연금은 기초생활수급이 아니에요.</p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SPECIAL.map((o) => (
            <Chip key={o.value} size="compact" selected={cur.includes(o.value)} onClick={() => update({ special: cur.includes(o.value) ? cur.filter((x) => x !== o.value) : [...cur, o.value] })}>
              {o.label}
            </Chip>
          ))}
          <Chip size="compact" selected={profile.special !== undefined && cur.length === 0} onClick={() => update({ special: [] })}>
            해당 없음
          </Chip>
        </div>
      </fieldset>
      {askStudent && <YesNo q={YES_NO.student} value={profile.student} onChange={(v) => update({ student: v })} />}
      {askTax && <YesNo q={YES_NO.taxFiveYears} value={profile.taxFiveYears} onChange={(v) => update({ taxFiveYears: v })} />}
    </div>
  );
}

const STEP_VIEW: Record<StepId, (p: StepProps) => React.ReactNode> = {
  birth: BirthStep,
  region: RegionStep,
  family: FamilyStep,
  home: HomeStep,
  income: IncomeStep,
  assets: AssetsStep,
  account: AccountStep,
  household: HouseholdStep,
  special: SpecialStep,
};

function canNext(step: StepId, p: Profile, skip: Record<string, boolean>): boolean {
  switch (step) {
    case "birth":
      return !!p.birthYear;
    case "region":
      return !!p.sido;
    case "family":
      return p.marital !== undefined && p.children !== undefined && (p.children === 0 || (p.infant !== undefined && p.youngChildren !== undefined));
    case "home":
      return !!p.home;
    case "income":
      return !!p.income || !!skip.income;
    case "assets":
      return !!p.assets || !!skip.assets;
    default:
      return true;
  }
}

/* ───────────────────────── 살아 있는 창(오른쪽·하단) ───────────────────────── */

function winOf(r: NoticeResult): WinState {
  return r.phase === "closed" ? "closed" : r.verdict;
}

/** 바뀐 만큼 떠오르는 「+2」 */
function Delta({ value }: { value: number }) {
  const prev = useRef(value);
  const [d, setD] = useState<{ n: number; k: number } | null>(null);
  useEffect(() => {
    const diff = value - prev.current;
    prev.current = value;
    if (diff) setD({ n: diff, k: Date.now() });
  }, [value]);
  useEffect(() => {
    if (!d) return;
    const t = setTimeout(() => setD(null), 900);
    return () => clearTimeout(t);
  }, [d]);
  return (
    <AnimatePresence>
      {d && (
        <motion.span
          key={d.k}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: -2 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: DUR.base, ease: EASE.out }}
          className={`absolute left-full top-0 ml-1 text-[13px] font-bold tabular ${d.n > 0 ? "text-brand" : "text-muted"}`}
        >
          {d.n > 0 ? `+${d.n}` : d.n}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

function LivePanel({ results }: { results: NoticeResult[] }) {
  const counts = countVerdicts(results);
  const items: FacadeItem[] = results.map((r) => ({ id: r.a.id, state: winOf(r), label: `${r.a.complex} — ${WIN_LABEL[winOf(r)]}` }));
  return (
    <div>
      <div className="section-head">
        <span>지금 조건으로</span>
        <span className="text-muted">{SITE.sampleData ? "예시 공고" : "공고"} {results.length}건</span>
      </div>
      <Facade items={items} cols={4} door={false} className="mt-5 max-w-[240px]" />
      <dl className="mt-5 flex gap-8">
        <div>
          <dt className="text-[13px] font-semibold text-sub">신청 가능</dt>
          <dd className={`t-num-l relative mt-1 w-fit ${counts.ok ? "text-brand" : "text-muted"}`}>
            <Odometer value={counts.ok} />
            <Delta value={counts.ok} />
          </dd>
        </div>
        <div>
          <dt className="text-[13px] font-semibold text-sub">확인 필요</dt>
          <dd className={`t-num-l mt-1 ${counts.maybe ? "text-maybe-ink" : "text-muted"}`}>
            <Odometer value={counts.maybe} />
          </dd>
        </div>
      </dl>
      <p className="t-small mt-3 text-muted">답할수록 「확인 필요」가 「신청 가능」이나 「해당 없음」으로 정해져요.</p>
      <WinLegend className="mt-4" states={["ok", "maybe", "no"]} />
    </div>
  );
}

/* ───────────────────────── 완료·요약 ───────────────────────── */

/** 「1분 더 답하기」·「조건 고치기」 직전 건수를 남긴다 — 결과 화면이 무엇이 바뀌었는지 알려 준다 */
function rememberBefore(results: NoticeResult[]) {
  try {
    if (sessionStorage.getItem(BEFORE_KEY)) return;
    const c = countVerdicts(results);
    sessionStorage.setItem(BEFORE_KEY, JSON.stringify({ ok: c.ok, maybe: c.maybe, no: c.no }));
  } catch {}
}

/**
 * 입력 끝. 창은 전부 「확인 필요」(반 칸)에서 시작해 0.25초 뒤 최종 상태로 정해진다 —
 * 답한 만큼 판정이 정해지는 순간을 보여 준다. 제목 숫자는 처음부터 최종값이다.
 */
function DoneView({ results, profile }: { results: NoticeResult[]; profile: Profile }) {
  const counts = countVerdicts(results);
  const asks = suggestAsks(results, profile);
  const reduce = useReducedMotion();
  const [lit, setLit] = useState(!!reduce);
  useEffect(() => {
    if (reduce) return;
    const t = setTimeout(() => setLit(true), 250);
    return () => clearTimeout(t);
  }, [reduce]);
  const items: FacadeItem[] = results.map((r) => ({
    id: r.a.id,
    state: lit ? winOf(r) : r.phase === "closed" ? "closed" : "maybe",
    label: `${r.a.complex} — ${WIN_LABEL[winOf(r)]}`,
    href: `/notice/${r.a.id}`,
  }));
  // 결과 화면이 처음 여는 탭(신청 가능, 없으면 확인 필요)과 같은 목록·같은 순서(잘 맞는 순)
  const lead = counts.ok > 0 ? "ok" : "maybe";
  const top = results
    .filter((r) => r.phase !== "closed" && r.verdict === lead)
    .sort(byRelevance(profile))
    .slice(0, 3);
  const more = asks.length > 0;
  const moreFirst = more && counts.maybe > counts.ok;
  const moreLabels = asks.slice(0, 2).map((a) => a.label).join("·");
  // 두 묶음을 다 답했을 때 정해지는 공고만 센다 — 답했는데 그대로면 약속을 어긴 셈이라
  const moreCount = settleCount(
    results,
    asks.slice(0, 2).map((a) => a.topic),
    profile,
  );
  const moreHref = more ? `/check?step=${TOPIC_STEP[asks[0].topic]}` : "/results";
  return (
    <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-7">
        <p className="text-[14px] font-semibold text-sub">입력 끝</p>
        <h1 className="t-h1 mt-2">
          신청할 수 있는 공고 <span className={counts.ok ? "text-brand" : "text-sub"}>{counts.ok}건</span>
        </h1>
        <p className="t-body-l mt-4 max-w-[30em] text-sub">
          {counts.maybe > 0 ? (
            <>
              아직 모르는 공고가 <span className="font-semibold text-maybe-ink">{counts.maybe}건</span> 있어요.{" "}
              {more
                ? moreCount > 0
                  ? `${withJosa(moreLabels, "을/를")} 답하면 ${moreCount}건이 더 정해져요.`
                  : `${withJosa(moreLabels, "을/를")} 답하면 결과가 더 정확해져요.`
                : "공고 상세에서 무엇이 걸리는지 볼 수 있어요."}
            </>
          ) : (
            "답한 조건으로 모든 공고의 결과가 정해졌어요."
          )}
        </p>
        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
          {moreFirst ? (
            <>
              <ButtonLink href={moreHref} size="lg" arrow onClick={() => rememberBefore(results)}>
                1분 더 답하기
              </ButtonLink>
              <ButtonLink href="/results" size="lg" variant="outline">
                결과 먼저 보기
              </ButtonLink>
            </>
          ) : (
            <>
              <ButtonLink href="/results" size="lg" arrow>
                결과 보기
              </ButtonLink>
              {more && (
                <ButtonLink href={moreHref} size="lg" variant="outline" onClick={() => rememberBefore(results)}>
                  1분 더 답하기
                </ButtonLink>
              )}
            </>
          )}
        </div>
        {top.length > 0 && (
          <ul className="mt-10 border-t border-ink">
            {top.map((r, k) => (
              <motion.li
                key={r.a.id}
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING.land, delay: 0.6 + k * 0.04 }}
                className="border-b border-line"
              >
                <Link href={`/notice/${r.a.id}`} className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 py-4">
                  <span className="min-w-0">
                    <span className="block truncate text-[14px] text-muted">
                      {programLine(r)} · {placeText(r.a)}
                    </span>
                    <span className="block truncate text-[18px] font-bold tracking-[-0.03em] text-ink group-hover:underline">{r.a.complex}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <StatusBadge status={r.verdict === "ok" ? "ok" : "maybe"}>{r.verdict === "ok" ? "신청 가능" : "확인 필요"}</StatusBadge>
                      {r.best.rank && <span className={`text-[15px] font-bold ${rankTone(r.verdict, r.best.rank)}`}>{r.best.rank.label}</span>}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className={`t-num-m block ${isUrgent(r) ? "text-hot-ink" : "text-ink"}`}>{dayText(r).big}</span>
                    <span className="block text-[13px] font-medium text-muted">{dayText(r).small}</span>
                  </span>
                </Link>
              </motion.li>
            ))}
          </ul>
        )}
        <p className="t-small mt-6 text-muted">결과는 참고용 예상이에요. 최종 자격과 순위는 공급기관이 서류로 심사해 정해요.</p>
      </div>
      <div className="lg:col-span-4 lg:col-start-9">
        <div className="section-head">
          <span>불 켜진 창 = 신청 가능</span>
        </div>
        <Facade items={items} cols={4} className="mt-5 max-w-[200px] lg:max-w-[300px]" />
        <WinLegend className="mt-4" states={["ok", "maybe", "no", "closed"]} />
      </div>
    </div>
  );
}

/** 「조건 고치기」 — 답한 것을 한눈에 보고 항목별로 고친다 */
function SummaryView({ profile }: { profile: Profile }) {
  const rows: { step: StepId; label: string; value: string }[] = [
    { step: "birth", label: "나이", value: profile.birthYear ? `${profile.birthYear}년생` : "" },
    { step: "region", label: "사는 곳", value: profile.sido ? placeText({ sido: profile.sido, sigungu: profile.sigungu }) : "" },
    { step: "family", label: "가족", value: profileChips({ marital: profile.marital, marriedYear: profile.marriedYear, children: profile.children }).join(" · ") },
    { step: "home", label: "집", value: profileChips({ home: profile.home }).join("") },
    { step: "income", label: "소득", value: profileChips({ income: profile.income }).join("") + (profile.dualIncome ? " · 맞벌이" : "") },
    { step: "assets", label: "재산", value: [profile.assets && "총자산", profile.property && "부동산", profile.car && "자동차"].filter(Boolean).join("·") + (profile.assets ? " 입력함" : "") },
    { step: "account", label: "청약통장", value: profile.hasAccount === undefined ? "" : profile.hasAccount ? "있음" : "없음" },
    { step: "household", label: "세대", value: profile.householdHead === undefined ? "" : profile.householdHead ? "세대주" : "세대원" },
    { step: "special", label: "해당 계층", value: profile.special === undefined ? "" : profile.special.length ? `${profile.special.length}개` : "해당 없음" },
  ];
  return (
    <div className="max-w-[640px]">
      <h1 className="t-h1">조건 고치기</h1>
      <p className="t-body mt-3 text-sub">고칠 항목만 눌러 바꾸면 결과에 바로 반영돼요.</p>
      <ul className="mt-8 border-t border-ink">
        {rows.map((r) => (
          <li key={r.step} className="border-b border-line">
            <Link href={`/check?step=${r.step}&edit=1`} className="group grid grid-cols-[6em_minmax(0,1fr)_auto] items-center gap-4 py-4">
              <span className="text-[15px] font-semibold text-ink">{r.label}</span>
              <span className={`truncate text-[15px] ${r.value ? "text-body" : "text-muted"}`}>{r.value || "아직 안 넣음"}</span>
              <span className="text-[14px] font-semibold text-ink underline decoration-line-strong underline-offset-4 group-hover:decoration-ink">고치기</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <ButtonLink href="/results" size="lg" arrow>
          결과 보기
        </ButtonLink>
      </div>
    </div>
  );
}

/* ───────────────────────── 흐름 ───────────────────────── */

export function CheckFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const { profile, update } = useProfile();
  const hydrated = useHydrated();
  const reduce = useReducedMotion();

  const topic = params.get("topic") as AskTopicId | null;
  const stepParam = params.get("step");
  const edit = params.get("edit") === "1";
  const done = stepParam === "done";
  const summary = edit && !stepParam && !topic;
  const step: StepId = topic && TOPIC_STEP[topic] ? TOPIC_STEP[topic] : ALL.includes(stepParam as StepId) ? (stepParam as StepId) : "birth";
  // 한 단계만 고치러 온 경우(결과 화면의 「알려주기」·「조건 고치기」): 끝나면 결과로 돌아간다
  const single = !!topic || (edit && !!stepParam);
  const rail = single ? [step] : EXTRA.includes(step) ? EXTRA : CORE;
  const railIndex = rail.indexOf(step);

  const [skip, setSkipState] = useState<Record<string, boolean>>({});
  const setSkip = (k: string, v: boolean) => setSkipState((s) => ({ ...s, [k]: v }));

  const results = useMemo(() => (hydrated ? evaluateAll(sampleAnnouncements(), profile) : []), [profile, hydrated]);

  const go = (delta: 1 | -1) => {
    if (delta < 0) return router.back();
    if (single) return router.push("/results");
    const next = rail[railIndex + 1];
    if (next) router.push(`/check?step=${next}`, { scroll: true });
    else router.push(rail === CORE ? "/check?step=done" : "/results");
  };

  const nextOk = canNext(step, profile, skip);
  const meta = META[step];
  const View = STEP_VIEW[step];
  const last = single || railIndex === rail.length - 1;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step, done, summary]);
  useEffect(() => {
    // 한 단계만 고치러 왔거나 요약에서 고칠 때, 들어온 순간의 건수를 남긴다(답하는 동안 다시 쓰지 않는다)
    if (hydrated && (single || summary)) rememberBefore(results);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, single, summary]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-page">
        <div className="wrap-form flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            {!done && !summary && !single && (
              <span className="data text-[14px] text-muted">
                {EXTRA.includes(step) && <span className="mr-2 font-medium">정확도 올리기</span>}
                <span className="text-ink">{railIndex + 1}</span> / {rail.length}
              </span>
            )}
            <Link href="/results" className="-mr-2 inline-flex h-11 items-center px-2 text-[14px] font-semibold text-sub underline decoration-line-strong underline-offset-4 hover:text-ink">
              {done || EXTRA.includes(step) || single ? "결과로" : "나중에"}
            </Link>
          </div>
        </div>
        {!done && !summary && !single && (
          <div className="wrap-form flex gap-1 pb-2">
            {rail.map((s, k) => (
              <span key={s} className="h-1 flex-1 overflow-hidden rounded-[1px] bg-well">
                <motion.span
                  className="block h-full origin-left bg-ink"
                  initial={false}
                  animate={{ scaleX: k <= railIndex ? 1 : 0 }}
                  transition={reduce ? { duration: 0 } : { duration: DUR.base, ease: EASE.out }}
                />
              </span>
            ))}
          </div>
        )}
      </header>

      <main className="wrap-form flex-1 pb-44 pt-8 md:pb-36 md:pt-12">
        {!hydrated ? (
          <div className="h-64 max-w-[640px] animate-pulse rounded-[4px] bg-well" />
        ) : done ? (
          <DoneView results={results} profile={profile} />
        ) : summary ? (
          <SummaryView profile={profile} />
        ) : (
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-7">
              <AnimatePresence mode="wait" initial={false}>
                <motion.section
                  key={step}
                  initial={reduce ? false : { opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0, transition: { duration: 0.28, ease: EASE.out } }}
                  exit={reduce ? undefined : { opacity: 0, x: -16, transition: { duration: 0.14, ease: EASE.exit } }}
                >
                  <p className="text-[14px] font-semibold text-sub">
                    {single ? meta.tag : `${railIndex + 1}/${rail.length} · ${meta.tag}`}
                    {EXTRA.includes(step) && <span className="ml-2 font-medium text-muted">선택</span>}
                  </p>
                  <h1 className="t-h1 mt-2">{meta.title}</h1>
                  {meta.help && <p className="t-body mt-3 max-w-[34em] text-sub">{meta.help}</p>}
                  <div className="mt-8 md:mt-10">
                    <View profile={profile} update={update} onNext={() => go(1)} skip={skip} setSkip={setSkip} />
                  </div>
                </motion.section>
              </AnimatePresence>
            </div>
            <aside className="hidden lg:col-span-4 lg:col-start-9 lg:block">
              <div className="sticky top-28">
                <LivePanel results={results} />
              </div>
            </aside>
          </div>
        )}
      </main>

      {hydrated && !done && !summary && (
        <footer className="fixed inset-x-0 bottom-0 z-30 bg-page shadow-bar">
          <div className="wrap-form flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-4">
            <MobileCounts results={results} />
            <div className="flex items-center gap-2 sm:ml-auto">
              <IconButton size="lg" aria-label="이전" onClick={() => go(-1)}>
                <BackArrow />
              </IconButton>
              {EXTRA.includes(step) && !single && (
                <Button variant="ghost" size="lg" onClick={() => go(1)}>
                  건너뛰기
                </Button>
              )}
              <Button size="lg" onClick={() => go(1)} disabled={!nextOk} className="flex-1 sm:w-52 sm:flex-none">
                {single ? "저장하고 결과 보기" : last ? (EXTRA.includes(step) ? "결과 보기" : "다 했어요") : "다음"}
                <Arrow size="lg" />
              </Button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

/** 하단 바의 실시간 건수 + 한 줄 창 띠(모바일에서도 창이 켜지는 걸 본다) — 데스크탑은 오른쪽 패널이 있어 숨긴다 */
function MobileCounts({ results }: { results: NoticeResult[] }) {
  const c = countVerdicts(results);
  return (
    <Link href="/results" className="block lg:hidden" aria-label={`신청 가능 ${c.ok}건, 확인 필요 ${c.maybe}건 — 결과 보기`}>
      <span className="flex max-h-[31px] flex-wrap gap-[3px] overflow-hidden" aria-hidden>
        {results.map((r) => (
          <Pane key={r.a.id} state={winOf(r)} size="sm" />
        ))}
      </span>
      <span className="mt-2 flex h-7 items-center gap-5">
        <span className="flex items-baseline gap-1.5 text-[14px] font-semibold text-sub">
          신청 가능
          <span className={`t-num-m relative leading-none ${c.ok ? "text-brand" : "text-muted"}`}>
            <Odometer value={c.ok} />
            <Delta value={c.ok} />
          </span>
        </span>
        <span className="flex items-baseline gap-1.5 text-[14px] font-semibold text-sub">
          확인 필요
          <span className={`t-num-m leading-none ${c.maybe ? "text-maybe-ink" : "text-muted"}`}>{c.maybe}</span>
        </span>
      </span>
    </Link>
  );
}
