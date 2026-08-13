# GAS 자동 편집·배포 (Apps Script 연동)

> 2026-08-13 신설. CLAUDE.md §6 의 수작업 절차 —
> "레포 수정 → 운영자가 편집기에 붙여넣기 → 배포 관리 → 기존 배포 편집 → 새 버전" —
> 을 API 로 자동화한다. **설정을 마치면 `gas/` 변경을 main 에 병합하는 것만으로 실배포가 갱신된다.**

---

## 1. 무엇이 자동화되나

| 단계 | 전 | 후 |
|---|---|---|
| 코드 반영 | 운영자가 전문 복사 → 편집기 붙여넣기 | main 병합 시 자동 (`projects.updateContent`) |
| 배포 | 배포 관리 → 기존 배포 편집 → 새 버전 | 자동 (`versions.create` + `deployments.update`) |
| 실배포본 ↔ 레포 대조 | 불가 (§6 "실배포본이 미러보다 최신일 수 있다") | `check` 명령 + 주 1회 자동 점검 |
| 되돌리기 | 편집기에서 수동 | `rollback <버전번호>` |

**바뀌지 않는 것**: 스크립트 속성(ADMIN_TOKEN·SOLAPI_KEY/SEC)은 코드가 아니라 프로젝트 속성이라
이 경로로 오가지 않는다. 시트·캘린더 데이터도 마찬가지. 이 파이프라인이 다루는 건 **소스와 배포**뿐이다.

---

## 2. 최초 설정 (운영자 1회)

### ① Apps Script API 켜기
<https://script.google.com/home/usersettings> → "Google Apps Script API" **사용** 으로.
스크립트 **소유 계정**(linkyincdev)으로 로그인한 상태에서 해야 한다. 이걸 안 켜면 모든 호출이 403.

### ② 리프레시 토큰 발급 (로컬 PC에서)
```bash
node scripts/gas-sync.mjs auth --account linkyincdev@gmail.com
```
브라우저가 열리는 PC에서 실행한다. 출력된 URL 을 소유 계정으로 승인하면 터미널에 리프레시 토큰이 찍힌다.

- `--account` 는 계정 선택 화면을 미리 좁히는 힌트다. **스크립트 소유 계정이 아닌 계정으로 승인하면**
  권한이 없어 나중에 404 로 실패하므로, 승인 화면의 계정을 반드시 눈으로 확인할 것.
- "Google에서 확인하지 않은 앱" 경고는 정상 — clasp 의 클라이언트다. 고급 → 이동으로 진행한다.

- 요청 권한은 **두 개뿐**이다 — `script.projects`(소스), `script.deployments`(배포).
  clasp 기본 로그인은 `cloud-platform` 까지 10종을 한꺼번에 받아 두는데, 토큰이 새면 피해가 그만큼 넓다.
- **토큰은 채팅·이슈·커밋에 붙여넣지 말 것.** 아래 ③에서 GitHub 화면에 직접 입력한다.
- 브라우저를 못 여는 환경(원격 세션)이라면 `auth-url` → `auth-exchange <코드>` 두 단계로 나눠 쓴다.

### ③ GitHub Secrets 등록
Settings → Secrets and variables → Actions → New repository secret

| 이름 | 값 |
|---|---|
| `GAS_SCRIPT_ID` | Apps Script 프로젝트 ID (편집기 URL `script.google.com/d/<이 부분>/edit`) |
| `GAS_REFRESH_TOKEN` | ②에서 받은 값 |
| `GAS_WEBAPP_URL` | Vercel `INTERVIEW_GAS_URL` 과 같은 값. 배포 ID 추출 + 배포 후 스모크 테스트에 쓴다 |

`GAS_CLIENT_ID`/`GAS_CLIENT_SECRET` 은 자체 GCP OAuth 클라이언트를 쓸 때만 추가한다(선택).
기본값은 clasp 가 공개 배포물에 담아 둔 데스크톱 클라이언트다 — 데스크톱 클라이언트의 secret 은
설계상 비밀이 아니고(RFC 8252), 이미 '게시됨' 상태라 **리프레시 토큰이 7일 만에 만료되지 않는다**
(직접 만든 클라이언트를 '테스트' 상태로 두면 7일마다 끊긴다 — 흔한 함정).

### ④ 최초 1회 드리프트 해소
지금 실배포본과 레포 미러는 **주석 2군데**가 다르다(기능 동일 — 2026-08-13 실측).
따라서 첫 배포는 기준선 검사에 걸린다. 둘 중 하나를 고른다.

- 레포가 맞다(권장) → Actions 에서 `mode: deploy` 수동 실행. 걸리면 로컬에서 `--allow-drift` 로 1회 밀어 넣는다.
- 실배포가 맞다 → `node scripts/gas-sync.mjs pull` 후 커밋. 이후로는 자동으로 맞물린다.

---

## 3. 평소 사용

### 자동 (권장)
`gas/` 아래를 고쳐 main 에 병합하면 `.github/workflows/gas-deploy.yml` 이 알아서 배포한다.
Actions 탭에서 결과를 본다.

### 수동
Actions → **GAS 배포** → Run workflow → `check`(대조만) / `deploy`(배포).

### 로컬
```bash
export GAS_SCRIPT_ID=... GAS_REFRESH_TOKEN=... GAS_WEBAPP_URL=...

node scripts/gas-sync.mjs status    # 배포·버전·드리프트 현황
node scripts/gas-sync.mjs check     # 실배포 ↔ 레포 diff (다르면 exit 1)
node scripts/gas-sync.mjs pull      # 실배포 → 레포 (편집기 직접 수정분 회수)
node scripts/gas-sync.mjs deploy    # 레포 → 실배포 + 새 버전 + 기존 배포 갱신 + 검증
node scripts/gas-sync.mjs rollback 41
```
모든 쓰기 명령은 `--dry-run` 을 받는다.

---

## 4. 안전장치 (이 파이프라인이 막아 주는 사고)

| 사고 | 장치 |
|---|---|
| **웹앱 URL 이 바뀌어 프론트가 끊긴다** (§6 "'새 배포' 아님") | `deployments.create` 를 아예 구현하지 않았다. 기존 배포만 갱신하고, 갱신 후 URL 이 그대로인지 대조해 다르면 실패시킨다 |
| **편집기에서 직접 고친 내용을 덮어쓴다** (§6 "실배포본이 미러보다 최신일 수 있다") | push 전 기준선 검사 — 실배포본이 직전 커밋 시점의 레포와 다르면 멈추고 `pull` 을 안내 |
| **편집기에만 있는 파일이 조용히 사라진다** | `updateContent` 는 파일 전체를 치환한다. 매핑(`gas/project.json`)에 없는 실배포 파일이 있으면 멈춘다 |
| **배포했는데 스크립트가 죽어 있다** | 배포 직후 웹앱을 실제로 호출해 JSON 응답을 확인(콜드 스타트 대비 90초). 실패 시 rollback 명령을 출력 |
| **반영 안 됐는데 성공으로 보고** | push 후 되읽어 대조한다 (철칙 3) |
| **동시 배포로 버전이 엇갈린다** | 워크플로 `concurrency: gas-deploy` |
| **몰래 생긴 드리프트** | 매주 월요일 06:00 KST 자동 `check` — 다르면 워크플로가 실패해 알림 |

### ⚠ 여전히 사람이 지켜야 하는 것
- **순서 (§6)**: payload 계약이 바뀌는 변경은 GAS 가 프론트보다 **먼저** 배포돼야 한다.
  Vercel 빌드는 수 분, 이 워크플로는 1분 내외라 같은 병합에서 자연히 앞서지만,
  계약 변경 폭이 크면 `gas/` 만 먼저 병합해 성공을 확인한 뒤 프론트를 병합하는 게 안전하다.
- **스크립트 속성**은 자동화 대상이 아니다. 새 비밀값은 편집기에서 직접 추가한다.
- **트리거**(onEdit 등)도 API 로 만들지 않는다. 기존 트리거는 배포와 무관하게 유지된다.

---

## 5. 왜 MCP 서버가 아니라 이 방식인가

출발점이 된 링크(lobehub `claude-google-apps-script-mcp-guide`)를 포함해 후보를 검토한 결과.

| 방식 | 할 수 있는 일 | 판정 |
|---|---|---|
| **lobehub 가이드의 MCP** | GAS 웹앱을 하나 띄우고 그 URL 로 **시트 데이터**를 읽고 쓴다 (`read_google_sheet`/`write_google_sheet`) | ✗ 우리가 원하는 **코드 편집이 아니다**. 시트 데이터 접근은 이미 Google Drive 커넥터로 된다 |
| **clasp MCP 서버** (`npx @google/clasp mcp`) | `push_files`/`pull_files`/`clone_project`/`list_projects` | △ 소스 반영은 되지만 **버전·배포 도구가 없다** — §6 의 핵심인 "기존 배포 편집 → 새 버전"을 못 한다. 로컬 대화형 편집엔 유용 |
| **clasp CLI** | 전부 가능 | △ 되지만 로그인이 10개 권한을 요구하고, 배포 갱신 시 URL 보존·기준선 검사 같은 가드를 걸 자리가 없다 |
| **이 파이프라인** (Apps Script REST API 직접) | 전부 + 가드 | ✔ 채택. 의존성 0, 권한 2개, 위 §4 의 안전장치를 코드로 강제 |

**보안상 이점 하나 더**: 자격증명은 GitHub Secrets 에만 있고 AI 세션에는 없다.
Claude 는 `gas/*.gs` 를 고쳐 PR 을 올리고 워크플로를 실행시킬 뿐, Google 토큰을 만지지 않는다.

---

## 6. 파일

| 경로 | 역할 |
|---|---|
| `scripts/gas-sync.mjs` | CLI 본체 (의존성 없음, Node 22) |
| `gas/project.json` | 레포 ↔ 편집기 파일 매핑. **편집기에 파일을 추가하면 여기에도 추가** |
| `gas/appsscript.json` | 매니페스트 미러. 웹앱 접근권한(`ANYONE_ANONYMOUS`)·실행주체가 여기 있다 — 잘못 바꾸면 신청이 통째로 막히니 주의 |
| `gas/linkyincdev-main.gs` | 통합 스크립트 본문 (기존 미러 그대로, 이제 **실배포의 원본**) |
| `.github/workflows/gas-deploy.yml` | 자동 배포·주간 점검 |
