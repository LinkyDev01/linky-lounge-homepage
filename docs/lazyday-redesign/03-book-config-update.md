# 03. book-config.ts 업데이트 안 — **이 문서는 obsolete됐습니다**

## 사정 정리

이 문서는 처음 작성될 당시(2025-04-28) 동민님 로컬 워크스페이스가 main과 sync 안 된 상태에서 시작했어요. 그래서 제가 코드의 `book-config.ts`에 1기 데이터만 있는 줄 알고, 라이브 사이트 텍스트 + 추측으로 2기 카피를 새로 썼습니다. 그 추측 카피는 **걷어내야 합니다**.

**진짜 2기 마스터 카피는 이미 main 브랜치의 `app/(main)/lazyday/book-config.ts`에 14시간 전 commit으로 들어가 있습니다** (`Fill season2 books with full quote/description/curatorNote content` by claude).

또한 폴더 자체가 **`book-club` → `lazyday`** 로 rename됐어요. 그래서 로컬 워크스페이스의 `app/(main)/book-club/` 는 stale 상태입니다.

## 동민님이 하실 일은 한 줄

```bash
cd C:\Users\KPMG\lounge-dev\lounge-homepage-main
git fetch origin
git pull origin main
```

이 한 줄로 로컬이 main과 sync되면서 자동으로:
- `book-club` 폴더가 `lazyday` 로 바뀜
- `book-config.ts` 에 season1·2 데이터 풀로 채워짐
- `NavBar`, `BookSubNav`, redesign된 8개 섹션 컴포넌트 모두 들어옴

`git pull` 전에 제가 만든 양귀비 일러스트와 docs 폴더를 commit이나 stash해두는 거 잊지 마세요 (안 그러면 충돌).

## 현재 main의 book-config.ts schema 참고

읽기 편하게 schema만 정리:

```typescript
export type Book = {
  week: number
  weekLabel: string
  title: string
  author: string
  quotes: string[]
  paragraphs: string[]
  curatorNote: string
  imagePath: string
}

export type SeasonConfig = {
  season: number
  label: string         // "1기", "2기"
  dateRange: string     // "5.21 – 7.5"
  books: Book[]
}

export const season1Config: SeasonConfig = { /* ... 4권 */ }
export const season2Config: SeasonConfig = { /* ... 4권 */ }
```

> 제가 처음 추측한 schema와 다른 점:
> - `tagline`, `note` 필드 없음
> - `Schedule`, `introTitle`, `introParagraphs`, `scheduleNote` 따로 분리됨 (Schedule은 `ScheduleSection.tsx`가 자체 데이터로 갖고 있음)
> - export 이름이 `currentSeasonConfig`가 아니라 `season1Config`·`season2Config`

## 2기 책 4권 — 실제 데이터 (main에 들어있는 그대로)

| 회차 | 제목 | 저자 | 표지 파일 |
|---|---|---|---|
| 1 | 가장 젊은 날의 철학 | 이충녕 | `2기-1-가장 젊은 날의 철학.jpg` |
| 2 | 브람스를 좋아하세요... | 프랑수아즈 사강 | `2기-2-브람스를 좋아하세요.jpg` |
| 3 | 사랑의 기술 | 에리히 프롬 | `2기-3-사랑의 기술.jpg` |
| 4 | 이방인 | 알베르 카뮈 | `2기-4-이방인.jpg` |

**확인 필요:** `public/linky-lounge/book-club/books/` 폴더에 위 4장이 실제로 있는지. 있으면 끝, 없으면 출판사 사이트에서 받아서 올리면 됩니다.

## 결론

이 문서가 다루던 모든 작업이 이미 main에 머지되어 있습니다. **이 문서를 더 이상 참고하지 말고**, `git pull` 한 번으로 sync 끝내주세요.

진짜 남은 작업은 02 문서(다시 작성됨) 참고.
