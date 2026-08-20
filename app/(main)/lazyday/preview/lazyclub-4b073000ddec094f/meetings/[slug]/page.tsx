import { notFound } from "next/navigation"
import { findMeeting, meetingOrderCode } from "../../one-day-config"
import { ProductDetail } from "../../ProductDetail"
// 서버 컴포넌트 — Shell("use client") 경유로 값을 받으면 프록시가 찍힌다 (base-path 직수입)
import { BASE, BOOKCLUB_URL } from "../../base-path"
import { KAKAO_CHAT_URL } from "@/app/(main)/lazyday/support"
import styles from "../../home.module.css"

/** 원데이 토크 상세 — 워크룸 상품 상세 구조 (docs/redesign/09 1순위).
 *  선결제→후신청 (2026-08-11): 구매하기가 신청폼이 아니라 **곧장 결제**로 간다 —
 *  신청서는 결제 승인 직후 checkout/success 가 띄운다 (운영자 확정 여정) */
export default async function MeetingDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const m = findMeeting(slug)
  if (!m) notFound()

  const badge = m.status === "open" ? "모집중" : m.status === "soldout" ? "마감" : "오픈 예정"
  // 일정에 매핑되지 않는 모임(지난 회차 등)은 회차 선택 페이지로 폴백
  const code = meetingOrderCode(m.slug)

  // 가격 미정(price === null) 이면 구매하기를 문의로 안내한다 — buyHref 를 아예 안 주면
  // ProductDetail 이 자동으로 "구매하기 → notify(buyMessage)"로 뺀다.
  // ⚠ 2026-08-20: 종전엔 이 판정이 `Boolean(m.sessions)` 였는데, 본문(centerBody) 유무와
  // 결제 가능 여부는 별개 축이다 — 호프처럼 "본문은 있고 가격도 있는" 모임이 생기며 분리.
  const unpriced = m.price == null
  // 하단 중앙 본문 — 모임별 콘텐츠. 없는 모임은 종전대로 우측 요약만 쓴다
  const body = BODIES[m.slug]

  return (
    <ProductDetail
      id={`meeting-${m.slug}`}
      category={m.host} // 카테고리 대신 진행 주체 노출 (운영자 2026-08-18)
      badgeText={badge}
      status={m.status}
      title={m.title}
      sub="One Day Talk" // 운영자 2026-08-18: 작은 글씨는 영어로만
      description={m.description}
      fields={
        m.sessions
          ? [
              { label: "일시", lines: [m.sessions.map((s) => s.date.split(" ")[0]).join(" · "), "오전 10:00–12:00"] },
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
      buyHref={unpriced ? undefined : code ? `/one-day-talk-01/checkout?items=${code}` : "/one-day-talk-01/apply"}
      buyMessage={unpriced ? "가격·정원은 확정 전입니다. 카카오톡 채널로 문의해주세요." : undefined}
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

      <HostIntro photo="/linky-lounge/book-club/home-v3/notsqueezing-host.webp" name="천고든" instagram="kylor.kylor">
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
            <a href={BASE} rel="noopener noreferrer">
              레이지클럽
            </a>
            에서 기획자와 편집자와 디자이너와 마케터와 크리에이티브 디렉터로 일하고 있다. 초등학생 시절 강제로
            다녔던 논술 학원의 영향으로 여러 분야에서 그 덕을 톡톡히 보고 있다고 회상한다. 15세 무렵에는 무려
            119개의 프리드리히 공식을 암기하여 3×3×3 큐브를 10초대에 맞추는 등 비범한 재능을 보였다. 2024년
            처음 출전한 마블런 10km에서 47분의 기록을 달성한 후 미련 없이 달리기를 관두었으며, 현재 가장
            좋아하는 칵테일은 네그로니로 알려져 있다.
          </p>
      </HostIntro>
    </div>
  )
}

/** 진행자 소개 공용 서식 — 운영자 카드뉴스 원본 레이아웃 그대로 (2026-08-20 확정):
 *  이름이 큰 제목 → 사진은 **우측**에 띄우고 본문이 그 왼쪽을 감싸 흐름(float) →
 *  인스타 핸들은 약력 끝줄. 모임마다 이 컴포넌트를 재사용해 서식이 갈라지지 않게 한다.
 *  ⚠ 사진(figure)이 이름·본문보다 **소스 순서상 먼저** 와야 float 감김이 성립한다.
 *  약력(children)은 운영자 원문 그대로 — 한 글자도 편집하지 않는다. */
function HostIntro({
  photo,
  name,
  instagram,
  children,
}: {
  photo: string
  name: string
  /** @ 없는 핸들만 — 표시는 @핸들, 링크는 instagram.com/핸들 */
  instagram: string
  children: React.ReactNode
}) {
  return (
    <div className={styles.nsqHostRow}>
      <figure className={styles.nsqHostPhoto}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt={name} />
      </figure>
      <p className={styles.nsqHostName}>{name}</p>
      <div className={styles.nsqHostText}>
        {children}
        <p className={styles.nsqHostHandle}>
          <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer">
            @{instagram}
          </a>
        </p>
      </div>
    </div>
  )
}

/** 호프 무비토크 본문 — 진행자(안동민) 소개. 원문 그대로 (운영자 2026-08-20) */
function HopeBody() {
  return (
    <div style={{ display: "contents" }}>
      <HostIntro photo="/linky-lounge/book-club/home-v3/host-andongmin.webp" name="안동민" instagram="im_dm____">
        <p>
          생후 365일 무렵 손가락에 끼워진{" "}
          <a href="https://m.stock.naver.com/marketindex/metals/M04020000" target="_blank" rel="noopener noreferrer">
            순금 한 돈
          </a>
          이 곧 가계 유동성으로 전환되는 과정을 겪으며 자본주의 시스템의 환대와 한계를 동시에 통보받았다. 일곱 살
          무렵 오른손을, 5년 후에는 왼손 젓가락질을 마스터하며 한 손 상실이라는 저빈도 고위험 시나리오에 대비한
          이중화를 조기에 구축했다. 열다섯 살 무렵 총기 게임(서든어택)에서 칼전 문화를 선도하며 Tit for Tat을
          인생의 전략으로 채택했고, 비주류를 열망한다는 자기 인식을 이때 얻었다. 스물여덟 살에는 부동산 투자로 약
          2년치 연봉만큼의 수익을 익명의 시장 참여자에게 안겨주었다. <s>링키케어</s>,{" "}
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
          등 오프라인 기반 서비스를 출시했으며 현재는 주로 링키라운지에서 독서모임장으로 출현하는 것으로 알려져
          있다. 취미로는 경영과 서비스 기획과 웹 개발과 PM과 공공·금융 분야 애플리케이션 및 인프라 아키텍처
          컨설팅을 병행한다.{" "}
          <a
            href="https://ko.wikipedia.org/wiki/%EB%84%A4%EB%B9%84%EC%98%AC%EB%A1%9C"
            target="_blank"
            rel="noopener noreferrer"
          >
            네비올로
          </a>{" "}
          품종의 포도주를 즐겨 마시고 싶어 하는 것으로 추정된다.
        </p>
      </HostIntro>
    </div>
  )
}

/** 모임 slug → 하단 중앙 본문. 없는 모임은 종전대로 우측 요약만 (2026-08-20) */
const BODIES: Record<string, React.ReactNode> = {
  "not-squeezing-myself": <NotSqueezingBody />,
  hope: <HopeBody />,
}
