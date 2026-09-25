# 청약핏 설계 — 공고 수집·자격 판정·검색 노출

> 조사일 2026-09-23. 숫자와 법령은 이 날짜 기준이다. 해마다 바뀌는 값은 `src/lib/rules/standards.ts` 한 파일에만 둔다.
> 출처 약어(S#, A#)는 맨 아래 표에 있다.

## 1. 한 줄 정의와 원칙

**다섯 가지만 답하면 흩어진 청약·공공임대 공고 중 「지금 신청할 수 있는 것」과 「예상 순위·가점」을 보여준다.**

| 원칙 | 구현 |
|---|---|
| 스크래핑 금지 | 공식 API(공공데이터포털, 이용허락범위 제한 없음)만 쓴다. API가 없는 기관은 원문을 보고 **사실만** 옮기고 원문 링크를 건다 |
| 모르면 모른다고 | 판정은 세 값(`pass`/`fail`/`unknown`). 입력이 비었거나 구간이 기준선에 걸치면 「확인 필요」로 남긴다 |
| 개인정보 최소화 | 이름·주민번호를 묻지 않는다. 금액은 **구간**으로만 받고, 프로필은 **브라우저 localStorage에만** 저장한다(서버 전송 0) |
| 참고용 고지 | 모든 판정 화면에 「최종 자격은 공급기관 심사」 고지 |
| AI 라벨 금지 | 판정은 규칙 계산이다. 「AI 판정」이라고 부르지 않는다 |

## 2. 공고 수집

### 2-1. 출처 (A1~A6)

| 출처 | 엔드포인트 | 다루는 공고 | 일 한도(개발) | 비고 |
|---|---|---|---|---|
| 청약홈 분양정보 (한국부동산원, 15098547) | `api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/` `getAPTLttotPblancDetail` + `…Mdl`(주택형별) 외 4쌍 | 민영·국민 APT, 신혼희망타운, 오피스텔·민간임대, 무순위, 공공지원민간임대 | 40,000 | **규제지역 플래그·특공 세대수·순위별 접수일이 구조화돼 있다** → PDF 없이 판정 가능 |
| 마이홈 공공주택 모집공고 (국토부, 15108420) | `apis.data.go.kr/1613000/HWSPR02/rsdtRcritNtcList`(임대) · `ltRsdtRcritNtcList`(분양) | 행복·국민·영구·통합공공·매입·전세임대, 공공분양 (LH·SH·GH·지방공사) | **1,000 (가장 빡빡)** | 영리 이용 명시 허용. `rentGtn`·`mtRntchrg`는 **최솟값**. `beforePblancId`로 정정공고 연결 |
| LH 분양임대공고 3종 (15058530·15057999·15056765) | `apis.data.go.kr/B552555/lhLeaseNoticeInfo1/…` 목록 → 상세 → 공급정보 | LH 전 유형 | 각 10,000 | **공고문 PDF 링크를 공식으로 주는 유일한 API**(`dsAhflInfo.AHFL_URL`) |
| HUG 든든전세 (15143827) | `www.khug.or.kr/SelectListInfo.do?API_KEY=` | 든든전세 물건 | 명시 없음 | 접수 기간에만 데이터가 있고 마감되면 **삭제** → 원본 스냅샷 필수. 공고 ID 없음(공고일+접수시작으로 합성) |
| SH · GH · 서울 청년안심주택 | — | — | — | **공고 API 없음**. 마이홈에 섞여 오는 건 쓰고, 빠진 건 관리자가 사실만 입력 + 원문 링크 |

- 날짜 형식이 출처마다 다르다: 마이홈 `YYYYMMDD`, 청약홈 `YYYY-MM-DD`(일부 `YYYYMMDD`), LH `YYYY.MM.DD`, HUG `YYYYMMDDhhmmss`. 정규화 단계에서 전부 `YYYY-MM-DD`로.
- 시·도 코드 12 = 「전남광주통합특별시」가 새로 생겼다. 인천 구 개편(제물포·영종·검단구) 반영 필요.
- LH 물건은 마이홈에도 나온다 → 중복 제거 키: 마이홈 `url`의 panId, 없으면 기관+공고일+제목 유사도.

### 2-2. 수집 파이프라인

```
[크론] 출처별 라우트 ──▶ source_raw(원본 JSON, 해시) ──▶ 정규화 ──▶ announcements / supply_groups
                                                   │                       │
                                                   └─ 해시 바뀐 공고만 ─────┘
                                                                           ▼
                        LH PDF(AHFL_URL) ──▶ LLM 초안 추출 ──▶ 관리자 검수 ──▶ group.params (basis=reviewed)
```

| 크론(KST) | 하는 일 | 1회 호출 |
|---|---|---|
| `/api/cron/ingest/applyhome` | 5개 상세를 `RCRIT_PBLANC_DE ≥ 오늘-60일`로, 새·바뀐 공고만 `…Mdl` 추가 | 10~40 |
| `/api/cron/ingest/myhome` | 두 오퍼레이션, `yearMtBegin`=전전월 | 10~30 |
| `/api/cron/ingest/lh` | 목록 → 새·바뀐 공고만 상세+공급정보. PDF URL 저장 | 20~60 |
| `/api/cron/ingest/hug` | 1회. `NO_DATA`는 정상 | 1 |
| `/api/cron/extract` | LH PDF만 LLM 초안 → 관리자 큐 | LLM 한도 |

- 모든 크론 라우트는 `CRON_SECRET` Bearer 검사. API 키(`DATA_GO_KR_API_KEY`, `HUG_API_KEY`)는 서버 전용 — `NEXT_PUBLIC_` 금지.
- **IP 문제:** 이전 프로토타입에서 마이홈 API가 해외(GitHub Actions) IP에 403을 줬다. Vercel 함수 리전을 `icn1`(서울)로 두면 나가는 IP가 한국 대역이라 통과할 가능성이 높다 — **첫 배포 후 진단 라우트로 4개 출처를 실측**하고 결정한다. 막히면 ① Supabase(서울) pg_cron+pg_net ② 국내 소형 VM ③ 로컬 수동 실행 순.
- **Vercel Hobby는 약관상 비상업 전용**이다(A7). 유료 SaaS로 열 때는 Pro($20/월) 필수. Hobby 크론은 하루 1회·±59분.

### 2-3. 저장 구조 (연결 시)

| 테이블 | 핵심 컬럼 |
|---|---|
| `source_raw` | source, source_id, payload jsonb, hash, fetched_at — HUG처럼 사라지는 원본 보관 |
| `announcements` | id, source, source_id, agency, program, title, complex, sido, sigungu, schedule jsonb, regulation jsonb, units jsonb, notice_url, pdf_url, supersedes_id, status |
| `supply_groups` | announcement_id, group_id, label, units, params jsonb, basis(template/notice/reviewed) |
| `ingest_runs` | source, started_at, ok, counts, error |

RLS: 공개 읽기는 `status='published'`만, 쓰기는 service_role만. **사용자 프로필은 서버에 저장하지 않는다**(알림 기능을 붙일 때 별도 동의·최소 항목으로 재설계).

## 3. 판정 엔진

코드: `src/lib/rules/` — `core.ts`(세 값·구간) · `checks.ts`(조건 부품) · `templates.ts`(유형별 템플릿) · `evaluate.ts`(공고 판정·추천 질문) · `gajeom.ts`(84점) · `standards.ts`(기준표).

### 3-1. 모델

```
공고(Announcement) ─┬─ 공급 대상(SupplyGroup: 청년 계층 / 신혼부부 특별공급 / 일반공급 …) ─ params(공고별 값)
                    └─ 주택형(HousingUnit: 면적·세대수·보증금/분양가)

판정 = TEMPLATES[program][group](공고, 대상, 프로필, 기준표)
      → checks(자격)  rankChecks(1순위 요건)  rank(예상 순위)  score(가점·배점)  notes(선정 방식)
```

- **템플릿 = 법령 기본값.** 공고문 PDF를 읽기 전에도 행복주택 청년이면 「만 19~39세·미혼·본인 무주택·소득 100%(1인 120%)·자산 2억 5,100만」으로 **첫날부터 판정**한다(`basis=template`, 화면에 「법령 기본값으로 추정」).
  이전 프로토타입은 PDF 추출 전까지 129건 전부가 「확인 필요」였다 — 이 설계의 핵심 개선점.
- **공고별 값(`GroupParams`)이 있으면 덮어쓴다:** 나이·소득%·자산·자동차·신청 가능 지역·거주기간 요건. 출처는 청약홈 구조화 필드 또는 PDF 추출+검수.

### 3-2. 세 값 판정

| 입력 | 비교 | 결과 |
|---|---|---|
| 소득 구간 300~400만, 기준 381만 | 구간이 기준선에 걸침 | `unknown` + 「구간이 기준선에 걸쳐 있어요」 |
| 1997년생, 기준 만 19~39세 | 만 28~29세 모두 안쪽 | `pass` |
| 1986년생, 기준 39세 | 만 39 또는 40 | `unknown` + 「생일에 따라 달라요」 |
| 총자산 3억, 공공분양 **부동산** 2억 1,550만 | 부동산 ≤ 총자산이라 단정 불가 | `unknown` (절대 `fail`로 치지 않는다) |
| 맞벌이 여부 모름, 외벌이 기준 초과·맞벌이 기준 이내 | | `unknown` + 「맞벌이라면 기준이 올라가요」 |

공급 대상 판정: 하나라도 `fail` → 해당 없음, 아니면 하나라도 `unknown` → 확인 필요, 전부 `pass` → 신청 가능.
공고 대표 결과: 신청 가능 > 확인 필요 > 해당 없음, 같으면 순위 → 점수 비율 순.

### 3-3. 순위·점수 모델

| 유형 | 순위 | 점수 |
|---|---|---|
| 행복주택 | 1 해당·연접 시·군·구 → 2 같은 시·도/수도권 권역 → 3 그 밖. 동순위 추첨 | — |
| 국민임대 | 50㎡ 미만: 거주지 / 50㎡ 이상: 통장 24회→6회→그 외 | 동순위 배점 18점(나이·부양가족·거주·부모 부양·자녀·납입) |
| 통합공공임대 | 우선공급 60% 배점, 일반은 소득 구간별 추첨 | 우선공급 배점 15점(**기준 중위소득**) |
| 매입·전세임대 | 청년 1 수급자등 → 2 본인+부모 100% → 3 본인 100% / 신혼 신생아·한부모 → 자녀 있는 신혼 → 없는 신혼 | — |
| 영구임대 | 1 수급자·한부모·장애인·유공자 → 2 소득 50% | — |
| 청년안심·든든전세 | 추첨 | — |
| 공공분양 일반 | 1순위(가입 기간+납입 횟수, 규제지역은 세대주·5년 내 당첨 없음) | 40㎡ 초과 저축총액(월 25만 인정) / 이하 납입횟수 |
| 민영 일반 | 1순위(가입 기간·지역별 예치금, 규제지역 추가요건) 미달이면 2순위 | **가점 84점** + 면적·규제별 가점:추첨 비율 |
| 특별공급 | 신혼(민영 1순위=자녀 있음), 다자녀 100점 배점, 노부모 가점제, 생애최초·신생아 추첨 | 공공 신혼·신생아 배점 13점 |

### 3-4. 「이것만 알려주시면」

각 `unknown` 조건은 풀 수 있는 프로필 칸(`ask`)을 달고 있다. 진행 중 공고에서 `ask`를 모아 질문 묶음(통장·자산·세대 정보 …)별로 **판정이 바뀔 수 있는 공고 수**를 세고, 많은 순으로 권한다. 사용자는 필요한 질문만 추가로 답한다.

## 4. 기준표 (2026)

| 항목 | 값 | 출처 |
|---|---|---|
| 도시근로자 월평균소득 100% (임대, 가구원수별) | 1인 381만 3,363 / 2인 586만 6,270 / 3인 816만 8,429 / 4인 880만 2,202 … | S13·S15 |
| 분양 계열 3인 이하 「가구당」 | 753만 3,763 | S13 |
| 기준 중위소득 (통합공공임대) | 1인 256만 4,238 / 2인 419만 9,292 … | S15 |
| 자산 | 국민·통합·행복(신혼·고령) 3억 4,500 / 행복 청년 2억 5,100 / 대학생 1억 800 / 영구·매입 2억 4,500 / 공공분양 부동산 2억 1,550 / 나눔·선택형 3억 6,200 / 자동차 4,542 (만원) | S13~S15·S18 |
| 예치금 (만원) | 서울·부산 300/600/1000/1500, 광역시 250/400/700/1000, 기타 200/300/400/500 | S2 |
| 가점 84 | 무주택 32(만 30세·혼인 기산, 30세 전 미혼 0점) · 부양가족 35 · 통장 17(배우자 50% 최대 3점) | S1·S3 |

- 소득은 2026-01-01 공고분부터, 자산은 2026-02-27 공고분부터 적용. `standardsFor(공고일)`이 연도를 고른다.
- 1인 +20%p·2인 +10%p 가산은 **임대 계열에만**. 공공분양 일반형·민영 특공에는 없다.
- 2026-06-15 개정: 민영 **신생아 특공 10% 신설**, 민영 신혼 특공 15%·소득 구조 50/20/30 단순화.
- 다자녀 100점 배점표는 원문 PDF 레이아웃이 깨져 있어 **원본 재확인 필요**(S12).

## 5. 검색·AI 노출 (SEO · AEO · GEO)

지금 색인할 자산은 공고(예시 데이터)가 아니라 **기준 지식**이다. 가이드 19장과 허브를 판정 엔진과 같은 숫자(`standards.ts`·`criteria.ts`)로 빌드 때 만든다 — 숫자를 손으로 적지 않는다.

| 경로 | 색인 | 비고 |
|---|---|---|
| `/` | index | WebApplication·FAQPage JSON-LD, 홈 → 가이드 내부 링크(「2026 기준표」 구간·푸터) |
| `/guide`, `/guide/[slug]` 19장 | index | 답변 문단(`#answer`, 2문장·숫자 포함) → 기준일 상자 → 질문형 H2 → 표 → FAQ(`<details>`, 답이 HTML에 상주) → 출처(법령) → 관련 가이드. Article(citation=Legislation)·BreadcrumbList·FAQPage·Dataset(소득표) |
| `/check`, `/results` | noindex, follow | 개인 입력·결과 |
| `/notice/[id]` | noindex, follow | 예시 데이터. 실데이터 연결 뒤 접수 중·예정만 색인 |
| `/privacy` | index | 서버 저장 0 안내 |

- `robots.txt`는 라우트(주석 줄로 다음 웹마스터 인증 가능, `DAUM_WEBMASTER_TOOL`). AI 크롤러 18종 명시 허용, 네이버(Yeti)에는 `llms*.txt` 차단, Bytespider 차단.
- `llms.txt`(안내)·`llms-full.txt`(전 가이드 본문) — `X-Robots-Tag: noindex`.
- `sitemap.xml` 고정 lastmod(가이드 `updated`), `guide/rss.xml`(네이버 서치어드바이저 RSS 제출용), `manifest.webmanifest`.
- 공유 카드: `opengraph-image.tsx`(홈·허브·가이드 19장, 빌드 때 정적 생성). Satori에 한글이 없어 Pretendard를 KS X 1001 2,350자로 줄인 TTF(`src/assets/fonts`, 각 약 400KB)를 쓴다.
- 운영 주소가 아닌 호스트(배포별 미리보기 URL)는 `next.config.ts`에서 `X-Robots-Tag: noindex`.
- 검색엔진 소유 확인: `GOOGLE_SITE_VERIFICATION`·`NAVER_SITE_VERIFICATION`·`BING_SITE_VERIFICATION` 환경변수(메타 태그로 나간다).
- 확인이 끝나지 않은 값(영구·매입 자산 2억 4,500만, 민영 특공 부동산 3억 3,100만)은 화면에 「확인 중」으로 표시. 다자녀 특공 페이지는 배점표 원문 재확인 뒤 공개.
- 도메인을 바꾸면 `NEXT_PUBLIC_SITE_URL`을 새 주소로 두고, 옛 주소는 301로 넘긴다.

## 6. 아직 안 된 것 / 다음 순서

1. **data.go.kr 인증키 발급** → `.env.local`의 `DATA_GO_KR_API_KEY`. HUG는 별도 키.
2. icn1 진단 라우트로 4개 출처 IP 차단 여부 실측.
3. Supabase 테이블(2-3) + 수집 크론 → `SITE.sampleData=false`로 예시 데이터 끄기(색인도 그때 연다).
4. LH PDF → LLM 초안 → 관리자 검수 화면.
5. 입력하지 않는 항목(혼인 연도, 2세 미만 자녀 수, 재당첨 제한, 소득세 납부 연수 상세)은 지금 「확인 필요」로 처리 중 — 필요성 보고 질문 추가.
6. 유료화 전: Vercel Pro 전환, 통신판매업 신고, 개인정보처리방침·이용약관 법률 검토.
7. 검색 등록: 구글 서치콘솔·네이버 서치어드바이저(사이트맵 + RSS)·다음 웹마스터·빙 웹마스터(ChatGPT 검색이 빙 색인을 쓴다) — 환경변수로 소유 확인 값을 넣고 재배포.

## 출처

| 약어 | 내용 |
|---|---|
| A1 | https://www.data.go.kr/data/15098547/openapi.do (청약홈 분양정보) · Swagger https://infuser.odcloud.kr/api/stages/37000/api-docs |
| A2 | https://www.data.go.kr/data/15108420/openapi.do (마이홈 공공주택 모집공고) |
| A3 | https://www.data.go.kr/data/15058530/openapi.do · 15057999 · 15056765 (LH 목록·상세·공급정보) |
| A4 | https://www.data.go.kr/data/15143827/openapi.do (HUG 든든전세) |
| A5 | https://www.myhome.go.kr/hws/portal/cont/selectOpenPublicDataView.do (영리 이용 허용 명시) |
| A7 | https://vercel.com/docs/limits/fair-use-guidelines (Hobby 비상업) · https://vercel.com/docs/functions/configuring-functions/region |
| S1 | 주택공급에 관한 규칙 [시행 2026.6.15, 국토교통부령 제1592호] |
| S2 | 규칙 별표2(예치금) https://www.law.go.kr/LSW/flDownload.do?flSeq=164922735 |
| S3 | 청약홈 가점계산기 https://www.applyhome.co.kr/ap/apg/selectAddpntCalculatorView.do |
| S4~S10 | 공공주택 특별법 시행규칙 [2026.8.24] 및 별표 3·4·5·5의2·6·6의2·6의6 |
| S11·S12 | 신생아·신혼 특공 운용지침(고시 2026-253), 다자녀·노부모 특공 운용지침(고시 2026-360) |
| S13~S15 | LH 공공분양·청약플러스, 마이홈 자격 안내 |
| S16~S19 | LH 유형별 페이지, SH 장기전세 2026, 서울 청년안심주택, HUG 든든전세 공고(2026.7.24) |
| S20·S21 | 규제지역 지정(2025.10.15), 민영 신생아 특공 신설 보도자료 |
