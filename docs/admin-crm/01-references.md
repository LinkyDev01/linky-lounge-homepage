# 고객관리 대시보드 — 레퍼런스 노트 (2026-09-02)

> 운영자 지시: "어드민페이지는 고객관리에 최적화된 대시보드 형태. 무근본이 아니라 레퍼런스 사이트 또는
> 고객관리솔루션 기반 레퍼런스를 참고." 계열은 **CRM형(HubSpot · Attio)** 확정 (DECISIONS 2026-09-02).
> 이 문서는 시안이 무엇을 어디서 가져왔는지의 **근거 대장**이다. 시안: `/lazyday/preview/admin-crm`.

## 1. 레퍼런스에서 가져오는 문법 (출처 링크)

| 문법 | HubSpot | Attio | 우리 시안 |
|---|---|---|---|
| **레코드 3열** — 좌 속성 카드 / 중 활동 타임라인(탭) / 우 연관 객체 카드 "Deals (6)" | [Understand and use the record page layout](https://knowledge.hubspot.com/records/work-with-records) | [Create and view records](https://attio.com/help/reference/managing-your-data/records/create-and-view-records) — 좌 속성 패널·중앙 Overview/Activity 탭·우 Lists 요약 | A안 고객 상세 · C안 카드 상세 |
| **활동 타임라인** — 시간순, 다가오는 일정이 위, 유형별 필터(메모·통화·문자·접수·주문), 상단에 '메모·통화·문자 남기기' 버튼 | 〃 (Activities 탭, "upcoming activities at the top") | 〃 (Activity 탭, 이벤트 유형 토글) | 세 안 공통 `Timeline` |
| **리스트 = 오브젝트 위의 워크플로 층** — 사람 레코드는 하나, 기수마다 리스트 엔트리(단계는 엔트리에 붙는다) | 연락처 ↔ 딜 연관 | [Understanding lists](https://attio.com/help/reference/attio-101/attios-data-model/understanding-lists) — "list attribute values live on the list entry (e.g. Applying for)" | **고객은 한 사람, 기수(3기·4기)는 파이프라인 엔트리** — 같은 사람이 3기·4기에 각각 단계를 가진다 |
| **테이블 뷰** — 열 선택·정렬·필터·그룹, 저장 뷰 | 인덱스 페이지 저장 뷰·필터 | [Filter and sort views](https://attio.com/help/reference/workspace/views) · [Define objects, lists, views](https://attio.com/help/reference/attio-101/attios-data-model/define-your-data-model-objects-lists-and-views) | B안 고객 테이블(기수별 그룹) · A안 저장 뷰 탭 |
| **칸반 파이프라인** — 열 = 단계 속성, 카드 = 이름+선택 속성, 열 상단 건수, 드래그로 단계 이동, 단계 체류 시간 | Deals 보드 | [Create and manage kanban views](https://attio.com/help/reference/managing-your-data/views/create-and-manage-kanban-views) | C안 홈 · A/B 의 '파이프라인' 탭 |
| **슬라이드 패널 상세** — 목록을 떠나지 않고 우측 패널로 레코드를 본다 | 레코드 미리보기(Preview) | 레코드 미리보기 사이드 패널 | B안 |

## 2. 우리 데이터에 대응

| 레퍼런스 개념 | 우리 것 | 정본 |
|---|---|---|
| 사람(People) 레코드 | **고객** = 전화번호(정규화)로 묶인 접수·주문·회원 행. 지금은 표가 없다 — 서버에서 `applications`·`orders`·`profiles` 를 전화로 합쳐 만든다 | 각 원장 |
| 리스트(파이프라인) | **기수**(3기·4기) — 엔트리 단계: 접수 → 인터뷰 예정 → 인터뷰 완료 → 합격·미결제 → 결제 완료 → 참가 중 / 보류 · 탈락 | ⚠ **진행 상태의 정본은 구글 시트**(계획서 P5 게이트) — 시안에선 읽기만, 드래그 이동은 P5 뒤 |
| 연관 객체 | 주문(orders) · 접수(applications) · 인터뷰(GAS 캘린더) | 각 원장 |
| 활동 | 접수·결제·인터뷰 예약·운영 메모(`triage_note`)·통화·문자 | 메모만 DB, 통화·문자는 시안 단계 가정 |
| 오늘 할 일 | 오늘 인터뷰 · 합격 후 미결제 · 결제했는데 신청서 미제출(`orders.application_submitted_at` null) · GAS 실패 행 | 파생 |

## 3. 지키는 것

- **팔레트·타이포는 2026-09-01 "레이지클럽 베이스"(§9)** — 백지+잉크·13.2px/1.5·괘선·텍스트 링크. 레퍼런스에서 가져오는 건 **정보 구조와 화면 문법**이지 색·장식이 아니다.
- 유채색 UI 0 — 단계·경고는 굵기·괘선·위치로.
- 시트가 정본인 값을 **고치는 UI 는 두지 않는다**(P5 게이트). 시안의 드래그·상태 변경은 '어떻게 될지'를 보여주는 자리다.
