import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { SITE } from "./site";

/**
 * 공유 카드(1200×630). Satori 기본 서체에는 한글이 없어서, KS X 1001 한글 2,350자로 줄인
 * Pretendard(src/assets/fonts, 약 400KB)를 읽어 쓴다. 빌드 때 정적으로 만든다.
 */
export const OG_SIZE = { width: 1200, height: 630 };

async function fonts() {
  const dir = join(process.cwd(), "src/assets/fonts");
  const [regular, bold] = await Promise.all([
    readFile(join(dir, "Pretendard-Regular.subset.ttf")),
    readFile(join(dir, "Pretendard-Bold.subset.ttf")),
  ]);
  return [
    { name: "Pretendard", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Pretendard", data: bold, weight: 700 as const, style: "normal" as const },
  ];
}

export async function renderOg({ eyebrow, title, facts, footer }: { eyebrow: string; title: string; facts: string[]; footer: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "radial-gradient(60% 70% at 88% 18%, #d6e6fd 0%, rgba(255,255,255,0) 70%), linear-gradient(180deg, #ffffff 0%, #f1f6fe 100%)",
          color: "#191f28",
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", width: 52, height: 52, borderRadius: 14, background: "#1b64da", alignItems: "center", justifyContent: "center" }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
              <path d="M5 21V10.5a7 7 0 0 1 14 0V21" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M9.5 21v-5.2a2.5 2.5 0 0 1 5 0V21" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1 }}>{SITE.name}</span>
          <span style={{ marginLeft: 12, fontSize: 24, color: "#1b64da", fontWeight: 700 }}>{eyebrow}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.2, letterSpacing: -2, maxWidth: 1040, display: "flex", wordBreak: "keep-all" }}>{title}</div>
          <div style={{ display: "flex", gap: 12 }}>
            {facts.map((f) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  padding: "10px 22px",
                  borderRadius: 999,
                  background: "#eaf2fe",
                  color: "#1550b0",
                  fontWeight: 700,
                  fontSize: 26,
                }}
              >
                {f}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, color: "#6b7684" }}>
          <span>{footer}</span>
          <span>{SITE.url.replace(/^https?:\/\//, "")}</span>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
