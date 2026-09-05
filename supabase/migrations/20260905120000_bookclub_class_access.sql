-- 0016 · 반배정 열람 암호를 DB 로 (2026-09-05, 0015 후속)
--
-- 왜 env 가 아닌가
--   0015 는 암호를 `BOOKCLUB_CLASSES_PASSWORD` env 에 뒀다. 안전하긴 한데 **운영자가 Vercel 에
--   넣고 재배포해야 페이지가 열린다** — 운영자는 "바로 배포"를 원했고, 암호를 바꿀 때마다
--   같은 절차를 반복해야 한다. 암호는 명단과 같은 성격의 운영 데이터라 명단 옆에 두는 편이 낫다.
--   (레포가 public 이라 코드에 못 적는 사정은 그대로 — DB 는 그 조건을 이미 만족한다.)
--
-- 왜 해시인가
--   원문을 담으면 DB 를 읽을 수 있는 모든 경로(대시보드·백업·로그)에 암호가 그대로 보인다.
--   비교는 서버가 sha256 으로 하므로 원문을 보관할 이유가 없다.
--   ⚠ 솔트 없는 sha256 이다 — 이건 **계정 비밀번호가 아니라 공유 열람 암호**이고(전원 같은 값,
--   유출돼도 얻는 것은 이 페이지 하나), 사전 공격을 막는 것이 목적이 아니라 '평문 보관 안 함'이 목적이다.
--   계정 비밀번호였다면 bcrypt·per-user salt 가 맞다.
--
-- 대소문자 무관(운영자 "대문자/소문자 모두 가능하게")은 **앱이 정규화**한다 — trim + 대문자로
-- 맞춘 뒤 해시한다. DB 는 이미 정규화된 값의 해시만 안다.

create table if not exists public.bookclub_class_access (
  cohort        text primary key,            -- "4기" — bookclub_class_assignments.cohort 와 같은 표기
  password_hash text not null,               -- sha256(대문자·trim 정규화된 암호) hex
  updated_at    timestamptz not null default now()
);

comment on table public.bookclub_class_access is
  '반배정 열람 암호 — 기수당 하나. 개인정보 아님(파기 대상 아님). 코드·레포에 적지 않으려고 DB 에 둔다 (2026-09-05)';
comment on column public.bookclub_class_access.password_hash is
  'sha256(trim+대문자 정규화된 암호) hex. 공유 열람 암호라 솔트 없음 — 계정 비밀번호가 아니다';

-- RLS 전면 거부 (결정 5) — 서버 라우트(service_role)만 읽는다
alter table public.bookclub_class_access enable row level security;
alter table public.bookclub_class_access force  row level security;
revoke all on public.bookclub_class_access from anon, authenticated;

-- ⚠ 암호 값 자체는 이 파일에 넣지 않는다 (레포가 public). 시드는 SQL 로 직접.
