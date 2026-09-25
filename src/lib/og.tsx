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

/** 3×2 창 중 한 칸만 켜진 로고 */
function Mark({ size }: { size: number }) {
  const cells = [
    [3, 4],
    [9.5, 4],
    [16, 4],
    [3, 12.5],
    [9.5, 12.5],
    [16, 12.5],
  ];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <rect x="1" y="1.25" width="22" height="21.5" rx="2" fill="none" stroke="#14171c" strokeWidth="1.8" />
      {cells.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="5" height="6.5" rx="0.8" fill={i === 4 ? "#2447d6" : "none"} stroke={i === 4 ? "#2447d6" : "#14171c"} strokeWidth="1.4" />
      ))}
    </svg>
  );
}

/** 오른쪽 입면 — 창 12칸, 몇 칸은 켜짐(장식이 아니라 「공고 1건 = 창 1칸」 문법을 보여 준다) */
function Facade() {
  const states = ["ok", "no", "ok", "maybe", "no", "ok", "no", "maybe", "no", "no", "ok", "no"];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ width: 200, height: 14, borderTop: "3px solid #14171c", borderLeft: "3px solid #14171c", borderRight: "3px solid #14171c" }} />
      <div style={{ display: "flex", flexWrap: "wrap", width: 260, padding: "26px 28px 30px", gap: 22, border: "3px solid #14171c", background: "#fff" }}>
        {states.map((s, i) => {
          const frame = s === "ok" ? "#2447d6" : s === "maybe" ? "#e67700" : "#c9ced6";
          return (
            // 화면의 창 부품(Pane)과 같은 규격: 5:7, 가운데 창살 하나, 확인 필요는 아래 창만
            <div key={i} style={{ position: "relative", display: "flex", width: 46, height: 64, borderRadius: 3, border: `3px solid ${frame}`, background: "#fff", overflow: "hidden" }}>
              {s !== "no" && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: s === "ok" ? "100%" : "50%", background: frame }} />}
              <div style={{ position: "absolute", left: 0, right: 0, top: 28, height: 2, background: s === "ok" ? "rgba(255,255,255,0.7)" : frame }} />
            </div>
          );
        })}
      </div>
      <div style={{ width: 340, height: 3, background: "#14171c" }} />
    </div>
  );
}

export async function renderOg({ eyebrow, title, facts, footer }: { eyebrow: string; title: string; facts: string[]; footer: string }) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "60px 72px",
          background: "#ffffff",
          color: "#14171c",
          fontFamily: "Pretendard",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, paddingRight: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Mark size={44} />
            <span style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1.4 }}>{SITE.name}</span>
            <span style={{ marginLeft: 10, fontSize: 24, color: "#4b525c", fontWeight: 700 }}>{eyebrow}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
            <div style={{ fontSize: 62, fontWeight: 700, lineHeight: 1.2, letterSpacing: -2.2, display: "flex", wordBreak: "keep-all" }}>{title}</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {facts.map((f) => (
                <div key={f} style={{ display: "flex", padding: "8px 16px", borderRadius: 4, border: "2px solid #c9ced6", fontSize: 24, fontWeight: 700 }}>
                  {f}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 21, color: "#676e78", borderTop: "2px solid #14171c", paddingTop: 16 }}>
            <span>{footer}</span>
            <span>{SITE.url.replace(/^https?:\/\//, "")}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <Facade />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fonts() },
  );
}
