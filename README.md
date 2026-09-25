# 청약핏

나이·사는 곳·가족·집·소득·재산 여섯 가지만 답하면, 흩어진 청약·공공임대 공고 중 **지금 신청할 수 있는 것**과 **예상 순위·가점**을 보여주는 웹서비스. 2026년 청약·공공임대 자격 기준표(가이드 19장)도 함께 제공한다.

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
    ui/                Button · Badge(StatusBadge=창 글리프) · Window(Pane=창 부품 하나·WinGlyph·WinLegend) · Logo · AppHeader
    motion/ seo/       모션 부품 · JsonLd
  lib/
    rules/             판정 엔진 — core(세 값)·checks·templates·evaluate·gajeom·standards(기준표)·criteria(소득 규칙 한 벌)
    guides/            가이드 콘텐츠(기준표·유형·특별공급) — 숫자는 rules에서 계산
    jsonld.ts seo.ts og.tsx text.tsx(줄바꿈 br/soft) site.ts
  assets/fonts/        공유 카드용 Pretendard 한글 서브셋
```

## 디자인 규격 — 「불 켜진 창」

2026-09-25에 두 번 바뀌었다: 검은 배경·세리프(「어둡고 어렵다」) → 흰 바탕·토스풍(「AI 티가 난다」) → 지금. 전문가 3명·사용자 4명 테스트로 정했다.

- **모티프는 창 하나.** 아파트 입면의 창 1칸 = 공고 1건(가점은 1점). 꽉 찬 창 = 신청 가능(군청) · 아래 절반 = 확인 필요(주황) · 선만 = 해당 없음 · 회색 면 = 마감. 색이 아니라 채움으로도 읽힌다. **데이터 없는 창은 그리지 않는다.**
  창은 **부품 하나(`Pane`, `components/ui/Window.tsx`)로만 그린다** — 입면(`Facade`)·조건 표시(`WinMark`)·뱃지·범례·하단 띠·탭 표시·공유 카드가 모두 같은 규격: 비율 5:7, 가운데(50%) 창살 하나(틀 안쪽에만), 꺼질 때도 마지막 색 유지. 3차 감사에서 창을 다섯 가지로 따로 그려 생긴 불일치(창살이 틀을 끊음·반 칸 선 두 줄·꺼질 때 파란 번쩍임·체크박스처럼 보임)를 이렇게 없앴다.
- **군청은 「신청 가능」에만.** 0은 `muted`, 확인 필요 상태의 순위는 `maybe-ink`, 접수 전 기간은 테두리만. D-day 문구는 `results/verdict.tsx dday()` 하나에서만 만든다(「3일 뒤 / 접수 시작」·「D-6 / 마감」).
- **문법은 「공고문 서식」.** 카드 그림자 대신 1px 괘선, 섹션 머리글은 위 잉크 괘선 + 회색 글자(`.section-head`). 왼쪽 정렬 12열, 가운데 정렬 제목·색 eyebrow·파스텔 타일·그라디언트·폰 목업은 쓰지 않는다.
- **색:** 흰 82 · 잉크 12 · 군청(`brand` #2447D6) 5 · 상태색 1. 회색은 토스 값에서 벗어난 자체 값(`ink/body/sub/muted`). `faint`·`ghost`는 글자에 쓰지 않는다.
- **글꼴:** Pretendard 한 벌. 페이지에서 가장 큰 것은 숫자(`t-num-xl`). 글자 크기는 `t-num-xl · t-h1 · t-h2 · t-h3 · t-body-l · t-body · t-small · t-caption`만.
- **반경 4·10·16, 그림자는 하단 고정 바 하나.** 버튼 `primary`(화면마다 하나) · `outline` · `ghost` · `link`(밑줄) · `inverse`, 높이는 size로만.
- **모션**(`components/motion/tokens.ts`): 지속시간 0.16/0.32/0.64, 이징 out·move·exit, 스프링 ui·land. 헤드라인·핵심 숫자는 SSR부터 보이고 등장 모션은 그래픽에만. transform·opacity·pathLength만, 무한 반복 없음, 스크롤 모션은 `useReducedMotion` 정적판. 시그니처: 히어로 입면 데모(예시 조건이 더해질 때마다 실제 엔진 결과로 창이 켜짐) · 접수 일정 띠의 「오늘」 선 · 공고문 형광펜 → 조건표 체크 · 대상×유형 표 · 가점 84칸 눈금 · 오도미터 숫자 · 입력 화면 실시간 창과 +N · 완료 화면 창 켜짐 · 상세 조건 줄 맞춰 보기·공급 점묘.
- **말투:** 쉬운 해요체. 화면 글자에 「판정」 대신 「결과·확인」. 조사는 `lib/josa.ts`로 붙인다(「이(가)」 금지). 지역명은 `lib/place.ts placeText`.
- 줄바꿈: `br("말 쉬는 | 자리")` — 「|」에서만 꺾인다. 한 덩어리가 360px에서 넘치지 않게.
