# 고객관리 대시보드 — 구현 순서 (2026-09-02)

> 시안 확정: **통합안(C 기반 + A 상세 + B 표)** — `/lazyday/preview/admin-crm` (#578). 근거: `01-references.md`.
> 원칙: 각 PR 독립 배포 가능 · 시트가 정본인 값은 **읽기만** · 팔레트는 §9 레이지클럽 베이스 · 관리 호스트 `admin.lazy-club.com`.

| # | PR | 내용 | 상태 |
|---|---|---|---|
| CRM-1 | 고객 레코드 API | `lib/customers.ts` — applications·orders·profiles 를 **정규화 전화로 묶어** 사람 단위로. 단계는 DB 사실 + 스윕이 실어 온 시트 '진행 상태'에서 **파생(읽기)**. `GET /api/lazyday/admin/customers` 목록·상세. 리허설 `scripts/customers-test.mjs` | ✔ #579 |
| CRM-2 | 시트 상태 미러 | GAS 시간 스윕이 '진행 상태'·'인터뷰 상태'를 **매번**(보정된 행도) 실어 보내고 backfill 라우트가 `applications.status` 를 갱신 — 정본은 시트 그대로, DB 는 읽기용 거울. 0012 거울 컬럼(원문 3 + synced_at) · GAS `syncProgressToDb()` · `/api/lazyday/admin/sync-status`. 한 PR — GAS 가 먼저 떠도 라우트 404 를 로깅만 하고 보정엔 영향 없음 | ✔ #580 (GAS 배포 success) |
| CRM-3 | 관리 셸 + 고객 | `/admin` 새 홈 셸(좌 내비 6: 홈·고객·접수·주문·일정·도구) + **고객 표(기수별 그룹) + 우측 패널 + 3열 레코드 페이지** — CRM-1 데이터로. 기존 4화면은 내비의 접수·일정·도구로 그대로 링크. **차단 달력은 `/admin/schedule` 로 이동** | ✔ #581 |
| CRM-4 | 홈 = 파이프라인 + 오늘 할 일 | 기수 칸반(읽기) + 오늘 할 일 **8종**: 인터뷰 예정 · 합격 후 미결제 · 결제만 하고 신청서 미제출 · 시트 기록 실패 · 중복 · **인터뷰 완료 3일 경과 결과 미기록** · **모임 D-1 안내 대상** · **회원 만 14세 미확인**(P4 약관과 함께). `lib/admin-today.ts` + `/api/lazyday/admin/today`, 칸반은 고객 목록에서 클라이언트 파생 | ✔ #582 |
| CRM-5 | 활동 남기기 | 메모(=triage_note 확장 or 별도 표)·통화·문자 기록 — 개인정보 컬럼이면 **파기 함수 2종 같은 PR**(CLAUDE.md §4) | 대기 |
| CRM-6 | 주문 탭 · 접수를 셸 안으로 | `/admin/orders`(orders 원장 표, 읽기) + `/api/lazyday/admin/orders` · 접수 원장 페이지를 `AdminShell` 안에(`.embedded`). 일정(달력 흡수)·상태 점검·흐름 테스트의 셸 편입은 CRM-7 | 진행 |
| CRM-7 | 일정 · 도구 셸 편입 | 차단 달력(`/admin/schedule`)·상태 점검·흐름 테스트를 셸 안으로 — 각자 CSS 가 화면 전체 배경을 가져 `.embedded` 같은 변형 필요 | 대기 |
| — | 관리자 인증 교체 | 소셜 로그인 + 허용 이메일 (R13 사람별 식별). GAS `ADMIN_TOKEN` 계약 함께 | CRM-3 전후 |
| — | P5 | 시트 '진행 상태' 기입 중단 합의 → 칸반 드래그(쓰기) 개통 | 운영자 합의 후 |

## 데이터 원칙 (CRM-1 에서 못 박은 것)
- **고객 표를 새로 만들지 않는다.** 사람은 조회 시점의 파생 — 세 원장이 각자 정본이다.
- 묶는 열쇠는 `normalizePhone()`. 전화 없는 행(후기·파기됨)은 단독 행. 회원 프로필은 접수·주문에 붙은 `user_id` 로 먼저 잇고, 남는 회원만 따로 한 사람.
- 단계 우선순위: 시트 '진행 상태' > 인터뷰 접수 행(전화 예약 시각으로 예정/완료 판정, 서면 제출=완료) > DB status. 주문 원장에 북클럽 결제가 있으면 최소 `paid`.
- 플래그: `gas_failed`(DB 만 있음) · `unsubmitted`(결제 후 신청서 미제출) · `dup`(같은 기수 2건, 분류 안 됨) · `purged`.
- 분류로 뺀 접수(test·typo·dummy·duplicate)는 사람을 만들지 않는다.
