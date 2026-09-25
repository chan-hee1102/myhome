"use client";

import Link from "next/link";
import { topicFor } from "@/components/results/verdict";
import { depositGapText, howTo, residenceNote, scheduleNote, weekendNote } from "@/lib/howto";
import { useProfile } from "@/lib/profile";
import type { GroupResult, NoticeResult } from "@/lib/rules/evaluate";

/**
 * 「지금 할 일」 — 결과를 본 다음 무엇을 하면 되는지 순서대로.
 *   1) 모르는 조건이 있으면 그것부터 알려주기
 *   2) 1순위가 예치금 때문에 막히면 얼마 더 넣으면 되는지
 *   3) 언제·어디서 신청하는지 — 접수처와 방법
 *   4) 챙길 것
 */
export function NextSteps({ r, g }: { r: NoticeResult; g: GroupResult }) {
  const { profile } = useProfile();
  const how = howTo(r.a);
  const unknown = [...g.checks, ...g.rankChecks].filter((c) => c.tri === "unknown");
  const topic = unknown.length ? topicFor(unknown.flatMap((c) => c.ask ?? [])) : undefined;
  const gap = g.rankChecks.some((c) => c.key === "deposit" && c.tri === "fail") ? depositGapText(r.a, profile) : undefined;
  const warn = [residenceNote(r.a, profile), weekendNote(r.a)].filter(Boolean) as string[];
  const order = scheduleNote(r.a);
  const steps: { title: string; body: React.ReactNode }[] = [];

  if (r.phase === "closed") {
    steps.push({ title: "접수가 끝났어요", body: "비슷한 공고가 다시 올라오면 결과 목록에서 볼 수 있어요." });
  } else {
    if (unknown.length && topic) {
      steps.push({
        title: `모르는 조건 ${unknown.length}개부터 알려주세요`,
        body: (
          <>
            {unknown.map((c) => c.label).join(", ")} 값을 넣으면 신청할 수 있는지가 정해져요.{" "}
            <Link href={`/check?topic=${topic}`} className="font-semibold text-ink underline decoration-line-strong underline-offset-4">
              알려주기
            </Link>
          </>
        ),
      });
    }
    if (gap) {
      steps.push({
        title: `이번엔 2순위로 신청할 수 있어요`,
        body: `예치금은 입주자 모집공고일 기준으로 따져서, 공고가 난 뒤에 넣은 돈은 이번 공고에 인정되지 않아요. 다음 공고에서 1순위가 되려면 ${gap} 넣어 두세요.`,
      });
    }
    steps.push({
      title: r.phase === "upcoming" ? `${r.daysToStart}일 뒤 ${how.where}에서 접수가 시작돼요` : r.daysLeft === 0 ? `오늘 ${how.where} 접수가 마감돼요` : `${r.daysLeft}일 안에 ${how.where}에서 신청하세요`,
      body: (
        <>
          {how.method} {order}
          {warn.map((w) => (
            <span key={w} className="mt-1.5 block font-semibold text-hot-ink">
              {w}
            </span>
          ))}
          {how.url && (
            <a
              href={how.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex h-10 w-fit items-center rounded-[10px] px-3.5 text-[14px] font-semibold text-ink ring-1 ring-inset ring-line-strong hover:ring-ink"
            >
              {how.where} 열기 ↗
            </a>
          )}
        </>
      ),
    });
    steps.push({
      title: "챙길 것",
      body: (
        <>
          {how.bring.join(" · ")}. {how.certHelp && <span className="block">{how.certHelp}</span>}
          <span className="text-muted">{how.caveat}</span>
        </>
      ),
    });
  }

  return (
    <section className="mt-12 md:mt-14" aria-labelledby="next-title">
      <div className="section-head">
        <span id="next-title">지금 할 일</span>
      </div>
      <ol className="mt-3 rounded-[4px] bg-page px-5 ring-1 ring-inset ring-line md:px-7">
        {steps.map((s, i) => (
          <li key={s.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 border-b border-line py-4 last:border-b-0">
            <span className="num text-[20px] leading-6 text-brand">{i + 1}</span>
            <div>
              <p className="text-[16px] font-semibold text-ink">{s.title}</p>
              <p className="t-small mt-1 text-sub">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
