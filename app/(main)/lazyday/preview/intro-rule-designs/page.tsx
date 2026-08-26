"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import styles from "./intro-rule-designs.module.css"
import rstyles from "../../ReviewsSection.module.css"
import { useZoomGesture } from "../../useZoomGesture"

/**
 * 자기소개 규칙 섹션 — 디자인 시안 쇼케이스 (2026-08-24, 노출 구조 개정).
 *
 * 운영자: 자기소개 규칙(익명·거짓말 허용)을 랜딩 '진행 순서' 앞에 두어
 * "하나의 주요 세일즈포인트와 아이덴티티"로. 합의된 조건:
 *  · 노출 항목은 나이·직업·학력 3개만 (MBTI·연봉 등 실제 규칙 항목은 비노출)
 *  · 모달 원문 이미지 = 구글 드라이브 "자기소개 규칙.png"(2026-08-24, 최신본) 그대로 사용
 *  · 채택 시 진행 순서가 01~04 로: 1단계에서 '자기소개'를 분리해 01 로 (아래 배치 목업)
 *
 * 이번 라운드 질문(운영자): "조금 특별한 자기소개 규칙"처럼 티저 제목을 쓸 거면
 * 내용을 클릭해야 보이게 게이팅해야 앞뒤가 맞고, 반대로 내용을 스크롤에서 바로
 * 노출한다면 제목은 "자기소개 규칙" 정도로 담백해도 충분하다 — 이 구조를 다양하게.
 * 아래 세 안은 스타일(카드/취소선)이 아니라 "제목↔노출량"의 조합 자체를 달리한다.
 *
 * ⚠ 카피는 전부 운영자 원문(온라인 공개용)에서 발췌·축약 — 창작 문장 없음.
 *   축약 지점은 운영자 검토 대상. 실사이트 미반영 — 프리뷰 전용 제안.
 *
 * 2안(완전 게이팅)에는 운영자 요청으로 "기수별 진행했던 질문" 샘플 이미지 4장을
 * 후기 섹션 모달과 동일한 UI/UX(핀치줌·스와이프·‹›·점 카운터)로 얹었다 — ReviewsSection
 * 의 rstyles·useZoomGesture 를 그대로 재사용(§4 공유 CSS 지도: ReviewsSection.module.css
 * 소비자 +1). 이미지 4장은 지금 플레이스홀더(question-sample-0N.webp, "SAMPLE" 워터마크) —
 * 운영자가 기수별 실제 질문 카드 이미지를 주면 교체.
 */

const RULES = [
  { n: "01", text: <>공개하고 싶은 개인정보는 마음대로 공개해도 좋습니다.</>, star: false },
  { n: "02", text: <>공개하고 싶지 않은 개인정보는 철저히 비밀로 부치셔도 됩니다.</>, star: false },
  {
    n: "03",
    text: (
      <>
        원하신다면 나이, 직업, 학력 등을 완전히 <strong>거짓말</strong>로 꾸며내어
        말씀하셔도 좋습니다.
      </>
    ),
    star: true,
  },
]

/** 원문 발췌 — "우리는 비로소 상대방의 명함이 아니라 그 사람이 던지는 문장과
 *  사유에만 온전히 집중할 수 있게 됩니다" 의 축약 */
const LEAD = (
  <>
    상대방의 명함이 아니라, 그 사람이 던지는 <strong>문장과 사유</strong>에만 온전히
    집중할 수 있도록.
  </>
)

/** 2안 전용 — 기수별 진행했던 질문 샘플. 지금은 플레이스홀더, 실제 카드 이미지로 교체 예정 */
const SAMPLE_QUESTIONS = [
  { id: "q1", img: "/linky-lounge/book-club/intro-rules/question-sample-01.webp", caption: "1기에서 나눈 질문" },
  { id: "q2", img: "/linky-lounge/book-club/intro-rules/question-sample-02.webp", caption: "2기에서 나눈 질문" },
  { id: "q3", img: "/linky-lounge/book-club/intro-rules/question-sample-03.webp", caption: "3기에서 나눈 질문" },
  { id: "q4", img: "/linky-lounge/book-club/intro-rules/question-sample-04.webp", caption: "4기에서 나눈 질문" },
]

const VARIANTS = [
  {
    id: "expose",
    name: "1. 완전 노출",
    title: "자기소개 규칙",
    ref: "레퍼런스: 모임소개 챕터의 콰이어트 노출 문법 — 게이팅 없이 전부 스크롤에 붙임",
    desc: "규칙 3줄을 스크롤 도달과 동시에 전부 보여줍니다. 제목은 담백하게 '자기소개 규칙' — 파격은 제목이 아니라 세 번째 규칙(거짓말 허용) 자체가 만듭니다. '원문 보기'는 호기심 게이트가 아니라 '진짜 있는 규칙'이라는 증빙으로 격하됩니다. 스크롤 흐름이 끊기지 않고, 안 눌러봐서 못 보는 사람이 없습니다.",
  },
  {
    id: "gate",
    name: "2. 완전 게이팅",
    title: "조금 특별한 자기소개 규칙",
    ref: "레퍼런스: FAQ 미니멀 라인 접힘 문법(§3) — 제목의 약속을 클릭으로 지킴",
    desc: "티저 제목을 쓴 만큼 내용을 숨깁니다. 카드에는 헤드라인 한 줄과 '규칙 보기' 버튼만 있고, 눌러야 3줄이 펼쳐집니다. 제목-행동이 앞뒤가 맞고 클릭률로 반응을 잴 수 있지만, 안 눌러보고 스크롤을 내리는 사람에게는 이 섹션이 통째로 비어 보입니다.",
  },
  {
    id: "partial",
    name: "3. 펀치라인만 게이팅",
    title: "자기소개 규칙",
    ref: "레퍼런스: B(명함 지우기) 취소선 문법 + FAQ 접힘 — 두 안의 절충",
    desc: "제목은 담백하되, 안전한 규칙 1·2(공개/비밀 자유)는 바로 보여주고 진짜 파격인 규칙 3(거짓말 허용)만 취소선으로 가려 클릭해야 드러나게 합니다. 완전 노출의 '밋밋함'과 완전 게이팅의 '이탈'을 동시에 줄이는 절충안 — 스크롤만으로도 규칙 3개가 있다는 건 인지되고, 가장 세일즈포인트가 되는 한 줄에만 손이 가게 만듭니다.",
  },
  // ── 2026-08-24 위계 라운드 — 운영자 우려: "자기소개에 대한 큰 섹션 노출이 지나치지
  //    않을까" (전체 랜딩 기준 + 해당 섹션 단독 기준 각각). 4·5안은 노출량이 아니라
  //    **위계** 자체를 낮추는 안.
  {
    id: "subblock",
    name: "4. 서브블록 (추천)",
    title: "",
    ref: "레퍼런스: 현행 모임소개 밴드 — 32px 섹션 제목 없이 카드만 챕터 뒤에 이어 붙임",
    desc: "풀 섹션 위계를 포기하고 모임소개 밴드 안의 서브블록으로 격하합니다. 32px 제목·킥커가 빠져 세로 ~500px — '모임의 규칙 하나'라는 실제 위계와 노출 크기가 일치하고, 랜딩 섹션 수·배경 교차·내비가 전부 현행 그대로입니다. 취소선 카드가 밴드의 유일한 오브제라 눈에는 여전히 걸립니다.",
  },
  {
    id: "process",
    name: "5. 진행 방식 분리 섹션",
    title: "진행 방식",
    ref: "레퍼런스: 운영자 구상 — 진행 방식을 모임소개에서 분리, 정보는 이미지 모달로",
    desc: "진행 방식을 별도 섹션으로 승격하고 자기소개 규칙은 01 단계 안으로 흡수합니다. 규칙 원문·기수별 질문이 전부 이미지 모달 뒤로 들어가 화면 노출은 최소, 정보는 최대. 다만 랜딩 최상위 섹션이 하나 늘어 배경 A/B 재배정과 내비 탭 추가 검토가 필요합니다 — 채택 시 별도 항목으로 보고드립니다.",
  },
  // ── 이중 박스 우려 라운드 — "자기소개와 질문을 모두 저런 식으로 한 박스씩
  //    노출해도 괜찮을지" 에 대한 비교용: 박스 2개가 아니라 오브제 1개(카드) +
  //    저무게 스트립(썸네일)로 위계를 차등하는 안.
  {
    id: "duo",
    name: "6. 카드 + 질문 스트립",
    title: "자기소개 규칙",
    ref: "레퍼런스: 4안 + 2안의 썸네일 그리드 — 오브제는 1개 유지, 질문은 스트립으로",
    desc: "규칙 카드(오브제)는 하나만 유지하고, 질문 샘플은 같은 무게의 두 번째 박스가 아니라 카드 아래 낮은 썸네일 스트립(~110px)으로 붙입니다. 두 셀링포인트가 다 스크롤에 노출되지만 시각 위계가 달라 '박스 2개' 부담이 없습니다. 스트립 클릭 시 후기 모달 UI로 확대 — 질문의 매력은 확대해서 읽을 때 전달되므로 스트립은 예고편 역할만 합니다.",
  },
] as const

type VariantId = (typeof VARIANTS)[number]["id"]

const DOC_IMG = "/linky-lounge/book-club/intro-rules/rules-doc-draft.webp"

// ── 공용: 원문 모달 (후기 모달 축소판 — 배경 클릭·Esc·× 로 닫기) ──────────
function DocModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])
  return (
    <div className={styles.modal} onClick={onClose} role="dialog" aria-modal="true" aria-label="자기소개 규칙 원문">
      <button type="button" className={styles.modalClose} aria-label="닫기">×</button>
      <div className={styles.modalScroll}>
        <div className={styles.modalFrame} onClick={(e) => e.stopPropagation()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={DOC_IMG} alt="자기소개 규칙 전문" />
          <p className={styles.modalNote}>구글 드라이브 최신본(2026-08-24) 그대로</p>
        </div>
      </div>
    </div>
  )
}

/** 원문 발췌 킥커 — "이곳을 하나의 익명의 공간으로 만들어보면 어떨까요?" */
function Kicker() {
  return <p className={styles.kicker}>이곳을 하나의 익명의 공간으로 만들어보면 어떨까요?</p>
}

function RuleLines() {
  return (
    <ol className={styles.ruleList}>
      {RULES.map((r) => (
        <li key={r.n} className={r.star ? styles.ruleStar : styles.rule}>
          <span className={styles.ruleNum}>{r.n}</span>
          <span className={styles.ruleText}>{r.text}</span>
        </li>
      ))}
    </ol>
  )
}

function DocLink({ onOpen }: { onOpen: () => void }) {
  return (
    <button type="button" className={styles.docLink} onClick={onOpen}>
      규칙 원문 보기
    </button>
  )
}

// ── 1. 완전 노출 (추천) — 게이팅 없이 스크롤 즉시 전부 노출 ──────────
function ExposeVariant() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Kicker />
      <div className={styles.paperCard}>
        <span className={styles.tape} aria-hidden />
        <p className={styles.strikeLineInCard}>
          <s>나이</s> · <s>직업</s> · <s>학력</s>
        </p>
        <p className={styles.cardLead}>{LEAD}</p>
        <RuleLines />
        <DocLink onOpen={() => setOpen(true)} />
      </div>
      {open && <DocModal onClose={() => setOpen(false)} />}
    </div>
  )
}

// ── 2안 전용: 질문 샘플 썸네일 4장 + 후기 모달과 완전히 동일한 갤러리 모달 ──
// (rstyles·useZoomGesture 는 ReviewsSection.tsx 를 그대로 가져다 씀 — 핀치줌·
//  스와이프·‹›·+/−·점 카운터까지 전부 동일 동작)
function QuestionGallery({ trigger = "thumbs" }: { trigger?: "thumbs" | "chip" }) {
  const [modalIdx, setModalIdx] = useState<number | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const swipeRef = useRef<{ x: number; y: number } | null>(null)
  const zoom = useZoomGesture()
  const SWIPE_PX = 45

  function closeModal() {
    setModalIdx(null)
    zoom.reset()
  }
  function slideModal(dir: number) {
    setModalIdx((m) => {
      if (m === null) return m
      const next = Math.min(SAMPLE_QUESTIONS.length - 1, Math.max(0, m + dir))
      if (next !== m) zoom.reset()
      return next
    })
  }

  useEffect(() => {
    if (modalIdx === null) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal()
      else if (e.key === "ArrowRight") slideModal(1)
      else if (e.key === "ArrowLeft") slideModal(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener("keydown", onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalIdx])

  useEffect(() => {
    const el = stageRef.current
    if (!el || modalIdx === null) return
    const handler = (e: WheelEvent) => zoom.onWheel(e as unknown as React.WheelEvent)
    el.addEventListener("wheel", handler, { passive: false })
    return () => el.removeEventListener("wheel", handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalIdx])

  function onStagePointerDown(e: React.PointerEvent) {
    swipeRef.current = { x: e.clientX, y: e.clientY }
    zoom.onPointerDown(e)
  }
  function onStagePointerMove(e: React.PointerEvent) {
    zoom.onPointerMove(e)
  }
  function onStagePointerUp(e: React.PointerEvent) {
    const result = zoom.onPointerUp(e, { pointerType: e.pointerType })
    if (result.consumed) {
      swipeRef.current = null
      return
    }
    const start = swipeRef.current
    swipeRef.current = null
    if (!start) return
    const dx = e.clientX - start.x
    if (Math.abs(dx) >= SWIPE_PX) slideModal(dx < 0 ? 1 : -1)
  }
  function onStagePointerCancel(e: React.PointerEvent) {
    swipeRef.current = null
    zoom.onPointerCancel(e)
  }

  const modal = modalIdx !== null ? SAMPLE_QUESTIONS[modalIdx] : null

  return (
    <>
      {trigger === "thumbs" ? (
        <div className={styles.qThumbs}>
          {SAMPLE_QUESTIONS.map((q, i) => (
            <button
              key={q.id}
              type="button"
              className={styles.qThumb}
              onClick={() => setModalIdx(i)}
              aria-label={`${q.caption} 크게 보기`}
            >
              <Image src={q.img} alt={q.caption} fill sizes="90px" quality={85} draggable={false} />
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className={`${styles.docLink} ${styles.chipInline}`} onClick={() => setModalIdx(0)}>
          기수별 질문 샘플 보기
        </button>
      )}

      {modal !== null && modalIdx !== null && (
        <div
          className={`${rstyles.lightbox} ${rstyles.lightboxRoot} ${zoom.zoomed ? rstyles.lightboxZoomed : ""}`}
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={`${modal.caption} 확대 보기`}
        >
          <button type="button" className={rstyles.lightboxClose} aria-label="닫기" onClick={(e) => { e.stopPropagation(); closeModal() }}>×</button>

          <div className={`${rstyles.galleryFrame} ${rstyles.galleryFrameZoom}`} onClick={(e) => e.stopPropagation()}>
            <div
              ref={stageRef}
              className={`${rstyles.galleryStage} ${rstyles.zoomStage} ${zoom.zoomed ? rstyles.zoomStageZoomed : ""}`}
              onPointerDown={onStagePointerDown}
              onPointerMove={onStagePointerMove}
              onPointerUp={onStagePointerUp}
              onPointerCancel={onStagePointerCancel}
            >
              {SAMPLE_QUESTIONS.map((q, k) => {
                const off = k - modalIdx
                const isCur = k === modalIdx
                return (
                  <div
                    key={`qslide-${q.id}`}
                    data-slide-idx={k}
                    className={`${rstyles.gallerySlideM} ${isCur ? rstyles.gallerySlideMActive : ""} ${isCur && zoom.zoomed ? rstyles.activeSlideZoomed : ""}`}
                    ref={isCur ? zoom.frameRef : undefined}
                    style={{
                      transform: `translateX(calc(-50% + ${off} * (var(--slide-w) + 8px)))${isCur ? "" : " scale(0.94)"}`,
                    }}
                    aria-hidden={!isCur}
                  >
                    <div ref={isCur ? zoom.layerRef : undefined} className={rstyles.zoomLayer}>
                      <Image src={q.img} alt={q.caption} fill sizes="(min-width: 721px) 80vw, 92vw" quality={90} draggable={false} priority={isCur} />
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              className={`${rstyles.galleryNav} ${rstyles.galleryNavLeft}`}
              onClick={(e) => { e.stopPropagation(); slideModal(-1) }}
              disabled={modalIdx === 0}
              aria-label="이전 질문"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${rstyles.galleryNav} ${rstyles.galleryNavRight}`}
              onClick={(e) => { e.stopPropagation(); slideModal(1) }}
              disabled={modalIdx === SAMPLE_QUESTIONS.length - 1}
              aria-label="다음 질문"
            >
              ›
            </button>

            <div className={rstyles.zoomControls} onClick={(e) => e.stopPropagation()}>
              <button type="button" className={rstyles.zoomBtn} onClick={() => zoom.stepZoom(-1)} aria-label="축소">−</button>
              <button type="button" className={rstyles.zoomBtn} onClick={() => zoom.stepZoom(1)} aria-label="확대">+</button>
            </div>
          </div>

          <div className={rstyles.lightboxCaption}>
            <span>{modal.caption}</span>
            <span className={rstyles.lightboxCounter}>{modalIdx + 1} / {SAMPLE_QUESTIONS.length}</span>
          </div>
        </div>
      )}
    </>
  )
}

// ── 2. 완전 게이팅 — 제목의 약속(티저)을 클릭으로 지킴 ──────────────
function GateVariant() {
  const [revealed, setRevealed] = useState(false)
  const [open, setOpen] = useState(false)
  return (
    <div>
      <div className={styles.paperCard}>
        <span className={styles.tape} aria-hidden />
        <p className={styles.cardLead}>{LEAD}</p>
        {!revealed ? (
          <button type="button" className={styles.gateBtn} onClick={() => setRevealed(true)}>
            규칙 보기
          </button>
        ) : (
          <div className={styles.gateReveal}>
            <RuleLines />
            <DocLink onOpen={() => setOpen(true)} />
            <p className={styles.qLabel}>기수별로 실제 나눴던 질문들이에요</p>
            <QuestionGallery />
          </div>
        )}
      </div>
      {open && <DocModal onClose={() => setOpen(false)} />}
    </div>
  )
}

// ── 3. 펀치라인만 게이팅 — 규칙 1·2는 노출, 규칙 3(거짓말)만 클릭 ──
function PartialVariant() {
  const [revealed, setRevealed] = useState(false)
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Kicker />
      <div className={styles.paperCard}>
        <span className={styles.tape} aria-hidden />
        <p className={styles.cardLead}>{LEAD}</p>
        <ol className={styles.ruleList}>
          {RULES.filter((r) => !r.star).map((r) => (
            <li key={r.n} className={styles.rule}>
              <span className={styles.ruleNum}>{r.n}</span>
              <span className={styles.ruleText}>{r.text}</span>
            </li>
          ))}
          <li className={styles.ruleStar}>
            <span className={styles.ruleNum}>03</span>
            {!revealed ? (
              <button type="button" className={styles.punchlineBtn} onClick={() => setRevealed(true)}>
                <s>나이</s>, <s>직업</s>, <s>학력</s>은 전부 &lsquo;{" "}
                <strong>거짓말</strong>{" "}
                &rsquo;해도 됩니다 — 클릭
              </button>
            ) : (
              <span className={styles.ruleText}>{RULES[2].text}</span>
            )}
          </li>
        </ol>
        <DocLink onOpen={() => setOpen(true)} />
      </div>
      {open && <DocModal onClose={() => setOpen(false)} />}
    </div>
  )
}

// ── 4. 서브블록 (추천) — 섹션 제목·킥커 없이 모임소개 밴드에 카드만 이어 붙임 ──
function SubBlockVariant() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <p className={styles.subCtx}>
        ↑ 모임소개 네 번째 챕터(&lsquo;대화에만 온전히 몰입할 수 있는 공간에서&rsquo;)가
        끝난 자리 — 32px 섹션 제목 없이 카드만 이어집니다
      </p>
      <div className={styles.paperCard}>
        <span className={styles.tape} aria-hidden />
        <p className={styles.strikeLineInCard}>
          <s>나이</s> · <s>직업</s> · <s>학력</s>
        </p>
        <p className={styles.cardLead}>{LEAD}</p>
        <RuleLines />
        <DocLink onOpen={() => setOpen(true)} />
      </div>
      {open && <DocModal onClose={() => setOpen(false)} />}
    </div>
  )
}

// ── 5. 진행 방식 분리 섹션 — 규칙·질문은 전부 이미지 모달 뒤로 (운영자 구상) ──
function ProcessSectionVariant() {
  const [docOpen, setDocOpen] = useState(false)
  const steps = [
    {
      n: "01",
      label: "자기소개",
      desc: "조금 특별한 규칙의 방식대로, 원하는 모습으로 자신을 소개합니다.",
      extra: (
        <button type="button" className={`${styles.docLink} ${styles.chipInline}`} onClick={() => setDocOpen(true)}>
          자기소개 규칙 보기
        </button>
      ),
    },
    {
      n: "02",
      label: "오프닝, 질문 1~3",
      desc: "레이지데이가 제시하는 주제를 바탕으로 대화를 시작합니다.",
      extra: <QuestionGallery trigger="chip" />,
    },
    { n: "03", label: "서로의 페이지", desc: "각자 가져온 문장이나 질문을 중심으로 대화를 이어갑니다.", extra: null },
    { n: "04", label: "마무리", desc: "사유를 넓혀준 이야기를 나누며 마무리합니다.", extra: null },
  ]
  return (
    <div>
      <div className={styles.mockSteps}>
        {steps.map((s) => (
          <div key={s.n} className={styles.mockStep}>
            <span className={styles.mockNum}>{s.n}</span>
            <span>
              <span className={styles.mockLabel}>{s.label}</span>
              <span className={styles.mockDesc}>{s.desc}</span>
              {s.extra}
            </span>
          </div>
        ))}
      </div>
      <p className={styles.subCtx}>
        규칙 원문·기수별 질문이 전부 이미지 모달 — 화면에는 4단계 골격만 남습니다.
        모임소개 밴드의 진행 순서는 이 섹션으로 이사하고 밴드에서는 빠집니다.
      </p>
      {docOpen && <DocModal onClose={() => setDocOpen(false)} />}
    </div>
  )
}

// ── 6. 카드 + 질문 스트립 — 오브제 1개 + 저무게 썸네일 스트립으로 위계 차등 ──
function DuoVariant() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <Kicker />
      <div className={styles.paperCard}>
        <span className={styles.tape} aria-hidden />
        <p className={styles.strikeLineInCard}>
          <s>나이</s> · <s>직업</s> · <s>학력</s>
        </p>
        <p className={styles.cardLead}>{LEAD}</p>
        <RuleLines />
        <DocLink onOpen={() => setOpen(true)} />
      </div>
      <div className={styles.stripWrap}>
        <p className={styles.qLabel}>기수별로 실제 나눴던 질문들이에요</p>
        <QuestionGallery />
      </div>
      {open && <DocModal onClose={() => setOpen(false)} />}
    </div>
  )
}

// ── 배치 목업: 진행 순서 01~04 — 접힘 기본 (운영자 2026-08-24: "클릭한 사람만
//    명시화해서 볼 수 있고, 불필요한 정보를 줄이고자") · FAQ 미니멀 라인 문법
//    (괘선 + '+' 45° 회전 + grid-rows 애니) — 카드 안 '원문 보기' 링크와 시각 구분 ──
function PlacementMock() {
  const [open, setOpen] = useState(false)
  const steps = [
    { n: "01", label: "자기소개", desc: "위 규칙의 방식대로, 원하는 모습으로 자신을 소개합니다.", isNew: true },
    { n: "02", label: "오프닝, 질문 1~3", desc: "레이지데이가 제시하는 주제를 바탕으로 대화를 시작합니다.", isNew: false },
    { n: "03", label: "서로의 페이지", desc: "각자 가져온 문장이나 질문을 중심으로 대화를 이어갑니다.", isNew: false },
    { n: "04", label: "마무리", desc: "사유를 넓혀준 이야기를 나누며 마무리합니다.", isNew: false },
  ]
  return (
    <div className={styles.mock}>
      <p className={styles.mockCaption}>
        ↓ 채택 시 배치 — 진행 순서는 접힘 기본, 누른 사람에게만 01~04 를 펼쳐 보입니다
        (자기소개를 01 로 분리). 01 문안은 초안이며 확정 필요.
      </p>
      <button
        type="button"
        className={styles.stepsLine}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.stepsLineTitle}>진행 순서</span>
        <span className={`${styles.stepsPlus} ${open ? styles.stepsPlusOpen : ""}`} aria-hidden>+</span>
      </button>
      <div className={`${styles.stepsFold} ${open ? styles.stepsFoldOpen : ""}`}>
        <div className={styles.stepsFoldInner}>
          <div className={styles.mockSteps}>
            {steps.map((s) => (
              <div key={s.n} className={`${styles.mockStep} ${s.isNew ? styles.mockStepNew : ""}`}>
                <span className={styles.mockNum}>{s.n}</span>
                <span>
                  <span className={styles.mockLabel}>{s.label}</span>
                  <span className={styles.mockDesc}>{s.desc}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function IntroRuleDesignsPage() {
  const [variant, setVariant] = useState<VariantId>("subblock")
  const meta = VARIANTS.find((v) => v.id === variant)!

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <h1 className={styles.pageTitle}>자기소개 규칙 — 제목↔노출 구조 시안</h1>
        <p className={styles.pageSub}>
          1~3안은 제목↔노출량 조합, 4~5안은 <strong>위계</strong> 조정안입니다 —
          &ldquo;자기소개에 큰 섹션 노출이 지나치지 않나&rdquo;라는 우려(2026-08-24)에
          대한 응답으로, 4안은 섹션 제목을 없애 모임소개 안 서브블록으로, 5안은 진행
          방식을 별도 섹션으로 분리하고 규칙·질문을 전부 이미지 모달 뒤로 보냅니다.
        </p>

        <div className={styles.switcher}>
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              className={`${styles.switchBtn} ${variant === v.id ? styles.switchBtnActive : ""}`}
              onClick={() => setVariant(v.id)}
            >
              {v.name}
            </button>
          ))}
        </div>

        <div className={styles.variantMeta}>
          <p className={styles.variantName}>{meta.name}</p>
          <p className={styles.variantRef}>{meta.ref}</p>
          <p className={styles.variantDesc}>{meta.desc}</p>
        </div>

        <div className={styles.demoBand}>
          {meta.title && (
            <div className={styles.titleRow}>
              <h2 className={styles.sectionTitle}>{meta.title}</h2>
            </div>
          )}

          {variant === "expose" && <ExposeVariant />}
          {variant === "gate" && <GateVariant />}
          {variant === "partial" && <PartialVariant />}
          {variant === "subblock" && <SubBlockVariant />}
          {variant === "process" && <ProcessSectionVariant />}
          {variant === "duo" && <DuoVariant />}

          {variant !== "process" && <PlacementMock />}
        </div>
      </div>
    </div>
  )
}
