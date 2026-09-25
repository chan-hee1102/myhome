import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * 버튼 규격 — 높이·패딩은 size로만 정한다(className으로 덮지 않는다).
 *   sm 36 · md 44 · lg 56, 글자 600, 반경 10/12/14
 *   primary 파랑(화면마다 하나) · secondary 회색 · soft 연한 파랑 · outline 흰 바탕+테두리 · ghost 글자만
 *   inverse 파란 바탕 위에 올리는 흰 버튼
 */
export type Variant = "primary" | "secondary" | "soft" | "outline" | "ghost" | "inverse";
export type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap select-none transition-[background-color,color,box-shadow,transform] duration-200 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none aria-disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover active:bg-brand-press disabled:bg-well disabled:text-faint",
  secondary: "bg-well text-body hover:bg-[#e8ebee] active:bg-line disabled:text-faint",
  soft: "bg-brand-soft text-brand-ink hover:bg-brand-soft-hover active:bg-[#cfe0fc] disabled:text-faint",
  outline: "bg-page text-ink ring-1 ring-inset ring-line-strong hover:bg-wash active:bg-well disabled:text-faint",
  ghost: "text-sub hover:bg-well hover:text-ink active:bg-line disabled:text-faint",
  inverse: "bg-white text-brand hover:bg-brand-soft active:bg-brand-soft-hover focus-visible:outline-white",
};

const sizes: Record<Size, string> = {
  sm: "h-9 gap-1.5 rounded-[10px] px-3.5 text-[14px]",
  md: "h-11 gap-2 rounded-[12px] px-5 text-[15px]",
  lg: "h-14 gap-2 rounded-[14px] px-7 text-[17px]",
};

const iconSizes: Record<Size, string> = {
  sm: "size-9 rounded-[10px]",
  md: "size-11 rounded-[12px]",
  lg: "size-14 rounded-[14px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", opts: { icon?: boolean; block?: boolean } = {}) {
  return [base, variants[variant], opts.icon ? iconSizes[size] : sizes[size], opts.block ? "w-full" : ""].join(" ");
}

export function Arrow({ size = "md" }: { size?: Size }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`${size === "lg" ? "size-[18px]" : "size-4"} transition-transform duration-300 ease-out group-hover/btn:translate-x-0.5`}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M3 8h9.5M8.5 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function BackArrow() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M13 8H3.5M7.5 4l-4 4 4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type Common = { variant?: Variant; size?: Size; arrow?: boolean; block?: boolean; className?: string };

export function ButtonLink({
  variant = "primary",
  size = "md",
  arrow = false,
  block = false,
  className = "",
  children,
  ...rest
}: Omit<ComponentProps<typeof Link>, "className"> & Common) {
  return (
    <Link className={`${buttonClass(variant, size, { block })} ${className}`} {...rest}>
      {children}
      {arrow && <Arrow size={size} />}
    </Link>
  );
}

export function Button({
  variant = "primary",
  size = "md",
  arrow = false,
  block = false,
  className = "",
  children,
  ...rest
}: Omit<ComponentProps<"button">, "className"> & Common) {
  return (
    <button type="button" className={`${buttonClass(variant, size, { block })} ${className}`} {...rest}>
      {children}
      {arrow && <Arrow size={size} />}
    </button>
  );
}

/** 아이콘만 있는 정사각 버튼. aria-label 필수 */
export function IconButton({
  variant = "secondary",
  size = "md",
  children,
  ...rest
}: Omit<ComponentProps<"button">, "className"> & { variant?: Variant; size?: Size; "aria-label": string }) {
  return (
    <button type="button" className={buttonClass(variant, size, { icon: true })} {...rest}>
      {children}
    </button>
  );
}
