# 접수 이중화(시트+DB) + 회원(카카오·구글·네이버) + DB 관리 화면 — 실행 계획 v3

> **v3 = 사실검증 완전 반영판.** 초안을 레포와 6갈래로 대조하고 3인이 적대적으로 비판해
> **blocker 24건 + 함정 100여 건**을 잡아 전부 반영했다. 운영자 지시: "모두 수정·반영·보완 후 계획 반영".
>
> **초안이 틀렸던 것 — 되살리지 말 것**: 부분 유니크 인덱스+upsert / `/api/payment/prepare` 에서 recordOrder /
> `@supabase/ssr` 설치돼 있음 / review 를 스윕 범위에 포함 / GAS 성공=HTTP 200 / 방침 개정을 P4 로 미룸 /
> 삽입 지점이 라우트당 2곳 / 진입점이 '텍스트 링크 추가' / 접수 9종.
>
> **실행 전 필독**: ① `CLAUDE.md` ② `docs/DECISIONS.md` ③ `supabase/README.md`
> ④ `app/(main)/lazyday/preview/commerce-journey/Rules.tsx`(R1~R13 원문) ⑤ `docs/url-policy.md`
>
> **브랜치**: Phase 마다 **새 이름**으로 — `git fetch origin main && git checkout -B claude/<주제> origin/main`.
> 병합된 브랜치명을 다시 밀지 않는다(CLAUDE.md: 병합된 PR 재사용 불가).

## 진행 현황 (2026-09-01 현재)

| Phase | 상태 |
|---|---|
| P0 방침 개정 | ✔ 완료·배포 (2026-09-01, #552) |
| P1 applications + 패스스루 이중화 | ✔ 완료·배포 (2026-09-01, #554) |
| P2 전용 라우트 3종 | ✔ 완료·배포 (2026-09-01, #561) |
| **P2.5 결손 0 보정 루프** | **← 다음** |
| P3 → P5 | 대기 |

> 각 Phase 를 끝내면 **같은 PR 에서 이 문서를 현재화**한다 — 완료 섹션은 결과·확정 판단·잔여
> 항목으로 압축하고, 상세는 DECISIONS·실파일(정본)로 넘긴다.

---

## Context

접수 데이터가 Google 시트(GAS)에만 저장된다 — DB(Supabase)에 흔적이 남는 건 선결제 원데이 하나뿐이다.
운영자 지시(2026-09-01): ① **접수 전부** 시트+DB 이중화(시트 유지) ② **회원 기능** ③ **DB 관리 화면**.
추가 확정: **영구결손 금지**, 로그인 진입점은 **탑네비 우측 상단 + 결제 페이지 회원/비회원 분기**.

설계 정본(commerce-journey)의 미구현 칸을 채우는 일 — **R6**(applications 별도 테이블) · **profiles**(북클럽·레이지클럽 공통 회원 원장, 기확정) · **R11**(비회원 유지, 사후 연결은 주문번호+전화 둘 다 일치).

**이 작업이 건드리지 않는 규칙(한 줄로 못박는다)**: R3(참가자≠주문자 — 대리 결제 분리) · R4 · R5(refunds) · R7(holds) 은 **범위 밖**이다. 다음 세션이 "미구현 칸을 채운다"는 말에 끌려 손대지 말 것.

## 접수 지도 (정정 — 초안의 '9종'은 틀렸다)

| kind | 폼 | 라우트 | GAS 핸들러 | 시트 |
|---|---|---|---|---|
| bookclub | `lazyday/apply` | `/api/lazyday/apply`(패스스루) | handleApply | 북클럽·신청현황 |
| notify | `NextSeasonNotify` | 〃 | handleNotify | 북클럽·4기 알림 |
| coffeebar | `lazyclub/meetings/dm-gd` | 〃 | handleCoffeeBar | 레이지클럽·커피앤바 |
| oneday | `lazyclub/meetings/[slug]/apply`(orderId 없음) **+** `lazyday/checkout/success`(orderId 있음) | 〃 | handleOnedayApply | 레이지클럽·원데이 토크 |
| interview_phone | `apply/interview/schedule` | `/api/lazyday/interview/book`(구조분해) | handlePhoneBooking | 북클럽·전화 인터뷰 |
| interview_written | `apply/interview/written` | `/api/lazyday/interview/written` | handleWritten | 북클럽·서면 인터뷰 |
| review | `lazyday/review` | `/api/lazyday/review`(원시 fetch) | **별도 프로젝트** `gas/review.gs` | 후기 별도 파일 |

**라우트 경유 7 kind / 라우트 4개.** 그 밖에 **`lazyday/review/week1/page.tsx:52-60` 은 브라우저가 하드코딩 GAS URL 로 `mode:"no-cors"` 직접 POST** 한다 — 서버를 안 거치고 성공·실패 판별도 불가하다. **이중화 범위 밖**으로 명시하고 손대지 않는다(라우트화는 후속 판단).

## 운영자 확정 (2026-09-01 문답)

| 항목 | 확정 |
|---|---|
| 이중화 범위 | **접수 전부** (시트 저장 유지) |
| 로그인 사업자 | **카카오+구글 먼저, 네이버 후속** |
| 관리 | **DB 관리 화면까지** (정본 전환은 단계적) |
| 결손 | **영구결손 금지** |
| DB 적용 경로 | **Supabase MCP 재연결** |
| 개인정보처리방침 | **지금 바로 단독 배포**(P0) |
| 마이페이지 주소 | **`/mypage`** ("국내 관습 따를게") |

---

## 불변 원칙 (전 Phase 공통)

1. **GAS(시트) = 1차 정본.** DB 기록 실패가 접수 응답을 깨뜨리지 않는다 — `lib/orders.ts:22-24` 의 `LedgerResult`(던지지 않음 / env 미설정 시 `{ok:true,skipped:"disabled"}` / 23505=duplicate 성공).
2. **GAS 성공 판정은 HTTP 가 아니다.** 실패도 **200 + `{success:false}`** 로 온다 — 화이트리스트 밖 type(`gas/linkyincdev-main.gs:278`), 필수항목 누락(`:291`·`:567`), **슬롯 중복(`:579`)**. `data?.success !== false` 일 때만 기록한다. 안 지키면 시트에 없는 **유령 행**이 쌓여 P3 대조가 무의미해진다. (302 유실 경로는 실행 확정이므로 무조건 기록 + `gasBodyLost:true`.)
3. **RLS 정책 0개 유지.** enable+force+revoke, 브라우저 supabase-js 금지, 조회는 서버 라우트(service_role) 경유. **`NEXT_PUBLIC_SUPABASE_*` 절대 금지.** ⚠ 새 테이블마다 Supabase 어드바이저 **INFO 가 1건씩 는다 — 의도된 상태다**(DECISIONS:169). 이걸 결함으로 오인해 `create policy` 를 넣으면 `supabase/README.md:122-124` 의 명시 금지를 정면으로 어긴다.
4. **마이그레이션**: append-only, **dev(`kfqtzxxtwokouvoqpebq`) → prod(`qdxnxdfebkgoxeqzfmji`)**. 적용은 **Supabase MCP** — 세션 시작 시 `ToolSearch` 로 확인하고 **없으면 운영자에게 알리고 대기**. ⚠ **이름으로만 찾지 말 것**: 서버가 `mcp__Supabase__*` 가 아니라 **UUID 네임스페이스**(`mcp__<uuid>__apply_migration`)로 붙는 세션이 있다 — `select:mcp__Supabase__apply_migration` 이 빈손이라고 "MCP 없음"으로 단정하면 안 된다(2026-09-01 실제로 그렇게 붙었다). `ToolSearch "supabase migration"` 처럼 **키워드로** 찾고, 호출 승인이 뜨면 운영자에게 승인을 요청한다. 적용 후 **`supabase/README.md` §4 표(`| 파일 | 내용 | dev | prod |`)에 행 추가는 필수** — SQL Editor 로 적용하면 `supabase_migrations.schema_migrations` 에 안 남아(DECISIONS:49 실측) 그 표가 **적용 이력의 유일한 정본**이다. ⚠ MCP `apply_migration` 은 기록을 남기긴 하지만 **자체 타임스탬프**로 남는다(2026-09-01 실측: 파일명 `20260901093000` ↔ 기록 `20260901121219`) — 파일↔적용 대응은 여전히 README §4 표로 잇는다. (MCP 는 2026-09-01 연결·승인·실사용 확인 — 세션마다 연결 여부만 재확인)
5. **마이그레이션 SQL 관례**: 배너 주석 `-- 000N · <제목>` + '해소하는 것 / 지키는 결정' 문단(전례 `core_orders.sql:1-23`) → applications 는 **0005**(적용 완료). ⚠ **0006·0007 은 이미 다른 작업이 썼다**(`20260901140000_applications_marketing_retention` · `20260901180000_funnel_content_name`) — **profiles 는 다음 번호로**, 붙이기 전 `ls supabase/migrations/` 로 실제 마지막 번호를 확인할 것. `create extension if not exists pgcrypto;`(gen_random_uuid 쓰는 전례 파일이 매번 선언) · `create table/index if not exists` · `drop trigger if exists … ; create trigger …` · **`comment on` 으로 R# 근거**(인라인 `--` 는 DB 에 안 남는다).
6. **GAS 변경이 있는 Phase 는 §6 순서**: `gas/` main 병합 → `gas-deploy.yml` success 확인 → 프론트 병합. ⚠ 착수 전 **`node scripts/gas-sync.mjs check`** 로 드리프트 확인(걸리면 `pull` → 커밋이 선행). ⚠ 워크플로가 `script.googleapis.com` 503 으로 실패한 실사고가 있고(DECISIONS:45) **세션에는 재실행 권한이 없다** — 막히면 운영자에게 재실행을 요청하고 프론트 병합을 보류한다.
7. **검증에서 시트를 오염시키지 않는다**: `INTERVIEW_GAS_URL` 미설정 목업 모드 + dev Supabase env. ⚠ 함정 3개 — ① 폼에 **`sim` 테스트 모드**가 있어 `/lazyday/admin/simulate` 경유로 열면 라우트를 아예 안 부른다(조용히 0행) ② **프리뷰 apply 폼(`preview/apply/**`)은 fetch 자체가 없다** — 반드시 실사이트 경로로 ③ 레이지클럽 트리는 Playwright 에서 폰트가 매달리므로 외부 요청 차단 필수.
8. **`npm run build` 는 타입 게이트가 아니다** — `next.config.mjs:3-5` 가 `typescript:{ignoreBuildErrors:true}`. 실제 게이트는 **`npx tsc --noEmit` 하나뿐**이다.
9. **프리뷰 퍼스트(철칙 1) 경계** — P1·P2·P2.5·P3(라우트·DB·GAS·admin)은 직접. **P4 의 고객 대면 UI**(셸 진입점·`/mypage`·checkout 분기)는 **브랜치 프리뷰 + 390px 스크린샷 승인 후 병합**.
10. **로그·응답에 개인정보 금지** — kind·sid·건수·에러 코드까지만. GAS Logger, backfill 실패 로그, PR 본문에 붙이는 검증 로그까지 적용(dev 목업 모드는 body 전문을 `console.log` 한다).
11. **문서 갱신 의무** (CLAUDE.md §8) — 각 Phase 병합 커밋에 함께: **DECISIONS append** / **CLAUDE.md §4** 에 새 공유 자산 등재(`lib/applications.ts`(라우트 4곳 공유)·`lib/auth-server.ts`·`Shell.tsx`·`applications` 테이블) / **§5** 에 새 함정 / **P1 에서 `Rules.tsx` 의 R6 `ok:false` → `true`**(순수 문서 컴포넌트, 결제 무관) / **P4 에서 DECISIONS '대기 중' 불릿의 '인증 방식·적용 시점' 2건 제거**(머리말이 같은 커밋을 요구).

---

## P0. 개인정보처리방침 Supabase 수탁자 고지 — ✔ 완료 (2026-09-01, #552)

`app/(main)/lazyday/privacy/page.tsx` 단독 수정(사본 없는 단일 파일 — lazyclub 셸의 `/privacy` 까지 한 번에). 양 도메인 프로덕션 확인 완료. 상세는 DECISIONS 2026-09-01 행.

- 제5조: `Supabase, Inc.: 주문·신청 정보의 저장·관리 (데이터베이스 호스팅)` 추가.
- 제6조 **포함 — 운영자 확정.** 저장 리전은 서울(ap-northeast-2)이라 데이터는 국내지만, 법 제28조의8 ①의 "국외로 제공(**조회되는 경우를 포함한다**)"에 따라 미국 법인의 운영·기술지원 접근 가능성을 보수적으로 고지(저장 국가·위치 병기). 같은 항 3호(방침 공개 갈음)로 **추가 동의 불요**.
- 제12조 **즉시 시행(9/1) — 운영자 확정**(7일 예고안 기각). 자기모순 방지 단서 "정보주체에게 불리하지 않은 변경은 고지와 동시에 시행한다"를 같은 조에 명시.

---

## P1. `applications` 테이블 + 패스스루 라우트 이중화 — ✔ 완료 (2026-09-01, #554)

**정본 파일 3개** (스펙 상세·SQL 원문은 이 문서가 아니라 실파일이 정본이다):
- `supabase/migrations/20260901093000_applications.sql` (0005) — **dev·prod 적용 완료**, README §4 표 갱신. 설계 판단 4건(컬럼 unique·purge_after NOT NULL·형태 check·행 남기고 비우는 파기)은 배너 주석에 보존.
- `lib/applications.ts` — `classifyApply`(화이트리스트, GAS doPost 분기와 값 집합 일치) · `recordApplication` · `recordSafe`(유령행 차단 규율) · `writtenDedupKey`(null 가드). P2 3종 kind·추출 맵까지 선반영.
- `app/api/lazyday/apply/route.ts` — 삽입 3지점(dev 목업 / GAS 성공 / 302 유실) + sid 발급·GAS 동봉.

**실행 중 확정된 판단**
- 보유기간 택1 → **`seasonEndsOn()` 신설 채택**(`season-config.ts`) — 기수 종료+1년, 방침 제3조와 같은 기준. 접수+1년 폴백은 방침보다 **이르게** 지우는 쪽이라 기각. 원데이는 slug→`meetingOrderCode()` / orderId→`parseOrderCodes()` 로 dNNN 을 거친다(slug 직접 투입 시 조용히 null — 실측).
- dev·prod 스키마 대조는 **MCP 로 직접 수행, 전 컬럼 동일 확인** — 운영자 부탁 불필요해짐.
- `lib/orders.ts` 의 `normalizePhone`·`meetingEndsOn`·`purgeAfter` export 전환, `Rules.tsx` R6 → 충족.

**검증** — 로컬 PG16 리허설(제약 8종·파기 2종·재실행 안전·anon 전면거부) → dev 스모크 → prod 구조확인(21컬럼·RLS force·정책 0·cron active, 쓰기 없이) → 목 GAS 로 라우트 4경로 실측(정상 기록 / **200+`success:false` 기록 차단** / 302 무조건 기록+`gas_body_lost` / `apply_draft` 는 sid·기록 둘 다 없음) → tsc.

**잔여 1건**: route→Supabase **실기록 미검증** — service_role 키는 MCP 가 주지 않는다(의도된 제한). 실패해도 로그만 남고 접수는 성립하는 설계라 병합했고, **첫 실접수 때 prod `applications` 를 MCP 로 조회해 닫는다.**

---

## P2. 전용 라우트 3종 — ✔ 완료 (2026-09-01, #561)

- **`interview/book`** — kind `interview_phone`. ⚠ GAS 응답을 검사하지 않고 흘린다(`:44-45`). **슬롯 중복이 흔한 경로**라 불변 원칙 2 가드가 특히 중요.
- **`interview/written`** — kind `interview_written`, dedup_key 가드 적용. ⚠ **catch 가 실패해도 `{success:true}` 를 돌려준다**(`:53-55`, 주석에 'UX 우선'). 시트에도 DB 에도 안 남는 **진짜 영구결손 경로**이고 스윕으로도 복구 불가(시트에 행이 없다) → **catch 안에서도 `recordApplication` 을 호출**해 DB 를 유일한 흔적으로 남긴다.
- **`review`** — kind `review`. ⚠ 이 라우트만 구조가 다르다: `lib/gas.ts` 미사용, 원시 `fetch(redirect:"follow")`, env `REVIEW_GAS_URL`, **302 유실 판정 없음**, catch 가 `{success:true}` 로 삼킴 → written 과 같은 처리.
- **P1 에서 기구현**: `lib/applications.ts` 가 P2 3종 kind·이름/전화 추출 맵·`writtenDedupKey()`(9자리 미만 → null 가드, 실측 완료)를 이미 갖고 있다 — P2 는 **라우트 3개에 `recordSafe` 배선**이 전부다.
- ✔ **`apply` 는 해결됨** (2026-09-01, 운영자 "이건 절대 안 되지") — GAS 거절 시 손님에게 `{success:false}` 를 돌려주고 `markSubmitted` 도 건너뛴다. 판정은 `lib/gas.ts` 의 `isGasRejected()` 로 통일. `interview/book` 은 원래 `NextResponse.json(data)` 패스스루라 이미 거절이 전달된다.
- ⚠ **`written`·`review` 의 catch 삼킴은 이 Phase 에서 함께 고친다** — 응답만 먼저 실패로 바꾸면 **손님은 실패를 보는데 시트·DB 어디에도 기록이 없다**. DB 기록(`recordApplication`)을 붙인 뒤에야 응답을 사실대로 바꿀 수 있다. 순서: 기록 먼저, 응답 나중.
- 검증: P1 과 동일. 독립 PR.

---

## P2.5. 결손 0 보정 루프

**원리**: 접수마다 sid(P1 부터) → 시트·DB 공유 → GAS 시간 트리거 스윕이 시트를 훑어 보정 엔드포인트로 밀고 sid upsert → **시트에 있으면 DB 에 반드시 생긴다.**

⚠ **제약 8건 — 설계를 여기에 맞춘다**
1. **GAS→우리 API 인증 선례가 없다.** 기존 ADMIN_TOKEN 계약은 **우리 사이트 → GAS 한 방향**뿐이고(GAS 아웃바운드는 전부 solapi), 그 두 값이 불일치했던 사고 기록도 있다(DECISIONS:321). **역방향 전용 토큰을 새로 두는 편이 안전** — 재사용하려면 불일치 시 스윕이 통째로 죽는다는 점을 감수.
2. **GAS 가 우리 도메인을 모른다** — 스크립트 속성 `SITE_URL` 신설(운영자 1회 입력).
3. **후기(review)는 스윕 범위 밖으로 확정한다** — `gas/review.gs` 는 별도 프로젝트이고 `gas/project.json` 매핑에 없어 **자동 배포 대상이 아니다**. 게다가 소유 계정이 다를 수 있어(메인=linkyincdev / review=linkylounge 계열) `openById` 가 통할지도 미검증이다. 후기는 P2 라우트층 이중화만으로 두고, **'영구결손 금지'가 후기에는 성립하지 않음을 명시**한다.
4. **서면 재제출이 sid 등식을 깬다** — `handleWritten` 은 `setValues(existingRow,1,1,9)` 로 **1~9열만** 갱신(의도적 — 유입 출처 보존)이라 뒤쪽 '제출 ID' 는 **최초 sid 로 남는다**. → **written 은 전화번호 파생 결정적 sid** 를 쓰거나, GAS 재제출 분기에서 '제출 ID' 셀을 명시적으로 덮어쓴다.
5. **탭마다 쓰기 방식이 다르다** — 4개만 `ensureColumn`+`colIndexMap`, `handlePhoneBooking` 은 고정 6칸 `prependRow`(`:593`), written 신규는 9칸 배열 + 별도 셀 쓰기.
6. **정렬을 믿을 수 없다** — 전화 인터뷰는 `sortPhoneByInterview()` 로 **인터뷰 일시 순** 재정렬, 다른 탭도 메뉴로 재정렬, written 재제출은 오래된 행을 제자리 갱신. → **"최근 N행" 금지**, **'제출 ID 가 있고 아직 보정 안 된 행'을 전체에서 훑는다**.
7. **`lazyclubSs()` 부작용**(`:136-155`): 속성이 비었거나 파일이 지워졌으면 **새 스프레드시트를 만들고 운영자에게 메일까지 보낸다** — 시간 트리거가 빈 시트를 양산할 수 있다. **스윕은 속성을 직접 읽어 값이 없으면 no-op.** `ensureColumn` 도 빈 시트에서 예외를 던지니 없는 탭·빈 탭은 건너뛴다.
8. **GAS 할당량** — 트리거 1회 6분 상한, UrlFetchApp 페이로드 크기. 신청현황은 전 기수 누적이라 전 행 스캔 + 개인정보 rows 를 한 번에 POST 하면 위험 → **배치·페이지네이션·`muteHttpExceptions:true` + 상태코드 로깅**. 반복 실패 시 Apps Script 가 소유자에게 실패 메일을 자동 발송한다(운영자 소음).

### 순서
1. **GAS 선배포**: 6종 핸들러가 `d.sid` 를 `ensureColumn("제출 ID")` 로 기록(쓰기 방식 차이 반영) + `sweepApplicationsToDb()` + `onOpen` 메뉴 항목. **service_role 키는 GAS 에 넣지 않는다.** → 병합 → `gas-deploy.yml` success 확인.
2. **프론트**: `app/api/lazyday/admin/backfill-applications/route.ts`(토큰 검증 → sid upsert `ignoreDuplicates`, `payload_src:'sheet'`, sid 없는 구행 스킵, **응답은 건수만**) + health Check.
3. **운영자**: **스프레드시트 새로고침 → [메뉴] → 트리거 켜기**(onOpen 은 파일을 열 때만 실행된다) + 스크립트 속성 `SITE_URL`·토큰 입력.
4. 검증: dev 에서 모의 rows 2회 POST → 행 1개(멱등). `gas-sync check` → 실배포 후 Logger 로 스윕 1회 수동 실행.

⚠ **리스크 정정**: 이 루프가 없애는 것은 **'GAS 성공 + DB 실패'** 뿐이다. **GAS 자체 실패는 시트에도 DB 에도 안 남는다** — 그 경로(written·review catch)를 P2 에서 DB 기록으로 막아야 "영구결손 없음"이 성립한다. `gasPostJson` 은 재전송하지 않으므로 같은 sid 가 시트에 두 번 찍히는 일은 원칙적으로 없다(`ignoreDuplicates` 는 스윕 중복 호출 방어용).

---

## P3. Admin 조회 전용 (Stage A — 쓰기 API 미배포)

- `app/api/lazyday/admin/applications/route.ts` — **GET only**. 쿠키 `lazyday_admin`===`ADMIN_SECRET`, `if (!sb) return {enabled:false, rows:[]}`, 필터(kind·기간·이름/전화), 페이지네이션, snake→camel 은 라우트에서.
- `app/(main)/lazyday/admin/applications/page.tsx` — status 페이지 패턴. **status 는 렌더링하지 않고** "상태 정본: 구글 시트" 배지.
- **대조 숫자의 주체를 정한다** — "최근 7일 kind 별 건수"는 DB 값일 뿐이라 시트는 운영자가 눈으로 세야 한다. **스윕 응답의 `received/upserted/skipped` 를 무개인정보 행으로 남겨** DB 안에서 대조가 닫히게 한다. health 의 "미보정 건수" 산식도 정의할 것.
- **즉시 파기 수단** — `purge_application(uuid)` 를 admin 단건 버튼 또는 문서화된 절차로.
- ⚠ **R13 후반부**("관리자는 service_role 로 우회하되 **감사 로그를 남긴다**", `Rules.tsx:114`) — 이 화면은 이름·전화를 조회하면서 열람 기록을 남기지 않는다. 남기지 않기로 한다면 **그 판단과 근거를 계획서·DECISIONS 에 명시**해 R13 과의 차이를 드러낸다.
- 검증: preview + Playwright 스모크.

---

## P4. 회원 — P4a 카카오+구글 → P4b 네이버(후속)

### P4-0. 선행 (P1 착수와 **동시에** 안내 — 리드타임이 길다)

- **의존성**: `@supabase/ssr` **미설치** → `npm i @supabase/ssr`. ⚠ **락파일이 둘이다** — `package-lock.json`(실제) + `pnpm-lock.yaml`(96바이트 빈 스텁). `packageManager` 필드도 `vercel.json` 도 없어 **Vercel 이 pnpm 을 감지해 빈 락파일로 설치를 시도할 위험**이 있다. 의존성 추가 전에 이 상태를 정리할지 판단할 것.
- **약관 개정** — 현행 약관에 **회원 조항이 없다**: `TermsBody.tsx:90` 제7조① "**별도의 회원가입 없이 구매할 수 있습니다**"가 '회원'이 나오는 유일한 문장이고 제2조 정의에 '회원'·'계정'이 없다. 수정 지점은 **`app/(main)/lazyday/terms/TermsBody.tsx` 한 곳**(lazyclub/terms 가 직접 import — 사본 금지 명시). ⚠ **제3조③: 7일 전 공지, 불리 변경은 30일 전** — 회원 조항 신설은 30일 해석 여지가 있다.
- ⚠ **용어 충돌**: `/lazyday/policy`(기수제 약관)의 '회원'은 **기수 참가자**를 뜻하는데, 설계 정본 용어집은 "회원 = 소셜 로그인 계정 보유자"다. 같은 단어가 두 문서에서 다른 뜻이 된다 → 정리(예: 계정 보유자='회원', 기수 참가자='참가자')를 개정에 포함.
- **만 14세** — 소셜 로그인은 나이를 묻지 않는다(법 제22조의2). `docs/community-spec-2026-07.md:73` 이 이미 1차 과제로 적어 뒀다 → **최초 로그인 직후 확인 체크(시각 저장)** 를 약관 개정과 같은 배포에.
- ⚠ **노선 확인 필요**: `community-spec-2026-07.md:10·32` 는 "**공개 '회원가입' 버튼이 없는 사이트** — 인터뷰 합격자에게만 문이 열리는 구조가 '선별의 서사'의 기술적 완성형"이라고 적었다. 이번 계획은 탑네비에 **상시 공개 로그인 입구**를 둔다. 명세는 초안·미결이라 확정 번복은 아니지만 **브랜드 서사 판단이므로 운영자에게 확인**한다.
- **운영자 준비물**: Kakao/Google(후속 Naver) 개발자 앱 + 키, Redirect URI `https://<ref>.supabase.co/auth/v1/callback`(dev·prod 각각), Supabase provider 활성화 + Redirect URLs 에 **두 도메인 + preview**, Vercel env **`SUPABASE_ANON_KEY`**(신규, 서버 전용 → **Type=Secret** 로 넣고 재배포만으로 반영. `NEXT_PUBLIC_*` 이 아니므로 빌드 캐시 함정과 무관).

### P4a. 카카오 + 구글

1. **`profiles` 마이그레이션(다음 번호 — 0006·0007 은 사용됨, 위 불변 원칙 5 참조)** — 테이블 + **`drop trigger if exists`/`create trigger` set_updated_at**(초안은 updated_at 을 선언만 하고 트리거를 안 걸어 값이 고정됐다) + **실행 가능한 SQL 로 RLS**(초안은 주석이라 **RLS 꺼진 채 이메일이 담길 뻔했다**) + `comment on`.
   컬럼: `user_id` PK→auth.users cascade · `display_name` · `email` · `phone`(자기 신고, **키가 아니다**) · `phone_verified_at` · `age_verified_at`(만 14세) · `marketing_consent_at`(R10) · 타임스탬프.
   같은 파일에 **`create index if not exists orders_user_id_idx on public.orders (user_id) where user_id is not null;`** — '내 주문' 조회용 인덱스가 없다.
   **identities 테이블 불필요** — `auth.identities` 가 담는다.
2. `lib/auth-server.ts` — `@supabase/ssr` `createServerClient`(서버 전용 `SUPABASE_ANON_KEY` + 쿠키 어댑터) + `getSessionUser()`. ⚠ **`setAll` 을 try/catch 로 감쌀 것** — Server Component 렌더 중 `cookies().set()` 은 Next 가 금지해 throw 한다(표준 회피책). 브라우저 클라이언트는 만들지 않는다.
3. 라우트: `app/api/auth/signin/[provider]` · `callback`(`exchangeCodeForSession` → service_role 로 profiles upsert → 302) · `signout` · **`GET /api/auth/me`**(→ `{loggedIn, displayName, phone}`).
   ⚠ **`/api/auth/me` 는 선택이 아니라 필수다** — `Shell.tsx:1` 과 `checkout/page.tsx:1` 이 **둘 다 `"use client"`** 이고 Shell 소비자가 16곳이라 세션을 prop 으로 내릴 수 없다.
4. **진입점** (철칙 1 — 프리뷰 승인 후 병합):
   - **탑네비**: `Shell.tsx:136-146` 의 `.navIcons` 첫 번째 **`aria-label="계정"` 버튼이 이미 있다**(현재 `onClick={() => notify()}` 더미). **텍스트 링크를 옆에 붙이지 말고 이 더미를 로그인/마이로 배선**하는 것이 최소 변경이자 워크룸 문법 유지다(글자를 붙이면 아이콘 행이 깨지고 더미와 나란히 놓여 혼란).
   - ⚠ **로그인/로그아웃 링크는 plain `<a>` 여야 한다** — `LazyclubLink`(`:31-43`)는 `${useBasePath()}${href}` 로 감싸므로 브랜치 프리뷰에서 `/lazyday/api/auth/signin/kakao` 라는 없는 경로가 되고, `/api/*` 는 미들웨어 matcher 밖이라 구제되지 않는다.
   - **`/mypage` 라우팅**: 라우트는 `/lazyday/mypage` 에 두고, **`middleware.ts:72` 의 `LAZYCLUB_OPEN_PREFIXES` 에 `"/mypage"` 를 추가**하지 않으면 lazy-club.com 에서 `/lazyclub/mypage` 로 rewrite 되어 **404** 다. `docs/url-policy.md` §5 이력에 행 추가(슬러그 운영자 확정 완료). **`robots.ts` 에 `/mypage`·`/lazyday/mypage` disallow + 페이지 noindex**(결제 화면조차 제외한 관례).
   - **결제 페이지 분기**: 주문자 정보 위에 "로그인하고 계속 / 비회원으로 계속". **비회원 결제를 막지 않는다**(R11). ⚠ 프리필 우선순위를 **상태로 표현**할 것 — 현재 `editOrderer()`(`checkout/page.tsx:111-114`)는 `clearOrderer()`+`setPrefilled(false)` 뿐이라 profiles 프리필에는 아무 효과가 없다 → `prefillSrc: "stash"|"profile"|null` + '수정 뒤에는 다시 채우지 않는다' 플래그. 신청서 인계값(`lz-orderer`)이 있으면 그쪽 우선.
5. **user_id 스탬핑** — `/api/payment/prepare` 는 **원장에 쓰지 않는다**(주석이 "기록은 승인 확정 시 한 번"이라 명시). 실제 호출부는 **`app/api/lazyday/payment/confirm/route.ts:114`** 와 **`app/api/payment/toss-webhook/route.ts`** → `RecordOrderInput` 에 `userId?` 추가 후 이 두 곳에서 전달. 신청은 apply 라우트에서 세션이 있으면 전달.
   ⚠ **가상계좌는 스탬핑 불가** — 웹훅은 토스가 서버로 직접 부르므로 세션 쿠키가 없다. 그 주문은 `user_id`=null 로 남고 link-order 로만 회수된다 → `/mypage` 문구에 명시.
6. `app/(main)/lazyday/mypage/page.tsx` + `app/api/lazyday/mypage/*` — 내 주문·내 신청·주문 연결 폼. 서버 라우트가 세션→user_id 필터로 R13("본인은 자기 행만")을 강제.
   ⚠ **R3 한계**: link-order 는 `orders.orderer_phone`(주문자)로 매칭하므로 **대리 결제 건은 결제한 사람에게만 연결된다** — '내 주문/내 신청' 문구가 이를 오해시키지 않게.
7. `app/api/lazyday/mypage/link-order/route.ts` — orderNo+phone **둘 다 일치할 때만** user_id set(+같은 order_no 의 applications). **전화 단독 매칭 금지**(R11).
8. ⚠ **도메인이 갈리면 세션도 갈린다** — lazy-club.com 과 lazyday-bookclub.com 은 eTLD+1 이 달라 쿠키를 공유하지 못하는데 셸도 checkout 도 두 도메인에서 열린다. **계정(profiles)은 하나지만 로그인은 도메인별 1회**라는 한계를 운영자에게 사전 고지하고, 노선(회원을 북클럽 도메인 하나로 통일 vs 도메인별 독립 로그인)을 정해 DECISIONS 에 남긴다.
9. 검증: dev + localhost redirect 로 **실계정 카카오·구글 로그인 실측**(auth.users·auth.identities·profiles) → 프리필·스탬핑·link-order 4조합 → **두 도메인 각각 `/mypage` 200** → preview 스크린샷 승인 → 프로덕션 후 운영자 계정 1회.

### P4b. 네이버 (spike 게이트)

1. **dev spike(반나절)**: Supabase **Custom OAuth2 Provider**(2026-04 출시)에 네이버 등록(authorize/token/userinfo 3종) → 실로그인 → **userinfo 가 `{resultcode, message, response:{…}}` 로 중첩**된 것을 필드 매핑이 소화하는지 확인.
2. 성공 → provider 추가(콜백·profiles 공통) → 배포. 실패 → **폴백**(서버 수동 OAuth + `admin.generateLink`+`verifyOtp`, 이메일 미동의는 합성 이메일) **공수 재보고 후**.

---

## P5. Admin 상태 관리 (Stage B)

- 전제: P3 가동 후 2~4주 정합 확인 → **운영자 보고 + "시트 '진행 상태' 기입 중단" 합의 후에만.**
- PATCH(변경 이력 포함) + 드롭다운(미진행/미결제/결제완료/환불/탈락 ↔ received/unpaid/paid/refunded/rejected).
- 시트 헤더에 "→ admin 에서 관리" 메모(수동 1회). **역동기화 없음.** 반배정·비고는 Stage C(범위 밖).

---

## 운영자 대기 포인트

| 시점 | 내용 |
|---|---|
| ~~P0 직후~~ | ✔ 해소(2026-09-01) — 제6조 포함·즉시 시행 운영자 확정 |
| ~~P1 착수 전~~ | ✔ 해소(2026-09-01) — MCP 승인·실사용, dev·prod 스키마 대조 완료(전 컬럼 동일) |
| ~~P1 착수와 동시~~ | ✔ 안내 전달(2026-09-01 브리핑) — P4-0 준비물·약관 30일 리드타임. **운영자 실행은 진행 중** |
| ~~지금 (P2 착수 전)~~ | ✔ 해소(2026-09-01) — ① 보유기간 고지 문구는 **다른 세션이 정리 중**(운영자 "한 번에 할게") — 이 계획 범위 밖 ② 별건 결함은 **고치기로 확정, apply 반영 완료**(#557), written·review 는 P2 |
| P2.5 | **시트 새로고침 → 메뉴 → 트리거 켜기** + 스크립트 속성 `SITE_URL`·토큰 / 후기는 범위 밖 확인 |
| P3 | R13 감사 로그 생략 여부 판단 |
| P4-0 | 개발자 앱 등록 / 약관·방침 2차 개정 문구 / 만 14세 정책 / **공개 로그인 입구 노선 확인**(community-spec 과 충돌) |
| P4a | 도메인별 세션 노선 확정 · 프리뷰 스크린샷 승인 |
| P5 | "시트 '진행 상태' 기입 중단" 선언 |

## 실행 시작

**~~P0~~ → ~~P1~~ → ~~P2~~ → 🔜 P2.5 → P3 → P4a → (P4b) → P5**, 각 Phase 독립 PR. 위 '불변 원칙' 11개는 전 구간 적용.

⚠ Supabase MCP 게이트는 **2026-09-01 승인·실사용으로 해소** — 다만 마이그레이션이 있는 Phase(P2.5 의 admin 라우트는 무관, P4a 의 0006)는 세션마다 연결 여부를 다시 확인하고 끊겨 있으면 운영자에게 알리고 대기(불변 원칙 4).

⚠ 이 문서는 2026-09-01 시점의 코드를 근거로 쓰였다. 인용된 파일·줄 번호는 어긋날 수 있으니 **고치기 전 해당 파일을 직접 열어 확인**하고, 문서와 코드가 다르면 **코드를 믿고 문서를 고쳐 같은 PR 에 담는다**.
