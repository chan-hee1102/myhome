"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { computeGajeom } from "@/lib/rules/gajeom";

function Slider({
  label,
  value,
  max,
  onChange,
  format,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline justify-between gap-4">
        <span className="text-[15px] font-medium text-body">{label}</span>
        <span className="data text-[15px] text-brand">{format(value)}</span>
      </span>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range mt-2 w-full"
        style={{ "--pct": `${(value / max) * 100}%` } as React.CSSProperties}
      />
    </label>
  );
}

const years = (v: number) => (v === 0 ? "1년 미만" : v === 15 ? "15년 이상" : `${v}년`);

/**
 * 가점 84점 계산기. 흰 카드 하나(랜딩·가이드 공용).
 * 초기값도 서버에서 그려져 HTML에 점수가 들어 있다.
 */
export function GajeomCalc() {
  const [homelessYears, setHomelessYears] = useState(7);
  const [dependents, setDependents] = useState(2);
  const [accountYears, setAccountYears] = useState(6);
  const { total, lines } = computeGajeom({ homeless: true, homelessYears, dependents, accountMonths: accountYears * 12 });
  return (
    <div className="rounded-[24px] bg-page p-6 shadow-lift ring-1 ring-inset ring-line md:p-8">
      <div className="flex items-end justify-between border-b border-line pb-5">
        <span className="text-[15px] font-semibold text-sub">내 가점</span>
        <span className="text-ink">
          <span className="num text-[64px] leading-[0.9] text-brand md:text-[80px]">
            <AnimatedNumber value={total} />
          </span>
          <span className="ml-1.5 text-[20px] font-semibold text-faint">/ 84점</span>
        </span>
      </div>
      <div className="mt-6 space-y-5">
        <Slider label="무주택 기간" value={homelessYears} max={15} onChange={setHomelessYears} format={years} />
        <Slider label="부양가족 (본인 제외)" value={dependents} max={6} onChange={setDependents} format={(v) => (v === 6 ? "6명 이상" : `${v}명`)} />
        <Slider label="청약통장 가입 기간" value={accountYears} max={15} onChange={setAccountYears} format={years} />
      </div>
      <ul className="mt-7 space-y-3 rounded-[16px] bg-wash p-4">
        {lines.map((l) => (
          <li key={l.key} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1.5">
            <span className="text-[14px] text-sub">{l.label}</span>
            <span className="data text-[14px] text-ink">
              {l.points} <span className="text-faint">/ {l.max}</span>
            </span>
            <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-line">
              <motion.span
                className="block h-full rounded-full bg-brand-bright"
                initial={false}
                animate={{ width: `${(l.points / l.max) * 100}%` }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              />
            </span>
          </li>
        ))}
      </ul>
      <p className="t-small mt-5 text-muted">
        무주택 기간은 만 30세(그 전에 결혼했다면 혼인신고일)부터 셉니다. 만 30세 전 미혼이면 0점입니다.
      </p>
    </div>
  );
}
