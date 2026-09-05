# Supabase 운용 기준 — 레이지데이 / 레이지클럽

> **이 문서가 스키마의 정본 절차다.** 규칙(R1~R13)과 ERD v3 의 원문은
> `/lazyday/preview/commerce-journey` 에 있다. 여기는 "그걸 어떻게 굴리는가".

---

## 1. 왜 DB 가 필요했나 (한 문단)

주문 기록이 구글 시트에만, 그것도 **신청서를 제출해야만** 남았다. 결제는 승인됐는데
신청 폼에서 이탈한 손님은 우리 쪽 기록이 0이고 토스 상점관리자에만 존재했다.
동시에 서버는 주문 원장이 없어 **카탈로그 가격으로 금액을 매번 재계산**했기 때문에,
가격을 한 번 바꾸면 그 이전 주문의 금액 근거가 소급 변조됐다.
`orders` 원장은 이 두 가지를 동시에 끝낸다.

## 2. 확정된 여섯 가지 결정 (2026-08-18)

되돌리기 어려운 것들이라 **테이블을 만들기 전에** 못박았다. 바꾸려면 운영자 지시가 있어야 한다.

| # | 결정 | 판단기준 | 강제되는 곳 |
|---|---|---|---|
| 1 | **보존기간이 다르면 테이블을 나눈다** | "이 값이 5년 남아야 할 법정 근거가 있나?" | `orders`·`order_items`(5년) ↔ `participants`(모임 종료 후 1년) |
| 2 | **금액·상품명은 주문 시점 스냅샷** | "주문 한 행만 보고 조인 없이 당시 금액이 완결되는가?" | `order_items.unit_price` / `name_snapshot` |
| 3 | **`order_no` 는 결제사 orderId 원문, 발급 후 불변** | "금액의 진실원이 어디인가?" — DB 도입 후엔 DB | `orders.order_no` unique. 구형 `lz-…`/`oneday-…` 도 그대로 들어와 호환이 끊기지 않는다 |
| 4 | **전화번호는 키가 아니다** | "번호가 바뀌어도 같은 사람이라 답해야 하는가?" → 예 | PK 는 uuid. 전화는 숫자만 정규화한 조회용 속성 + 인덱스 |
| 5 | **RLS 전면 거부 — 정책을 만들지 않는다** | "anon 키로 할 수 있는 일이 0인가?" | 전 테이블 `enable`+`force` RLS, 정책 0개, anon·authenticated 권한 회수. 접근은 서버 라우트(service_role)만 |
| 6 | **마이그레이션 파일 + dev/prod 분리** | "지금 스키마가 왜 이 모양인지 파일 순서로 재생되는가?" | `supabase/migrations/<timestamp>_<name>.sql` |

## 3. 운영자가 해야 할 일 (딱 두 가지)

### ① Supabase 프로젝트 — ✔ 완료 (2026-08-18, MCP 로 생성·적용)

| 이름 | ref | 용도 | 상태 |
|---|---|---|---|
| `lazyday-dev` | `kfqtzxxtwokouvoqpebq` | 마이그레이션 선적용·검증 | 마이그레이션 2건 적용, 스모크 통과 |
| `lazyday-prod` | `qdxnxdfebkgoxeqzfmji` | 실제 손님 주문 원장 | 마이그레이션 2건 적용, 테이블 4개 · 행 0 |

둘 다 서울(ap-northeast-2)·무료. 같은 조직에 5월에 만든 구 프로젝트(INACTIVE, 도쿄)가
하나 더 있는데 이 체계와 무관하다 — 삭제 여부는 운영자 판단.
⚠ 다른 Supabase 계정(조직 wacnihxjkusgpxgsfupw)에 같은 이름의 lazyday-prod 가 하나
만들어졌다가 계정을 바꾸며 버려졌다 — 그 계정 대시보드에서 지우면 된다 (빈 프로젝트).

### ② Vercel 에 환경변수 2개 넣기 — ✔ 완료 (2026-08-26, 운영자)

Vercel → 프로젝트 `linky-lounge-homepage` → Settings → Environment Variables.

| 이름 | 값 | 넣을 환경 |
|---|---|---|
| `SUPABASE_URL` | `https://qdxnxdfebkgoxeqzfmji.supabase.co` (prod) | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 대시보드 → lazyday-prod → Project Settings → API → **service_role** (secret) | Production |
| (선택) 같은 두 변수 | dev 값: `https://kfqtzxxtwokouvoqpebq.supabase.co` + lazyday-dev 의 service_role | Preview |

service_role 키는 대시보드에서만 복사할 수 있다 (MCP 는 secret 키를 주지 않는다 — 의도된 제한).

> ⚠ **`NEXT_PUBLIC_` 을 붙이지 않는다.** 붙이면 Next 가 이 키를 브라우저 번들에
> 인라인하고, service_role 키는 RLS 를 통째로 우회한다. 즉 DB 전체가 공개된다.

**이 두 변수가 없으면 원장 기록은 조용히 꺼진 채 결제·신청이 종전대로 동작한다.**
그래서 순서를 틀려도 사고가 나지 않는다 — 먼저 넣든 나중에 넣든 상관없다.
⚠ 환경변수는 **넣은 뒤의 새 배포부터** 적용된다 — 넣기만 하고 재배포가 없으면 여전히 꺼진 채다.

## 4. 마이그레이션 적용

```bash
# dev 에 먼저
psql "postgres://postgres:<비밀번호>@db.<dev-ref>.supabase.co:5432/postgres" \
  -v ON_ERROR_STOP=1 -f supabase/migrations/20260818090000_core_orders.sql

# 확인 후 prod 에 같은 명령 (<prod-ref> 로만 바꿔서)
```

Supabase 대시보드의 **SQL Editor** 에 파일 내용을 붙여 넣고 Run 해도 결과는 같다.

**규칙**: 파일은 append-only. 이미 적용한 마이그레이션을 고치지 않는다 — 새 파일을 추가한다.
파일명은 `YYYYMMDDHHMMSS_이름.sql` (시각 순으로 적용된다).

### 적용된 마이그레이션

| 파일 | 내용 | dev | prod |
|---|---|---|---|
| `20260818090000_core_orders.sql` | orders · order_items · order_shipping · participants + RLS + R9 파기 함수 | ✔ | ✔ |
| `20260818120000_harden_functions.sql` | 파기 함수 EXECUTE 를 service_role 만으로 회수 + set_updated_at search_path 고정 (dev 어드바이저 지적) | ✔ | ✔ |
| `20260818150000_r9_purge_schedule.sql` | pg_cron 으로 R9 파기 매일 자동 실행 (03:30 KST) | ✔ | ✔ (2026-08-26) |
| `20260826060000_funnel_events.sql` | 퍼널 계측 — 유입 출처별 결제시작/제출 집계. 개인정보 0, event_id 멱등, RLS 거부 | ✔ | ✔ |
| `20260901093000_applications.sql` | 접수 원장(applications) — 시트 단일 저장의 이중화. sid 멱등, purge_after NOT NULL, R9 파기 2종(정기·단건) + pg_cron, RLS 거부 | ✔ | ✔ (2026-09-01) |
| `20260901140000_applications_marketing_retention.sql` | 마케팅 수신 동의자의 이름·전화는 파기에서 제외(동의 철회 시까지) + 철회 함수. 신청서 본문은 종전대로 종료+1년 파기 | ✔ | ✔ (2026-09-01) |
| `20260901180000_funnel_content_name.sql` | funnel_events 에 `content_name` — 북클럽 신청서와 원데이 결제가 둘 다 'Lead' 로 섞이던 것을 갈라낸다. 과거 행은 null(소급 불가) | ✔ | ✔ (2026-09-01) |
| `20260901203000_applications_triage.sql` | 접수 분류(triage·triage_note·triaged_at) + 부분 인덱스(`where triage is null`). **파기가 아니라 열람 필터** — 테스트·더미가 진짜 접수를 가리지 않게. 진행 상태(시트 정본)와 섞지 않는다 | ✔ | ✔ (2026-09-01) |
| `20260901213000_triage_paid_comment.sql` | 주석만 정정 — 분류 중 **목록에서 빠지는 건 test·typo·dummy·duplicate 넷뿐**이고 `paid`(기결제자)는 표시만 하고 남는다(운영자 정정). 컬럼·인덱스·데이터 무변경 | ✔ | ✔ (2026-09-01) |
| `20260902093000_purge_triage_note.sql` | 파기 함수 2종이 **운영 메모(`triage_note`)도 비우게** 한다 — 0008 이 함수보다 나중에 그 컬럼을 만들어 파기해도 메모만 남았다(dev 실측). 마케팅 동의 예외는 이름·전화에만 걸리므로 메모는 동의와 무관하게 비운다. 분류(`triage`)는 남긴다 | ✔ | ✔ (2026-09-02) |
| `20260902120000_profiles.sql` | 회원 원장(profiles) — 소셜 로그인 계정(auth.users)의 우리 쪽 행. PK=auth.users.id **cascade**(탈퇴=파기), 전화는 키가 아님, 만 14세·마케팅 동의는 시각으로. RLS 전면 거부 — 본인 행도 서버 라우트(service_role)만 읽는다. + `orders`·`applications` 의 `user_id` 부분 인덱스 2개 | ✔ | ✔ (2026-09-02) |
| `20260902150000_applications_sheet_mirror.sql` | 접수 원장에 시트 '진행 상태'·'인터뷰 상태'·'인터뷰 방식' **읽기 거울** 4컬럼(원문 3 + synced_at). GAS 스윕이 매시 비추고 `status` 는 번역해 읽기용으로만 갱신 — **정본은 여전히 시트**(P5 전). 개인정보 아님 → 파기 함수 무변경 | ✔ | ✔ (2026-09-02) |
| `20260902183000_customer_activities.sql` | 사람 단위 활동 기록(메모·통화·문자, CRM-5). ⚠ **개인정보가 들어가는 자리라 파기 2종을 같은 파일에서** — 새 함수 `purge_expired_customer_activities()`(정기, 기존 cron 잡이 접수와 함께 부르게 갱신) + `purge_application` 을 **`(uuid, text)` 로 교체**(옛 1인자 함수는 `drop` — 오버로드로 남기면 라우트가 옛 시그니처를 불러 활동이 영영 안 지워진다). 적용 순서는 **마이그레이션 먼저, 코드 배포 나중** | ✔ | ✔ (2026-09-02) |
| `20260902210000_profiles_avatar.sql` | 회원 프로필 사진 URL(`profiles.avatar_url`). **파일이 아니라 주소만** 담는다 — 보관·파기 대상을 늘리지 않고, 소셜에서 사진을 바꾸면 그대로 따라간다. ⚠ **파기 함수 무변경**: `profiles` 는 PK 가 `auth.users.id` cascade 라 탈퇴가 곧 파기다(0011). dev 실증 완료 | ✔ | ✔ (2026-09-02) |
| `20260905090000_bookclub_class_assignments.sql` | 북클럽 반배정(고객 공유용 `/classes`) 원장 — 한 행 = 반\|이름, 순서 보존. **레포가 public 이라 명단은 DB 에만**(시드는 SQL 로 직접). 이름 파기 함수 + 기존 cron 잡이 세 함수 호출. RLS 거부 | ✔ | ✔ (2026-09-05) |

## 5. 운영 조회

```sql
-- 유입 출처별 퍼널: 결제 시작 → 신청서(Lead) → 인터뷰 확정 (2026-08-26)
select coalesce(traffic_src, '(미상)') as 출처,
       count(*) filter (where event_name = 'InitiateCheckout')     as 결제시작,
       count(*) filter (where event_name = 'Lead')                 as 신청서,
       count(*) filter (where event_name = 'CompleteRegistration') as 인터뷰확정,
       round(100.0 * count(*) filter (where event_name = 'CompleteRegistration')
             / nullif(count(*) filter (where event_name = 'InitiateCheckout'), 0), 1) as 전환율_pct
  from funnel_events
 where occurred_at >= now() - interval '30 days'
 group by 1 order by 결제시작 desc;

-- 결제는 됐는데 신청서를 안 낸 손님 (재진입 링크를 보내야 할 대상)
select order_no, orderer_name, orderer_phone, approved_at, amount_total
  from orders
 where application_submitted_at is null
 order by approved_at desc;

-- 어떤 주문의 실제 결제 내역 (카탈로그가 바뀌어도 이 값은 그대로다)
select i.name_snapshot, i.kind, i.unit_price
  from order_items i join orders o on o.id = i.order_id
 where o.order_no = 'lz-...';

-- R9 파기 — pg_cron 이 매일 03:30 KST 자동 실행한다 (0003). 수동으로 당길 때만:
select purge_expired_participants();
```

재진입 링크: `https://www.lazyday-bookclub.com/checkout/success?orderId=<order_no>&reentry=1`
(구 주소 `/one-day-talk-01/checkout/success` 도 301 로 살아 있다 — 2026-09-01 이전)

## 6. 하지 말 것

- **`NEXT_PUBLIC_SUPABASE_*` 로 브라우저에서 직접 붙기.** 결정 5 를 무효화한다.
  브라우저용 supabase-js 클라이언트는 만들지 않는다 — 서버 라우트를 거친다.
- **RLS 정책 추가.** `create policy ... with check (true)` 는 anon 키가 브라우저에
  실린다는 사실 때문에 "누구나 무제한 INSERT" 를 뜻한다. (구 `schema.sql` 의 실제 내용이었고,
  로컬 재현에서 anon 이 그대로 두 행을 넣었다.)
- **적용된 마이그레이션 수정.** 새 파일을 추가한다.
- **`participants` 를 `orders` 에 합치기.** 보존기간이 달라서 뗀 것이다 (R9).
  합치면 5년 보존과 1년 파기가 한 행에서 충돌해 어느 쪽도 못 지킨다.

## 7. 제거된 것들 (2026-08-18)

2026-07-23 대량 임포트(#100)에 딸려 온 미배선 초안 3종을 정리했다. git 이력에 남아 있다.

| 파일 | 왜 지웠나 |
|---|---|
| `supabase/schema.sql` | 어떤 프로젝트에도 적용된 적 없음. 보존기간 개념 없음, `with check (true)`, FK 부재, 없는 `job` 컬럼 — 이 migrations 가 대체 |
| `lib/supabase.ts` | 소비자 0. 브라우저용 anon 클라이언트라 결정 5 와 충돌 |
| `gas/supabase-migrate-existing.gs` | 미실행. service_role 키를 소스에 평문으로 넣게 설계됨 + 대상 스키마가 폐기됨. (`gas/project.json` 매핑에 없어 실배포와 무관했다) |
