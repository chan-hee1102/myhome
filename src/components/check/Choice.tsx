"use client";

import { motion } from "motion/react";

/**
 * 조건 입력 선택지 규격
 *   md       min-h 52, 왼쪽 정렬 — 문장형
 *   compact  h 48, 가운데·한 줄 — 시도·자녀 수 등 짧은 값
 *   pill     h 40, 알약 — 시군구·「잘 모르겠어요」
 * 선택되면 흰 바탕 + 오른쪽 체크.
 */
export type ChipSize = "md" | "compact" | "pill";

const SIZE: Record<ChipSize, string> = {
  md: "min-h-[52px] justify-between rounded-[14px] px-4 py-3 text-left text-[15px]",
  compact: "h-12 justify-center rounded-[14px] px-2 text-center text-[15px] whitespace-nowrap",
  pill: "h-10 justify-center rounded-full px-4 text-[14px] whitespace-nowrap",
};

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Chip({
  selected,
  onClick,
  children,
  sub,
  size = "md",
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  sub?: string;
  size?: ChipSize;
}) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-3 font-medium transition-[background-color,box-shadow,color] duration-200 ${SIZE[size]} ${
        selected
          ? "bg-pure text-void"
          : "bg-white/[0.03] text-cloud ring-1 ring-inset ring-white/14 hover:bg-white/6 hover:ring-white/28"
      } ${sub ? "min-h-16" : ""}`}
    >
      <span className="min-w-0">
        <span className="block">{children}</span>
        {sub && <span className={`mt-0.5 block text-[13px] font-normal ${selected ? "text-black/60" : "text-ash"}`}>{sub}</span>}
      </span>
      {size === "md" && selected && <Check />}
    </motion.button>
  );
}

export function ChipGroup<T>({
  label,
  options,
  value,
  onChange,
  cols = "grid-cols-2",
  size = "md",
  equals = (a: T, b: T) => a === b,
}: {
  label?: string;
  options: { label: string; value: T; sub?: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
  cols?: string;
  size?: ChipSize;
  equals?: (a: T, b: T) => boolean;
}) {
  return (
    <fieldset>
      {label && <legend className="mb-3 text-[14px] font-medium text-ash">{label}</legend>}
      <div className={`grid gap-2 ${cols}`}>
        {options.map((o) => (
          <Chip
            key={o.label}
            size={size}
            sub={o.sub}
            selected={value !== undefined && equals(value, o.value)}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}

export function YesNo({
  label,
  value,
  onChange,
  yes = "예",
  no = "아니요",
}: {
  label: string;
  value: boolean | undefined;
  onChange: (v: boolean) => void;
  yes?: string;
  no?: string;
}) {
  return (
    <ChipGroup
      label={label}
      size="compact"
      options={[
        { label: yes, value: true },
        { label: no, value: false },
      ]}
      value={value}
      onChange={onChange}
    />
  );
}

export const bandEq = (a: { min: number; max: number | null }, b: { min: number; max: number | null }) =>
  a.min === b.min && a.max === b.max;
