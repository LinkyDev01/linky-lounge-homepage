-- ============================================================================
-- 0011 · 회원 원장 (profiles) — 소셜 로그인 계정의 우리 쪽 행
-- ============================================================================
-- 정본 설계·규칙 원문: /lazyday/preview/commerce-journey (R10·R11·R13)
-- 실행 계획: docs/plans/2026-09-01-applications-ledger-and-members.md (P4a)
--
-- 이 마이그레이션이 여는 것:
--   · 카카오·구글 로그인(Supabase Auth)으로 만들어지는 auth.users 행에 대응하는
--     **우리 쪽 회원 행**. 이름·연락처·동의 시각처럼 auth 가 담지 않는 값을 담는다.
--   · 레이지클럽 ⊃ 레이지데이 북클럽 **공통 회원 원장** — 계정은 하나다
--     (운영자 2026-09-02 브랜드 위계 확정). 소속·기수는 여기 두지 않는다.
--
-- 이 파일이 지키는 결정:
--   1. **PK = auth.users.id (cascade).** 별도 대리키를 두지 않는다 — auth 행이
--      지워지면(회원 탈퇴) 이 행도 함께 사라져야 개인정보가 남지 않는다.
--      identities(어느 소셜로 들어왔나)는 auth.identities 가 담으므로 표를 만들지 않는다.
--   2. **전화는 키가 아니다** (0001 결정 4 와 같다). 자기 신고값이고 검증 시각을 따로 둔다.
--      주문·신청과의 연결은 R11 대로 **주문번호+전화 둘 다 일치**할 때만, 라우트가 한다.
--   3. **마케팅 동의는 시각으로 남긴다** (R10). 철회 = 그 필드만 null.
--   4. **만 14세 확인 시각** — 소셜 로그인은 나이를 묻지 않으므로(법 제22조의2)
--      첫 로그인 뒤 우리 화면에서 확인받은 시각을 남긴다. null = 아직 확인 전.
--   5. **RLS 전면 거부** — 정책 0개. enable + force + revoke (결정 5 · R13).
--      로그인한 본인의 행이라도 브라우저에서 직접 읽게 하지 않는다 — 읽기·쓰기는
--      전부 서버 라우트(service_role)가 세션을 확인한 뒤 한다. "본인은 자기 행만"은
--      정책이 아니라 라우트의 user_id 필터로 강제한다 (`/api/auth/me` 등).
--      ⚠ Supabase 어드바이저 INFO 가 1건 늘지만 의도된 상태다 (supabase/README.md §6).
--   6. **파기 함수를 두지 않는다.** applications 는 행을 남기고 비우지만(대조 때문)
--      회원은 계정 삭제 = auth.users delete = cascade 가 곧 파기다. 보유기간 규율은
--      개인정보처리방침 제3조(회원 탈퇴 시 지체 없이)를 따른다.
--      ⚠ 단, 이 표에 **개인정보 컬럼을 늘릴 때** 탈퇴 경로가 cascade 하나뿐인지 다시
--      확인할 것 — 다른 표로 복사해 두는 순간 그 표의 파기 규율이 필요해진다.
--
-- 함께 넣는 인덱스: '내 주문'·'내 신청' 조회용 부분 인덱스 2개.
--   user_id 는 0001·0005 부터 있었지만(nullable, R11) 인덱스가 없었다 — 비회원 행이
--   대부분이라 `where user_id is not null` 부분 인덱스가 맞다.
-- ============================================================================

create table if not exists public.profiles (
  user_id               uuid        primary key references auth.users(id) on delete cascade,

  display_name          text,                 -- 소셜 프로필 이름을 첫 로그인 때 복사, 이후 본인이 수정
  email                 text,                 -- auth.users.email 사본 (조회 편의 — 정본은 auth)
  phone                 text,                 -- 숫자만 정규화 (01012345678). 자기 신고, 키가 아니다 (결정 2)
  phone_verified_at     timestamptz,          -- 전화 인증을 붙이기 전까지 null
  age_verified_at       timestamptz,          -- 만 14세 이상 확인 시각 (결정 4)
  marketing_consent_at  timestamptz,          -- R10 · 동의 시각. 철회 = null

  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

comment on table  public.profiles is '회원 원장 — 레이지클럽·북클럽 공통 계정(auth.users)의 우리 쪽 행. PK=auth.users.id cascade, 탈퇴=cascade 파기. RLS 전면 거부 — 본인 행도 서버 라우트만 읽는다 (R13)';
comment on column public.profiles.user_id              is 'auth.users.id — 대리키 없음. auth 행 삭제 시 함께 삭제';
comment on column public.profiles.display_name         is '첫 로그인 때 소셜 프로필 이름 복사, 이후 본인 수정';
comment on column public.profiles.email                is 'auth.users.email 사본 — 정본은 auth. 조회 편의';
comment on column public.profiles.phone                is '자기 신고 전화(숫자만). 키가 아니다 — 주문 연결은 R11(주문번호+전화 둘 다 일치)';
comment on column public.profiles.phone_verified_at    is '전화 인증 시각. 인증을 붙이기 전까지 null';
comment on column public.profiles.age_verified_at      is '만 14세 이상 확인 시각 — 소셜 로그인은 나이를 묻지 않아 우리 화면에서 확인(법 제22조의2)';
comment on column public.profiles.marketing_consent_at is 'R10 · 마케팅 수신 동의 시각. 철회 시 이 필드만 null';

-- RLS 전면 거부 (결정 5)
alter table public.profiles enable row level security;
alter table public.profiles force  row level security;
revoke all on public.profiles from anon, authenticated;

-- '내 주문'·'내 신청' 조회용 — 비회원 행이 대부분이라 부분 인덱스
create index if not exists orders_user_id_idx       on public.orders       (user_id) where user_id is not null;
create index if not exists applications_user_id_idx on public.applications (user_id) where user_id is not null;
