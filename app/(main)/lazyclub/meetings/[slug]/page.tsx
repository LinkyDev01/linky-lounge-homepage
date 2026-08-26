import { notFound } from "next/navigation"
import { findMeeting } from "../../one-day-config"
import { ProductDetail } from "../../ProductDetail"
// 서버 컴포넌트 — Shell("use client") 경유로 값을 받으면 프록시가 찍힌다 (base-path 직수입)
import { BASE } from "../../base-path"
import { KAKAO_CHAT_URL } from "@/app/(main)/lazyday/support"
import styles from "../../home.module.css"
// 진행자 서식·원고는 공용 (사람들 페이지와 같은 출처 — 2026-08-20)
import { HostIntro } from "../../HostIntro"
import { findPerson } from "../../people-config"

/** 원데이 토크 상세 — 워크룸 상품 상세 구조 (docs/redesign/09 1순위).
 *  선결제→후신청 (2026-08-11): 구매하기가 신청폼이 아니라 **곧장 결제**로 간다 —
 *  신청서는 결제 승인 직후 checkout/success 가 띄운다 (운영자 확정 여정) */
export default async function MeetingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const m = findMeeting(slug)
  if (!m) notFound()

  const badge = m.status === "open" ? "모집중" : m.status === "soldout" ? "마감" : "오픈 예정"

  // 가격 미정(price === null) 이면 구매하기를 문의로 안내한다 — buyHref 를 아예 안 주면
  // ProductDetail 이 자동으로 "구매하기 → notify(buyMessage)"로 뺀다.
  // ⚠ 2026-08-20: 종전엔 이 판정이 `Boolean(m.sessions)` 였는데, 본문(centerBody) 유무와
  // 결제 가능 여부는 별개 축이다 — 호프처럼 "본문은 있고 가격도 있는" 모임이 생기며 분리.
  // 2026-08-21: 가격이 있어도 **주문 코드가 없으면 결제로 보내지 않는다** — 코드 없는
  // 모임에 buyHref 를 주면 엉뚱한 회차 신청 폼(/one-day-talk-01/apply)으로 새어 나간다
  // 2026-08-21 여정 전환(선신청 → 후결제): 구매하기는 **신청 폼**으로 간다.
  // 결제는 폼 접수가 끝난 뒤 토스페이먼츠 상품 링크(payUrl)로 손님이 직접 넘어간다 —
  // 그래서 판정 기준도 주문코드(code)가 아니라 **payUrl 유무**다
  const unpriced = m.payUrl == null
  // 하단 중앙 본문 — 모임별 콘텐츠. 없는 모임은 종전대로 우측 요약만 쓴다
  const body = BODIES[m.slug]

  return (
    <ProductDetail
      id={`meeting-${m.slug}`}
      category={m.catLabel} // 원데이토크 통일 / 개별 모임장은 이름 (운영자 2026-08-21 — 진행 주체 표기는 8-18~8-21 사흘 만에 종료)
      badgeText={badge}
      kind="meeting"
      status={m.status}
      title={m.title}
      // sub 없음 — 제목 아랫줄의 "One Day Talk" 제거 (운영자 2026-08-21
      //   "모임 상세페이지에 모임 제목 바로아랫줄에 One Day Talk 위치에 자리한 것은 제거").
      //   모임 상세 **전체** 대상. 굿즈 상세의 sub("Product")는 지시 범위 밖이라 유지.
      description={m.description}
      fields={
        m.sessions
          ? [
              // 회차 날짜는 가운뎃점으로 잇지 않고 각자 한 줄씩 (운영자 2026-08-21)
              { label: "일시", lines: [...m.sessions.map((s) => s.date.split(" ")[0]), "오전 10:00–12:00"] },
              { label: "장소", lines: [m.place] },
              { label: "읽는 책", lines: m.sessions.map((s) => `${s.week} 『${s.work}』`) },
              { label: "진행", lines: [m.host] },
              { label: "문의", lines: ["카카오톡 채널"], href: KAKAO_CHAT_URL },
            ]
          : [
              { label: "일시", lines: [m.date] },
              { label: "장소", lines: [m.place] },
              { label: "진행", lines: [m.host] },
              { label: "문의", lines: [m.contact] },
            ]
      }
      price={m.price}
      buyHref={unpriced ? undefined : `${BASE}/meetings/${m.slug}/apply`}
      buyMessage={
        unpriced
          ? m.price == null
            ? "가격·정원은 확정 전입니다. 카카오톡 채널로 문의해주세요."
            : "정원·결제는 카카오톡 채널로 문의해주세요."
          : undefined
      }
      images={m.images}
      cartItem={{ id: `meeting-${m.slug}`, name: m.title, price: m.price, href: `${BASE}/meetings/${m.slug}`, img: m.thumbnail }}
      // 모임 상세 전체(호프·브람스·시지프·신규)에 sticky 포스터 그리드 — A절 지시가
      // "모임 상세 전체" 대상이었는데 이전엔 centerBody 유무로 오판(feature)해 신규
      // 모임에만 걸렸던 버그를 바로잡음(2026-08-19 재수정). 굿즈 상세는 이 prop 자체가 없다.
      stickyPoster
      centerBody={body}
    />
  )
}

/** "비로소 나를 쥐어짜지 않는 법" 본문 — 인사말(원문 그대로) + 책 4권 + 진행자 소개.
 *  브랜드 카피는 운영자 소유 — 한 글자도 편집하지 않는다. */
function NotSqueezingBody() {
  return (
    <div style={{ display: "contents" }}>
      <div className={styles.nsqBodyText}>
        <p>안녕하세요. 천고든입니다.</p>
        <p>
          어쩌면 우리는 누군가의 기대에 맞추느라, 혹은 미움받지 않으려고 자기 자신의 진짜 마음을 꽁꽁 숨긴 채
          살아왔는지 모릅니다. &ldquo;왜 나는 늘 이 모양일까&rdquo; &ldquo;왜 이렇게 우울하고 불안할까&rdquo; 하며
          모든 원인을 스스로에게 돌리며 지쳐가고 계신 건 아닐까요.
        </p>
        <p>
          우리가 함께 떠날 4주간의 여정은 바로 그 가면을 벗어던지고, 흔들릴지언정 온전한 &lsquo;나&rsquo;로 바로
          서기 위한 작은 쉼터입니다.
        </p>
        <p>
          1주차에는 다자이 오사무 《인간 실격》을 통해 타인이라는 거대한 시선 속에서 길을 잃었던 나의 서툰 방황을
          마주합니다. 남들의 기준에 맞추느라 닳아버린 내면의 아픔을 꺼내놓으며, &ldquo;아, 나만 이렇게 외로웠던
          게 아니구나&rdquo; 하는 깊은 공감과 위로를 나누려 합니다.
        </p>
        <p>
          2주차에는 프랑수아즈 사강의 《브람스를 좋아하세요...》 속으로 걸어 들어갑니다. 관계의 무게와 일상의
          권태 속에서, 과연 내가 진정으로 원하는 삶과 감정이 어디를 향하고 있는지 차분히 들여다봅니다. 타인의
          속도에 휩쓸려 보지 못했던 내 안의 진짜 목소리에 귀를 기울여보는 시간입니다.
        </p>
        <p>
          3주차에는 알베르 카뮈의 《이방인》을 통해 사회가 강요하는 거짓 위선과 정답에서 과감히 걸어 나옵니다.
          부조리한 세상 앞에서 남들이 정해둔 틀을 거부하고, 오직 나만의 진실과 실존을 지켜내는 그 강렬한
          주체성의 순간을 함께 목격하고자 합니다.
        </p>
        <p>
          마지막 4주차에는 에밀 아자르의 《자기 앞의 생》과 함께 합니다. 버겁고 두려운 현실 속에서도 타인의
          구원을 바라지 않고, 내 힘으로 오늘을 온전히 살아내며 한 뼘 더 자라나는 소년 모모의 눈부신 생명력을
          만납니다. 결국 흔들릴지언정 내 삶의 주인은 오직 나라는 단단한 믿음으로 4주의 여정을 아름답게
          마무리하려 합니다.
        </p>
        <p>
          거창한 변화가 아니어도 좋습니다. 완벽하지 않은 모습 그대로, 우울과 불안을 품은 채 그저 내 속도대로
          한 걸음씩 걸어 나가는 그 길에 당신을 초대합니다. 이 여정 끝에서 비로소 온전한 나 자신과 마주하게
          되기를 진심으로 바랍니다.
        </p>
      </div>

      <figure className={styles.nsqBodyImage}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/linky-lounge/book-club/home-v3/notsqueezing-books.webp"
          alt="1주차 『인간 실격』· 2주차 『브람스를 좋아하세요...』· 3주차 『이방인』· 4주차 『자기 앞의 생』"
        />
      </figure>

      <PersonIntro slug="gdcheon" /> {/* 천고든 */}
    </div>
  )
}

/** 호프(원데이 토크) 본문 — 진행자(안동민) 소개. 원문 그대로 (운영자 2026-08-20) */
function HopeBody() {
  return (
    <div style={{ display: "contents" }}>
      <PersonIntro slug="dmahn" /> {/* 안동민 */}
    </div>
  )
}

/** 진행자 소개 — 원고는 people-config 단일 출처, 서식은 공용 HostIntro.
 *  사람들 페이지(/people)와 같은 것을 읽으므로 원고가 갈라지지 않는다 (2026-08-20) */
function PersonIntro({ slug }: { slug: string }) {
  const p = findPerson(slug)
  if (!p) return null
  return (
    <HostIntro photo={p.photo} name={p.name} instagram={p.instagram}>
      {p.bio}
    </HostIntro>
  )
}

/** 모임 slug → 하단 중앙 본문. 없는 모임은 종전대로 우측 요약만 (2026-08-20) */
const BODIES: Record<string, React.ReactNode> = {
  "not-squeezing-myself": <NotSqueezingBody />,
  hope: <HopeBody />,
}
