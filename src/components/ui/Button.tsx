import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * 버튼 규격 — 높이·패딩은 size로만 정한다(className으로 덮지 않는다). 반경 10.
 *   sm 36 · md 44 · lg 56
 *   primary  군청(화면마다 하나) · outline 흰 바탕+잉크 테두리 · ghost 글자만 · link 밑줄 글자
 * 화살표는 입력 흐름의 「다음」과 목적지가 분명한 이동에만 붙인다.
 */
export type Variant = "primary" | "outline" | "ghost" | "link" | "inverse";
export type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex shrink-0 items-center justify-center font-semibold whitespace-nowrap select-none transition-[background-color,color,box-shadow,transform] duration-150 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:pointer-events-none aria-disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-brand-hover active:bg-brand-press disabled:bg-well disabled:text-faint",
  outline: "bg-page text-ink ring-1 ring-inset ring-line-strong hover:ring-ink active:bg-wash disabled:text-faint",
  ghost: "text-sub hover:bg-well hover:text-ink active:bg-line disabled:text-faint",
  link: "text-ink underline decoration-line-strong underline-offset-[5px] hover:decoration-ink",
  inverse: "bg-white text-brand hover:bg-brand-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-9 gap-1.5 rounded-[10px] px-3.5 text-[15px]",
  md: "h-11 gap-2 rounded-[10px] px-5 text-[16px]",
  lg: "h-14 gap-2 rounded-[10px] px-7 text-[17px]",
};

const iconSizes: Record<Size, string> = {
  sm: "size-9 rounded-[10px]",
  md: "size-11 rounded-[10px]",
  lg: "size-14 rounded-[10px]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", opts: { icon?: boolean; block?: boolean } = {}) {
  // 밑줄 링크는 높이·패딩 없이 글자 크기만
  const box = variant === "link" ? (size === "sm" ? "gap-1 text-[15px]" : "gap-1.5 text-[16px]") : opts.icon ? iconSizes[size] : sizes[size];
  return [base, variants[variant], box, opts.block ? "w-full" : ""].join(" ");
}

export function Arrow({ size = "md" }: { size?: Size }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className={`${size === "lg" ? "size-[18px]" : "size-4"} transition-transform duration-200 ease-out group-hover/btn:translate-x-0.5`}
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
  variant = "outline",
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
