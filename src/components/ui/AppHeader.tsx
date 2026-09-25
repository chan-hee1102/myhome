import Link from "next/link";
import { ButtonLink } from "./Button";
import { Logo } from "./Logo";

/** 결과·상세 화면 상단. 본문과 같은 컨테이너(.wrap-app). 모바일에서도 가이드 링크를 보인다 */
export function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-line bg-page">
      <div className="wrap-app flex h-16 items-center justify-between gap-3">
        <Logo />
        <div className="flex items-center gap-0.5">
          <Link href="/guide" className="inline-flex h-9 items-center rounded-[10px] px-2.5 text-[15px] font-medium text-sub hover:bg-well hover:text-ink">
            가이드
          </Link>
          <Link href="/results" className="inline-flex h-9 items-center rounded-[10px] px-2.5 text-[15px] font-medium text-sub hover:bg-well hover:text-ink">
            결과
          </Link>
          <ButtonLink href="/check?edit=1" variant="outline" size="sm">
            조건 수정
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
