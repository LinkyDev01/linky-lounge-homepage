/**
 * 렌더를 막지 않는 외부 스타일시트 로드 (2026-08-17, 운영자 "느리면 안되지.
 * 페이지 로딩 느린 요소 모두 개선").
 *
 * `<link rel="stylesheet">` 는 **첫 페인트를 통째로 막는다** — 서체 CSS 하나가
 * 느리면 화면 전체가 그만큼 늦는다 (실측: 외부 CDN 이 매달리는 환경에서 랜딩
 * 히어로 그어짐 시작 26초 ↔ 즉시 실패시키면 0.39초. 실기기 모바일 회선에서도
 * 같은 원리로 초 단위가 밀린다).
 *
 * 여기서 로드하는 건 전부 **서체 CSS**라 없이도 화면이 그려진다(폴백 서체) —
 * 막을 이유가 없다. `media="print"` 로 비차단 로드한 뒤, 도착하면 인라인
 * 스크립트가 `media` 를 되돌린다. 고전적이지만 프레임워크·하이드레이션과 무관하게
 * 동작하는 것이 핵심이다 — 하이드레이션이 늦어지는 상황이 바로 이 컴포넌트가
 * 구제해야 하는 상황이기 때문. preload 로 다운로드 자체는 즉시 시작된다.
 *
 * ⚠ 부작용: CSS 도착 전까지 해당 서체 텍스트가 폴백으로 먼저 보인다(FOUT).
 *   이 CSS 들은 어차피 font-display: swap 이라 느린 회선에선 지금도 같은 스왑이
 *   일어난다 — 달라지는 건 "그동안 화면 전체가 하얗던 것"이 사라지는 쪽뿐이다.
 * ⚠ 포스터 서체(pretendard-poster-subset)는 이 경로와 무관 — 자체 호스팅 +
 *   컴포넌트 자체 preload (HeroBreathingPoster).
 */
export function DeferredCss({ href }: { href: string }) {
  return (
    <>
      <link rel="preload" as="style" href={href} />
      {/* 아래 인라인 스크립트가 하이드레이션 전에 media·data-d 를 바꾸므로 서버 HTML 과
          어긋난다 — React 는 이 속성들을 되돌리지 않지만(의도한 동작) 콘솔에 불일치
          오류를 남겨, 진짜 불일치가 묻힌다. 의도된 변형임을 명시해 소음을 없앤다 */}
      <link rel="stylesheet" href={href} media="print" data-lz-defer-css suppressHydrationWarning />
      <noscript>
        <link rel="stylesheet" href={href} />
      </noscript>
      {/* 같은 컴포넌트가 여러 번 렌더돼도 안전 — data-done 으로 멱등.
          load 이벤트를 놓친 경우(캐시 히트)도 l.sheet 존재로 잡는다 */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){var a=document.querySelectorAll('link[data-lz-defer-css]');for(var i=0;i<a.length;i++){(function(l){if(l.dataset.d)return;l.dataset.d='1';var f=function(){l.media='all'};if(l.sheet){f()}else{l.addEventListener('load',f)}})(a[i])}})()",
        }}
      />
    </>
  )
}
