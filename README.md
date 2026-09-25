# 청약핏

생년·사는 곳·가족·집·소득 다섯 가지만 답하면, 흩어진 청약·공공임대 공고 중 **지금 신청할 수 있는 것**과 **예상 순위·가점**을 보여주는 웹서비스. 2026년 청약·공공임대 자격 기준표(가이드 19장)도 함께 제공한다.

> 공고는 아직 **예시 데이터**다(`src/lib/site.ts`의 `sampleData: true`). 판정 기준·가이드는 2026년 법령·지침 값이다.
> 공고 수집·판정·검색 노출 설계는 [docs/DESIGN.md](docs/DESIGN.md).

```bash
npm install
npm run dev -- -p 3000   # http://localhost:3000
npm run build
```

## 화면

| 경로 | 내용 |
|---|---|
| `/` | 랜딩 — 구름 하늘 히어로, 스크롤 연출, 대상별 타일, 가점 계산기, 2026 기준표 링크 |
| `/check` | 조건 입력 — 한 화면 한 질문, 답할 때마다 「신청 가능 N건」 갱신 |
| `/results` | 판정 목록 — 신청 가능/확인 필요/해당 없음/마감, 「이것만 알려주시면」 추천 |
| `/notice/[id]` | 공고 상세 — 공급 대상별 판정, 조건 대조표, 1순위 요건, 가점·배점, 일정 |
| `/guide` · `/guide/[slug]` | 2026 자격 기준 가이드 19장(기준표 5 · 주택 유형 10 · 특별공급 4) |
| `/privacy` | 개인정보 처리 안내 |
| `/robots.txt` `/sitemap.xml` `/llms.txt` `/llms-full.txt` `/guide/rss.xml` | 검색·AI 노출용 |

## 구조

```
src/
  app/                 라우트 + robots·sitemap·manifest·llms·rss·opengraph-image
  components/
    landing/ check/ results/ detail/ guide/   화면별
    ui/                Button(sm/md/lg × primary/secondary/soft/outline/ghost/inverse) · Badge(StatusBadge/Tag/CountPill) · MarkDot · Logo · AppHeader
    motion/ seo/       모션 부품 · JsonLd
  lib/
    rules/             판정 엔진 — core(세 값)·checks·templates·evaluate·gajeom·standards(기준표)·criteria(소득 규칙 한 벌)
    guides/            가이드 콘텐츠(기준표·유형·특별공급) — 숫자는 rules에서 계산
    jsonld.ts seo.ts og.tsx text.tsx(줄바꿈 br/soft) site.ts
  assets/fonts/        공유 카드용 Pretendard 한글 서브셋
```

## 디자인 규격

- 톤: **밝고 쉬운 화면**(2026-09-25 전환 — 검은 배경·세리프가 「어둡고 어렵다」는 피드백). 흰 바탕(`page`)·연회색 구역(`wash`), 포인트 색은 파랑(`brand`) 하나. 상태 색은 판정에만: 신청 가능 `ok`(초록)·확인 필요 `maybe`(주황)·해당 없음 `no`(회색)·마감 임박 `hot`(빨강) — 각각 `-ink`(글자)·`-soft`(바탕) 한 벌.
- 글자색: `ink`(제목) · `body`(본문) · `sub`(보조) · `muted`(캡션, 흰 바탕 4.6:1). `faint`·`ghost`는 글자에 쓰지 않는다(비활성·점·선).
- 글꼴: **Pretendard** 한 벌. 제목 700, 글자 크기는 `t-display-xl/l/m/s · t-title · t-body-l · t-body · t-small · t-caption · eyebrow` 토큰만 쓴다.
- 카드: 흰 바탕 + `shadow-card`(떠오를 때 `shadow-lift`). 조건 표시는 `MarkDot`(초록 ✓ · 주황 ? · 회색 ✕).
- 컨테이너: `.wrap`(1200) · `.wrap-app`(1040) · `.wrap-form`(720). 간격 4px 단위, 반경 8·12·14·20·24·28.
- 말투: 쉬운 말. 화면 글자에 「판정」 대신 「결과·확인」을 쓴다(메타 제목의 검색어는 예외).
- 줄바꿈: `br("말 쉬는 | 자리")` — 「|」에서만 꺾인다. 「|」 없는 긴 문장은 `br()`/`soft()`가 기호·날짜·단위에서만 붙인다.
- 모션: `motion`. 시스템 「동작 줄이기」 설정을 따른다.
