"use client";

import Link from "next/link";
import { dayText, topicFor } from "@/components/results/verdict";
import { depositGapText, howTo, residenceNote, scheduleNote, weekendNote } from "@/lib/howto";
import { withJosa } from "@/lib/josa";
import { useProfile } from "@/lib/profile";
import { soft } from "@/lib/text";
import type { GroupResult, NoticeResult } from "@/lib/rules/evaluate";

/**
 * 「지금 할 일」 — 결과를 본 다음 무엇을 하면 되는지 순서대로.
 *   1) 모르는 조건이 있으면 그것부터 알려주기
 *   2) 1순위가 예치금 때문에 막히면 얼마 더 넣으면 되는지
 *   3) 언제·어디서 신청하는지 — 접수처와 방법
 *   4) 챙길 것
 * 해당 없음이면 1~4 대신 막힌 이유와 다른 길(다른 대상·다른 공고)만 보여 준다.
 */
export function NextSteps({ r, g }: { r: NoticeResult; g: GroupResult }) {
  const { profile } = useProfile();
  const how = howTo(r.a);
  const unknown = [...g.checks, ...g.rankChecks].filter((c) => c.tri === "unknown");
  const topic = unknown.length ? topicFor(unknown.flatMap((c) => c.ask ?? [])) : undefined;
  const gap = g.rankChecks.some((c) => c.key === "deposit" && c.tri === "fail") ? depositGapText(r.a, profile) : undefined;
  const residence = residenceNote(r.a, profile);
  const warn = [weekendNote(r.a), r.phase === "open" && r.daysLeft === 0 ? "오늘이 마지막 날이에요. 마감 시각은 접수처마다 달라서 공고문에서 꼭 확인하세요." : undefined].filter(
    Boolean,
  ) as string[];
  const order = scheduleNote(r.a);
  const steps: { title: string; body: React.ReactNode }[] = [];

  if (r.phase === "closed") {
    steps.push({ title: "접수가 끝났어요", body: "비슷한 공고가 다시 올라오면 결과 목록에서 볼 수 있어요." });
  } else if (g.verdict === "no") {
    // 해당 없음: 모르는 조건을 채워도 결과가 바뀌지 않는다 — 막힌 이유와 다른 길만 알려 준다
    const fail = [...g.checks, ...g.rankChecks].find((c) => c.tri === "fail");
    const others = r.groups.filter((x) => x.group.id !== g.group.id && x.verdict !== "no");
    steps.push({
      title: "이 대상으로는 신청할 수 없어요",
      body: fail ? (
        <>
          {fail.label} 조건에 맞지 않아요.
          <span className="block">필요: {soft(fail.need)}</span>
          {fail.hint && <span className="block">{soft(fail.hint)}</span>}
        </>
      ) : (
        "자격 조건에 맞지 않아요."
      ),
    });
    steps.push(
      others.length
        ? { title: "다른 대상은 가능성이 있어요", body: `위에서 ${withJosa(others.map((x) => x.group.label).join(", "), "을/를")} 눌러 확인해 보세요.` }
        : {
            title: "다른 공고를 찾아보세요",
            body: (
              <Link href="/results" className="font-semibold text-ink underline decoration-line-strong underline-offset-4">
                신청할 수 있는 공고 보기
              </Link>
            ),
          },
    );
  } else {
    if (unknown.length && topic) {
      steps.push({
        title: `${unknown.length}가지만 더 답해 주세요`,
        body: (
          <>
            {withJosa(unknown.map((c) => c.label).join(", "), "을/를")} 답하면 결과가 정해져요.{" "}
            <Link href={`/check?topic=${topic}`} className="font-semibold text-ink underline decoration-line-strong underline-offset-4">
              답하기
            </Link>
          </>
        ),
      });
    }
    if (residence) {
      // 공고 지역 밖에 살면 접수 안내보다 먼저 — 「N일 안에 신청하세요」가 모순처럼 읽히지 않게
      steps.push({ title: "신청 자격 지역부터 확인하세요", body: soft(residence) });
    }
    if (gap) {
      steps.push({
        title: `이번엔 2순위로 신청할 수 있어요`,
        body: `공고일 뒤에 넣은 돈은 이번 공고에 인정되지 않아요. 다음 공고에서 1순위가 되려면 ${gap} 넣어 두세요.`,
      });
    }
    steps.push({
      title:
        r.phase === "upcoming"
          ? `${dayText(r).big} ${how.where}에서 접수가 시작돼요`
          : r.daysLeft === 0
            ? `오늘 ${how.where} 접수가 마감돼요`
            : `${residence ? "자격이 되면 " : ""}${r.daysLeft === 1 ? "내일까지" : `${r.daysLeft}일 안에`} ${how.where}에서 신청하세요`,
      body: (
        <>
          {soft(how.method)}
          {order && <span className="block">{soft(order)}</span>}
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
              className="mt-3 flex h-10 w-fit items-center rounded-[10px] px-3.5 text-[15px] font-semibold text-ink ring-1 ring-inset ring-line-strong hover:ring-ink"
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
          {how.bring.map((b) => (
            <span key={b} className="block">
              {soft(b)}
            </span>
          ))}
          {how.certHelp && <span className="block">{soft(how.certHelp)}</span>}
          <span className="mt-1 block text-muted">{soft(how.caveat)}</span>
        </>
      ),
    });
  }

  return (
    <section className="mt-12 md:mt-14" aria-labelledby="next-title">
      <div className="section-head">
        <span id="next-title">지금 할 일</span>
      </div>
      <ol className="mt-3 card px-5 md:px-7">
        {steps.map((s, i) => (
          <li key={s.title} className="grid grid-cols-[28px_minmax(0,1fr)] gap-x-3 border-b border-line py-4 last:border-b-0">
            <span className="num text-[20px] leading-6 text-ink">{i + 1}</span>
            <div>
              <p className="text-[16px] font-semibold text-ink">{s.title}</p>
              <p className="t-small mt-1 text-body">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
