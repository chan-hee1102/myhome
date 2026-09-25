"use client";

import Link from "next/link";
import { GajeomCalc } from "@/components/guide/GajeomCalc";

/** 가점 84칸 — 민영 아파트 일반공급 점수를 직접 맞춰 보는 구역 */
export function ScoreLab() {
  return (
    <section id="score" aria-labelledby="score-title" className="scroll-mt-20 border-t border-line bg-wash py-14 md:py-20">
      <div className="wrap">
        <div className="section-head">
          <span>가점 계산기</span>
          <span className="text-muted">민영 아파트 일반공급 · 84점 만점</span>
        </div>
        <div className="mt-6 grid gap-10 md:mt-8 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <h2 id="score-title" className="t-h2">
              84칸 중에
              <br />
              몇 칸이 켜질까요
            </h2>
            <p className="t-body mt-5 text-sub">1점이 1칸이에요. 무주택 기간 32칸, 부양가족 35칸, 통장 가입 기간 17칸을 합쳐 84칸이에요.</p>
            <dl className="mt-6 divide-y divide-line border-y border-line text-[15px]">
              {[
                ["무주택 기간", "1년 미만 2점, 1년마다 2점씩 더해 15년 이상 32점"],
                ["부양가족", "0명이어도 5점, 1명마다 5점씩 더해 6명 이상 35점"],
                ["통장 가입 기간", "6개월 미만 1점, 1년마다 1점씩 더해 15년 이상 17점"],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[7.5em_minmax(0,1fr)] gap-3 py-3">
                  <dt className="font-semibold text-ink">{k}</dt>
                  <dd className="text-sub">{v}</dd>
                </div>
              ))}
            </dl>
            <Link href="/guide/gajeom" className="t-small mt-6 inline-block font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
              가점 점수표 전체 보기
            </Link>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <GajeomCalc />
          </div>
        </div>
      </div>
    </section>
  );
}
