import { ButtonLink } from "./Button";
import { Logo } from "./Logo";

/** 결과·상세 화면 상단. 본문과 같은 컨테이너(.wrap-app)라 카드 가장자리와 맞는다 */
export function AppHeader() {
  return (
    <header className="glass fixed inset-x-0 top-0 z-40 shadow-[0_1px_0_var(--color-line)]">
      <div className="wrap-app flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-1">
          <span className="hidden sm:contents">
            <ButtonLink href="/guide" variant="ghost" size="sm">
              청약 가이드
            </ButtonLink>
          </span>
          <ButtonLink href="/results" variant="ghost" size="sm">
            결과
          </ButtonLink>
          <ButtonLink href="/check" variant="soft" size="sm">
            조건 수정
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
