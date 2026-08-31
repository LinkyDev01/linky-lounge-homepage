// ================================================================
// 사람들 단일 출처 (2026-08-20 신설 — C안, 레퍼런스 p-i-e.kr/people)
// 모임 상세의 진행자 소개와 /people 페이지가 **같은 원고**를 읽는다.
// 종전에는 약력이 meetings/[slug]/page.tsx 안에 인라인이라, 사람들 페이지가
// 생기면 원고가 두 곳으로 갈라질 상황이었다 → 여기로 승격.
//
// ⚠ 브랜드 카피는 운영자 소유 — 이 파일의 약력은 운영자 원문 그대로다.
//   한 글자도 편집하지 않는다. 수정 지시가 오면 원문을 그대로 갈아끼운다.
// ⚠ .tsx 인 이유: 약력에 링크·취소선 마크업이 들어간다 (philosophy-content.tsx 선례)
// ⚠ '네비올로'(안동민)·'네그로니'(천고든) 링크는 2026-08-25 부터 **커피앤바 참가폼**
//   (`/lazyclub/meetings/dm-gd`)으로 간다 — 종전 목적지(wine21·위키백과) 교체. 운영자 지시이자,
//   그 페이지의 "네그로니는 없습니다 / 네비올로도 없습니다"와 짝을 이루는 농담이다.
//   내부 링크라 새 탭으로 열지 않는다(같은 파일의 레이지클럽 링크와 같은 취급).
// ⚠ 서버 컴포넌트에서 문자열 보간해도 안전하도록 base-path 에서 직수입
//   (Shell("use client") 경유 금지 — base-path.ts 헤더의 프록시 버그 주석 참조)
// ================================================================

import { BASE, BOOKCLUB_URL, HOME } from "./base-path"

export type Person = {
  slug: string
  name: string
  /** @ 없는 핸들만 — 표시는 @핸들, 링크는 instagram.com/핸들 */
  instagram: string
  /** 400×577 (비율 0.6933) — '오려낸' clip-path 가 이 비율 전제 */
  photo: string
  /** 약력 원고 (운영자 원문 그대로) */
  bio: React.ReactNode
}

/** ⚠ slug = **개인 핸들**이다 (운영자 2026-08-22 2차: 안동민 dmahn · 천고든 gdcheon.
 *  같은 날 오전의 순번 8자리 표기는 폐기). 사람이 늘면 그 사람의 핸들을 쓴다.
 *  **한 번 쓴 핸들은 다른 사람에게 넘기지 말 것** — 공유된 주소가 다른 사람을 가리키게 된다.
 *  지난 슬러그(andongmin·gorden·00000001·00000002)는 middleware 가 301 로 여기 보낸다 —
 *  인스타 링크인바이오가 옛 주소를 쓰고 있어 끊으면 유입이 죽는다.
 *  슬러그 규율 전반(불변 원칙·개명 절차)은 docs/url-policy.md 정본. */
export const PEOPLE: Person[] = [
  // 순서: 안동민 먼저 (운영자 2026-08-21 "안동민이 제일 좌측(맨 앞) 정렬되게")
  {
    slug: "dmahn", // 안동민
    name: "안동민",
    instagram: "im_dm____",
    photo: "/linky-lounge/book-club/home-v3/host-andongmin.webp",
    bio: (
      <p>
        첫돌에 손가락에 끼워진{" "}
        <a href="https://m.stock.naver.com/marketindex/metals/M04020000" target="_blank" rel="noopener noreferrer">
          순금 한 돈
        </a>
        이 곧 가계 유동성으로 전환되는 과정을 겪으며 자본주의 시스템의 환대와 한계를 동시에 체감했다. 일곱 살
        무렵 오른손, 5년 후에는 왼손 젓가락질을 연달아 숙달하며 한 손 상실에 대비한 식사 기능의 이중화를
        일찍이 마쳤다. 열다섯 살 무렵 서든어택에서 총기류 대신 날붙이를 택하는 신뢰 기반 근접전을 지향하며{" "}
        <a
          href="https://ko.wikipedia.org/wiki/%ED%8C%83%ED%8F%AC%ED%83%AF"
          target="_blank"
          rel="noopener noreferrer"
        >
          Tit for Tat
        </a>
        을 인생의 전략으로 채택했다. 이때 비주류를 열망한다는 자기 인식을 얻었다고 한다. 이 열망은 한때{" "}
        <a href="https://imgur.com/gallery/1940s-men-s-work-clothes-l7YfP" target="_blank" rel="noopener noreferrer">
          1940년대 아메리칸 워크웨어
        </a>{" "}
        애호로 구현되었고, 그 차림새에서 타인의 시선을 의도치 않게 유치했으나 얻은 결론은 오히려
        타인의 시선에 무감하다는 본인의 속성이었다. 현재는 사회화의 결과로 해당 복식은 착용하지 않는다고 한다. 이십대 후반에는 부동산
        투자로 약 2년치 연봉만큼의 수익을 익명의 시장 참여자에게 안겨주었다. 회사에서는 경영과 서비스 기획과
        프로젝트 관리와 웹 개발과 퍼실리테이팅과 공공·금융 분야 애플리케이션 및 인프라 아키텍처 컨설팅을
        병행하고 있다.{" "}
        <s>링키케어</s>,{" "}
        <a href="https://linkylounge.com" target="_blank" rel="noopener noreferrer">
          링키라운지
        </a>
        ,{" "}
        <a href="https://www.lazyday-bookclub.com" target="_blank" rel="noopener noreferrer">
          레이지데이 북클럽
        </a>
        ,{" "}
        <a href="https://www.lazy-club.com" target="_blank" rel="noopener noreferrer">
          레이지클럽
        </a>{" "}
        등{" "}
        <a href="https://ko.wikipedia.org/wiki/O2O" target="_blank" rel="noopener noreferrer">
          O2O
        </a>{" "}
        서비스를 출시했고, 현재는 주로 레이지데이 북클럽에서 독서모임장으로 출현하는 것으로 알려져 있으며,{" "}
        <a href={`${BASE}/meetings/dm-gd`}>네비올로</a>{" "}
        품종의 포도주를 즐겨 마시고 싶어 하는 것으로 전해진다.
      </p>
    ),
  },
  {
    slug: "gdcheon", // 천고든
    name: "천고든",
    instagram: "kylor.kylor",
    photo: "/linky-lounge/book-club/home-v3/notsqueezing-host.webp",
    bio: (
      <p>
        20세기말 여름, 길병원에서 장발 우량아로 태어났다. 출생부터 남달랐던 그는 피아노와 수학에 두각을
        나타내며 패션디자이너를 꿈꾸었으나, Fashion에 대한 Passion이 식어 4학년 2학기에 돌발 자퇴했다. 이후
        직접 공간을 디자인하고 인테리어한 사당역의{" "}
        <a href={`${BOOKCLUB_URL}/lounge-info`} target="_blank" rel="noopener noreferrer">
          링키라운지
        </a>
        를 거점으로,{" "}
        <a href={BOOKCLUB_URL} target="_blank" rel="noopener noreferrer">
          레이지데이 북클럽
        </a>
        과{" "}
        <a href={HOME} rel="noopener noreferrer">
          레이지클럽
        </a>
        에서 기획자와 편집자와 디자이너와 마케터와 크리에이티브 디렉터로 일하고 있다. 초등학생 시절 강제로
        다녔던 논술 학원의 영향으로 여러 분야에서 그 덕을 톡톡히 보고 있다고 회상한다. 15세 무렵에는 무려 119개의{" "}
        <a
          href="https://ko.wikipedia.org/wiki/%EB%A3%A8%EB%B9%85%EC%8A%A4_%ED%81%90%EB%B8%8C#%ED%94%84%EB%A6%AC%EB%93%9C%EB%A6%AC%ED%9E%88_%ED%95%B4%EB%B2%95"
          target="_blank"
          rel="noopener noreferrer"
        >
          프리드리히 공식
        </a>
        을 암기하여 3×3×3 큐브를 10초대에 맞추는 등 비범한 재능을 보였다. 2024년
        처음 출전한 마블런 10km에서 47분의 기록을 달성한 후 미련 없이 달리기를 관두었으며, 현재 가장
        좋아하는 칵테일은{" "}
        <a href={`${BASE}/meetings/dm-gd`}>네그로니</a>
        로 알려져 있다.
      </p>
    ),
  },
]

export function findPerson(slug: string) {
  return PEOPLE.find((p) => p.slug === slug)
}
