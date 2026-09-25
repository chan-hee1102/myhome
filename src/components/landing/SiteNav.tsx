"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";

const LINKS = [
  { href: "/guide", label: "청약 가이드" },
  { href: "/guide/gajeom", label: "가점 계산기" },
  { href: "/#how", label: "판정 방식" },
];

/**
 * 상단 내비. 로고 왼쪽 끝을 본문 기준선(.wrap)에 맞추고, 유리 상자만 양옆으로 12~16px 더 나간다.
 */
export function SiteNav({ cta = true }: { cta?: boolean }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      className="fixed inset-x-0 top-0 z-50 pt-3 md:pt-4"
    >
      <div className="wrap">
        <nav
          aria-label="주 메뉴"
          className={`relative -mx-3 flex h-14 items-center justify-between rounded-[16px] px-3 transition-[background-color,box-shadow] duration-500 md:-mx-4 md:h-16 md:px-4 ${
            scrolled ? "glass ring-1 ring-inset ring-line" : ""
          }`}
        >
          <Logo />
          <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex h-9 items-center rounded-[10px] px-3.5 text-[14px] font-medium text-mist transition-colors duration-200 hover:bg-white/8 hover:text-pure"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-1">
            <Link
              href="/guide"
              className="inline-flex h-9 items-center rounded-[10px] px-3 text-[14px] font-medium text-mist hover:bg-white/8 hover:text-pure lg:hidden"
            >
              가이드
            </Link>
            {cta && (
              <ButtonLink href="/check" size="md" arrow>
                내 조건 넣기
              </ButtonLink>
            )}
          </div>
        </nav>
      </div>
    </motion.header>
  );
}
