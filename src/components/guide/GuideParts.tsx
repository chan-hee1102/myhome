import Link from "next/link";
import type { ReactNode } from "react";
import type { Block, Guide, GuideTable } from "@/lib/guides";
import { GUIDES } from "@/lib/guides";
import { ButtonLink } from "@/components/ui/Button";
import { GajeomCalc } from "./GajeomCalc";

/** 빵부스러기 — 화면에 보이는 것과 BreadcrumbList JSON-LD가 같은 경로 */
export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="현재 위치" className="t-small text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={it.name} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {it.href ? (
              <Link href={it.href} className="hover:text-ink hover:underline">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-sub">
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** 본문 안의 「소득 기준표(/guide/income)」 같은 경로 글자를 링크로 바꾼다 */
function linkify(text: string): ReactNode {
  const parts = text.split(/\((\/guide\/[a-z0-9-]+)\)/);
  if (parts.length === 1) return text;
  const out: ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      out.push(parts[i]);
      continue;
    }
    const path = parts[i];
    const g = GUIDES.find((x) => `/guide/${x.slug}` === path);
    const name = g?.short ?? "관련 가이드";
    const prev = out[out.length - 1];
    if (typeof prev === "string" && g && prev.endsWith(g.short)) {
      out[out.length - 1] = prev.slice(0, -g.short.length);
    }
    out.push(
      <Link key={i} href={path} className="whitespace-nowrap font-medium text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">
        {name}
      </Link>,
    );
  }
  return out;
}

export function TableView({ table }: { table: GuideTable }) {
  const wide = table.head.length > 3;
  return (
    <figure className="my-6">
      <p aria-hidden className="text-[16px] font-bold text-ink">
        {table.caption}
      </p>
      {wide && (
        <p className={`mt-0.5 text-[14px] font-medium text-muted md:text-[15px] ${table.head.length > 5 ? "" : "md:hidden"}`}>옆으로 밀면 나머지 칸이 보여요 →</p>
      )}
      <div className="mt-2.5 overflow-x-auto rounded-[12px] border border-line" tabIndex={0} aria-label={table.caption}>
        <table id={table.id} className={`guide-table ${table.wrap ? "wrap-cells" : ""}`}>
          <caption className="sr-only">{table.caption}</caption>
          <thead>
            <tr>
              {table.head.map((h) => (
                <th key={h} scope="col">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i}>
                <th scope="row">{r[0]}</th>
                {r.slice(1).map((c, j) => (
                  <td key={j}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.note && <figcaption className="t-small mt-3 border-t border-line pt-3 text-muted">{linkify(table.note)}</figcaption>}
    </figure>
  );
}

export function BlockView({ b }: { b: Block }) {
  switch (b.t) {
    case "p":
      return <p className="t-body-l mt-4 max-w-[38em] text-body">{linkify(b.text)}</p>;
    case "note":
      return <p className="t-small mt-4 max-w-[40em] text-sub">{linkify(b.text)}</p>;
    case "ul":
      return (
        <ul className="mt-4 max-w-[40em] space-y-2">
          {b.items.map((it) => (
            <li key={it} className="t-body-l flex gap-3 text-body">
              <span aria-hidden className="mt-[0.8em] h-px w-2.5 shrink-0 bg-ink" />
              <span>{linkify(it)}</span>
            </li>
          ))}
        </ul>
      );
    case "table":
      return <TableView table={b.table} />;
    case "calc":
      return (
        <div className="mt-6">
          <GajeomCalc />
        </div>
      );
  }
}

/** 네이티브 details — JS 없이도 답이 HTML에 있다(AEO). 괘선 아코디언 */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="border-t border-line-strong">
      {items.map((f) => (
        <details key={f.q} name="faq" className="group border-b border-line">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 [&::-webkit-details-marker]:hidden">
            <h3 className="t-h3">{f.q}</h3>
            <span aria-hidden className="relative size-3.5 shrink-0">
              <span className="absolute left-0 top-1/2 h-[1.5px] w-3.5 -translate-y-1/2 bg-ink" />
              <span className="absolute left-0 top-1/2 h-[1.5px] w-3.5 -translate-y-1/2 rotate-90 bg-ink transition-transform duration-300 group-open:rotate-0" />
            </span>
          </summary>
          <p className="t-body max-w-[40em] pb-6 text-body">{linkify(f.a)}</p>
        </details>
      ))}
    </div>
  );
}

/** 함께 보면 좋은 기준 — 카드 대신 괘선 행 */
export function RelatedGuides({ slugs }: { slugs: string[] }) {
  const list = slugs.map((s) => GUIDES.find((g) => g.slug === s)).filter(Boolean) as Guide[];
  return (
    <ul className="border-t border-line-strong">
      {list.map((g) => (
        <li key={g.slug} className="border-b border-line">
          <Link href={`/guide/${g.slug}`} className="group grid gap-1 py-4 md:grid-cols-[12em_minmax(0,1fr)_auto] md:items-baseline md:gap-6">
            <span className="text-[16px] font-semibold text-ink group-hover:underline">{g.short}</span>
            <span className="t-small text-sub">{g.facts.join(" · ")}</span>
            <span className="hidden text-[14px] md:text-[15px] text-muted md:block">{g.category}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CheckCta({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`card ${compact ? "p-5" : "p-6"}`}>
      <p className="t-h3">내 자격 바로 확인</p>
      <p className="t-small mt-1.5 text-sub">질문 6개에 답하면 공고별 신청 가능 여부와 예상 순위를 보여 드려요.</p>
      <div className="mt-4">
        <ButtonLink href="/check" arrow block={compact}>
          자격 확인하기
        </ButtonLink>
      </div>
    </div>
  );
}
