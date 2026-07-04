---
name: lazyday-deploy
description: 레이지데이 북클럽 변경분을 검증→커밋→푸시→(승인 시)PR·병합→프로덕션 확인까지 배포하는 표준 파이프라인. UI/코드 변경을 마치고 "배포해", "반영해" 지시를 받았거나 브랜치 프리뷰 링크를 만들어야 할 때 사용.
---

# 레이지데이 배포 파이프라인

순서를 건너뛰지 않는다. 각 단계의 "증거"가 없으면 다음 단계로 가지 않는다.

## 0. 승인 게이트 (먼저 판단)

- **프리뷰/브랜치 배포**: 운영자 승인 불필요 — 자유롭게 푸시.
- **main 병합(= 실서비스 lazyday-bookclub.com 반영)**: 운영자의 명시 승인이 있어야 한다.
  승인 표현 예: "반영해", "배포해", "바로 배포해", "오케이 반영", "실제 본 페이지 포함".
  승인 범위를 넘는 것(보류 항목)은 함께 병합되더라도 **프리뷰 트리 안에만** 있어야 한다.

## 1. 로컬 검증 (증거 필수)

```bash
npx tsc --noEmit                     # 0 이어야 함
# dev 서버 (죽어있으면 재시작 — 이 환경에서 자주 죽는다)
(npm run dev > /tmp/dev.log 2>&1 &) ; # curl 200 될 때까지 2초 간격 폴링
node scripts/shot.mjs --url http://localhost:3000/lazyday --selector "#섹션id" --out /tmp/check.png
```
- 스크린샷을 **직접 눈으로 확인**(Read)하고, 필요하면 `--eval`로 computed style 수치까지 검증.
- UI 변경인데 스크린샷 없이 완료 선언 금지.

## 2. 커밋·푸시

```bash
git checkout -- next-env.d.ts   # dev 서버가 재생성한 노이즈 제거 (항상)
git add <명시적 파일 목록>        # add -A 지양
git commit  # 메시지: 한국어, 제목 한 줄 + 본문에 무엇을·왜. 운영자 결정 근거 인용
git push -u origin <작업 브랜치>
```

## 3. 브랜치 배포 확인 + 공유 링크

- Vercel 프로젝트 `prj_iKxnwjdJoHtlXtEIBqxJ8uVjAmcy`, 팀 `team_Unc0jNsuK26xtE7mYRh09nRa`.
- `mcp__Vercel__list_deployments`로 방금 푸시한 SHA가 `state: READY`인지 확인 (~60–120초).
- 공유 링크: `mcp__Vercel__get_access_to_vercel_url`에 브랜치 별칭 URL + 경로를 넘겨 `_vercel_share` 토큰 발급.
  - **토큰은 배포 단위로 발급되고 ~23시간 만료** — 새 푸시마다 재발급해야 한다. 이전 링크는 죽는다.
- 배포 내용 확인은 curl 쿠키자로 (Playwright는 이 환경에서 외부 HTTPS 불가):
  ```bash
  curl -sL -c jar.txt -b jar.txt "<share URL>" -o page.html && grep -c "<기대 마커>" page.html
  ```
- 운영자에게 보고할 때 링크의 **만료 시각을 함께 표기**.

## 4. main 병합 (승인 시에만)

- **병합된 PR은 재사용 불가** — 매번 새 PR 생성 (`mcp__github__create_pull_request`, base=main).
- PR 본문: 실사이트 변경 / 프리뷰 전용 포함분(실사이트 영향 없음 명시) / 검증 내역.
- 체크(`get_status`)가 success면 `merge_pull_request` (method: merge).

## 5. 프로덕션 검증 (병합 후 필수)

백그라운드 폴링으로 실제 도메인에서 **콘텐츠 마커**를 확인한다 (보통 ~60초):
```bash
# run_in_background 로:
for i in $(seq 1 30); do curl -sL "https://www.lazyday-bookclub.com/" | grep -q "<새 마커>" && echo LIVE && exit 0; sleep 20; done
```
- 삭제가 목적이면 "옛 마커가 0건"도 함께 확인.
- 확인 결과를 운영자에게 명시적으로 보고 ("실배포 확인 완료 + 무엇이 서빙되는지").

## 함정 요약

- `sleep`은 포그라운드 단독 금지 — 루프 안 사용 or `run_in_background`.
- CSS는 별도 파일로 서빙되므로 프로덕션 HTML grep은 **텍스트/클래스명 마커**로.
- GAS는 이 파이프라인과 무관 — 레포 `gas/`는 미러일 뿐, 실반영은 운영자가 GAS 편집기에서 "배포 관리 → 새 버전".
