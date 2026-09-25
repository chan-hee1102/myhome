"use client";

import Link from "next/link";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";

const LINKS = [
  { href: "/guide", label: "청약 가이드" },
  { href: "/guide/gajeom", label: "가점 계산기" },
  { href: "/#faq", label: "자주 묻는 질문" },
];

/** 상단 내비. 흰 바탕에 붙어 있다가 스크롤하면 아래 선이 생긴다 */
export function SiteNav({ cta = true }: { cta?: boolean }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 8));

  return (
    <header
      className={`glass fixed inset-x-0 top-0 z-50 transition-shadow duration-300 ${scrolled ? "shadow-[0_1px_0_var(--color-line)]" : ""}`}
    >
      <nav aria-label="주 메뉴" className="wrap relative flex h-16 items-center justify-between">
        <Logo />
        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="inline-flex h-9 items-center rounded-[10px] px-3.5 text-[15px] font-medium text-sub transition-colors duration-200 hover:bg-well hover:text-ink"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-1">
          <Link
            href="/guide"
            className="inline-flex h-9 items-center rounded-[10px] px-3 text-[15px] font-medium text-sub hover:bg-well hover:text-ink lg:hidden"
          >
            가이드
          </Link>
          {cta && (
            <ButtonLink href="/check" size="sm">
              내 조건 넣기
            </ButtonLink>
          )}
        </div>
      </nav>
    </header>
  );
}
