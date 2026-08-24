"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import s from "./intro-rule.module.css"
import rstyles from "../ReviewsSection.module.css"
import { useZoomGesture } from "../useZoomGesture"

/**
 * 자기소개 규칙 블록 — 프리뷰 랜딩 **실배치**용 (2026-08-24).
 *
 * 구 `preview/intro-rule-designs` 는 가짜 demo 밴드 안의 쇼케이스라
 * "실제 랜딩에서 어떻게 보이나"를 판단할 수 없었다 (운영자: "6가지 안은
 * 하나도 적용해볼 수 없잖아"). 이 컴포넌트는 같은 시안 6개를 프리뷰
 * 랜딩의 모임소개 밴드 안에 그대로 끼워 넣어 실제 맥락에서 비교하게 한다.
 *
 * 확정된 조건 (변경 금지):
 *  · 노출 항목은 나이·직업·학력 3개만 — MBTI·연봉은 어디에도 넣지 않는다
 *  · 카피는 전부 운영자 원문(온라인 공개용) 발췌·축약 — 창작 문장 없음
 *  · 모달 원문 이미지 = 구글 드라이브 "자기소개 규칙.png" 최신본
 *  · 질문 샘플 4장은 아직 플레이스홀더(SAMPLE 워터마크) — 실제 질문 카드
 *    이미지(예: "질문 2. 믿음 / 사랑의 기술")를 받으면 파일만 교체
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

/** 원문 발췌 축약 — "우리는 비로소 상대방의 명함이 아니라 그 사람이 던지는
 *  문장과 사유에만 온전히 집중할 수 있게 됩니다" */
const LEAD = (
  <>
    상대방의 명함이 아니라, 그 사람이 던지는 <strong>문장과 사유</strong>에만 온전히
    집중할 수 있도록.
  </>
)

const KICKER = "이곳을 하나의 익명의 공간으로 만들어보면 어떨까요?"
const DOC_IMG = "/linky-lounge/book-club/intro-rules/rules-doc-draft.webp"

const SAMPLE_QUESTIONS = [
  { id: "q1", img: "/linky-lounge/book-club/intro-rules/question-sample-01.webp", caption: "1기에서 나눈 질문" },
  { id: "q2", img: "/linky-lounge/book-club/intro-rules/question-sample-02.webp", caption: "2기에서 나눈 질문" },
  { id: "q3", img: "/linky-lounge/book-club/intro-rules/question-sample-03.webp", caption: "3기에서 나눈 질문" },
  { id: "q4", img: "/linky-lounge/book-club/intro-rules/question-sample-04.webp", caption: "4기에서 나눈 질문" },
]

export type IntroVariant = "off" | "expose" | "gate" | "partial" | "subblock" | "process" | "duo"

export const INTRO_VARIANTS: { id: IntroVariant; name: string; title: string; hint: string }[] = [
  { id: "off", name: "0. 없음 (현행)", title: "", hint: "지금 실사이트 그대로 — 비교 기준선" },
  { id: "expose", name: "1. 완전 노출", title: "자기소개 규칙", hint: "규칙 3줄을 스크롤에서 바로" },
  { id: "gate", name: "2. 완전 게이팅", title: "조금 특별한 자기소개 규칙", hint: "티저 제목 + 눌러야 펼쳐짐 (질문 샘플 포함)" },
  { id: "partial", name: "3. 펀치라인만 게이팅", title: "자기소개 규칙", hint: "규칙 1·2 노출, 거짓말 규칙만 클릭" },
  { id: "subblock", name: "4. 서브블록", title: "", hint: "섹션 제목 없이 카드만 — 위계 최소" },
  { id: "process", name: "5. 진행 방식 분리 섹션", title: "진행 방식", hint: "규칙·질문 전부 모달 뒤 · 독립 섹션" },
  { id: "duo", name: "6. 카드 + 질문 스트립", title: "자기소개 규칙", hint: "카드 + 낮은 질문 썸네일 스트립" },
]

// ── 원문 이미지 모달 ────────────────────────────────────────
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
    <div className={s.modal} onClick={onClose} role="dialog" aria-modal="true" aria-label="자기소개 규칙 원문">
      <button type="button" className={s.modalClose} aria-label="닫기">×</button>
      <div className={s.modalScroll}>
        <div className={s.modalFrame} onClick={(e) => e.stopPropagation()}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={DOC_IMG} alt="자기소개 규칙 전문" />
        </div>
      </div>
    </div>
  )
}

/** 질문 샘플 갤러리 — 후기 섹션 모달 UI/UX 를 코드 그대로 재사용
 *  (rstyles + useZoomGesture: 핀치줌·드래그팬·스와이프·‹›·+/−·카운터) */
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

  function onDown(e: React.PointerEvent) {
    swipeRef.current = { x: e.clientX, y: e.clientY }
    zoom.onPointerDown(e)
  }
  function onUp(e: React.PointerEvent) {
    const result = zoom.onPointerUp(e, { pointerType: e.pointerType })
    if (result.consumed) { swipeRef.current = null; return }
    const start = swipeRef.current
    swipeRef.current = null
    if (!start) return
    const dx = e.clientX - start.x
    if (Math.abs(dx) >= SWIPE_PX) slideModal(dx < 0 ? 1 : -1)
  }

  const modal = modalIdx !== null ? SAMPLE_QUESTIONS[modalIdx] : null

  return (
    <>
      {trigger === "thumbs" ? (
        <div className={s.qThumbs}>
          {SAMPLE_QUESTIONS.map((q, i) => (
            <button key={q.id} type="button" className={s.qThumb} onClick={() => setModalIdx(i)} aria-label={`${q.caption} 크게 보기`}>
              <Image src={q.img} alt={q.caption} fill sizes="90px" draggable={false} />
            </button>
          ))}
        </div>
      ) : (
        <button type="button" className={`${s.docLink} ${s.chipInline}`} onClick={() => setModalIdx(0)}>
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
              onPointerDown={onDown}
              onPointerMove={zoom.onPointerMove}
              onPointerUp={onUp}
              onPointerCancel={(e) => { swipeRef.current = null; zoom.onPointerCancel(e) }}
            >
              {SAMPLE_QUESTIONS.map((q, k) => {
                const off = k - modalIdx
                const isCur = k === modalIdx
                return (
                  <div
                    key={`qs-${q.id}`}
                    data-slide-idx={k}
                    className={`${rstyles.gallerySlideM} ${isCur ? rstyles.gallerySlideMActive : ""} ${isCur && zoom.zoomed ? rstyles.activeSlideZoomed : ""}`}
                    ref={isCur ? zoom.frameRef : undefined}
                    style={{ transform: `translateX(calc(-50% + ${off} * (var(--slide-w) + 8px)))${isCur ? "" : " scale(0.94)"}` }}
                    aria-hidden={!isCur}
                  >
                    <div ref={isCur ? zoom.layerRef : undefined} className={rstyles.zoomLayer}>
                      <Image src={q.img} alt={q.caption} fill sizes="(min-width: 721px) 80vw, 92vw" draggable={false} priority={isCur} />
                    </div>
                  </div>
                )
              })}
            </div>
            <button type="button" className={`${rstyles.galleryNav} ${rstyles.galleryNavLeft}`} onClick={(e) => { e.stopPropagation(); slideModal(-1) }} disabled={modalIdx === 0} aria-label="이전 질문">‹</button>
            <button type="button" className={`${rstyles.galleryNav} ${rstyles.galleryNavRight}`} onClick={(e) => { e.stopPropagation(); slideModal(1) }} disabled={modalIdx === SAMPLE_QUESTIONS.length - 1} aria-label="다음 질문">›</button>
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

function RuleLines() {
  return (
    <ol className={s.ruleList}>
      {RULES.map((r) => (
        <li key={r.n} className={r.star ? s.ruleStar : s.rule}>
          <span className={s.ruleNum}>{r.n}</span>
          <span className={s.ruleText}>{r.text}</span>
        </li>
      ))}
    </ol>
  )
}

function StrikeHead() {
  return (
    <p className={s.strikeHead}>
      <s>나이</s> · <s>직업</s> · <s>학력</s>
    </p>
  )
}

/** 밴드 안에 들어가는 자기소개 규칙 블록 (1·2·3·4·6안). 5안은 ProcessSection. */
export function IntroRuleBlock({ variant }: { variant: IntroVariant }) {
  const [docOpen, setDocOpen] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const meta = INTRO_VARIANTS.find((v) => v.id === variant)

  if (variant === "off" || variant === "process") return null

  const showTitle = !!meta?.title
  const tightGap = variant === "subblock"

  return (
    <div className={`${s.block} ${tightGap ? s.blockGapTight : s.blockGap}`}>
      {showTitle && (
        <div className={s.titleRow}>
          <h2 className={s.sectionTitle}>{meta!.title}</h2>
        </div>
      )}

      {/* 킥커는 제목이 있는 안에서만 — 서브블록(4)·게이팅(2)은 생략 */}
      {(variant === "expose" || variant === "partial" || variant === "duo") && (
        <p className={s.kicker}>{KICKER}</p>
      )}

      <div className={s.paperCard}>
        <span className={s.tape} aria-hidden />

        {(variant === "expose" || variant === "subblock" || variant === "duo") && <StrikeHead />}

        <p className={s.cardLead}>{LEAD}</p>

        {/* 1·4·6안 — 규칙 3줄 전부 노출 */}
        {(variant === "expose" || variant === "subblock" || variant === "duo") && (
          <>
            <RuleLines />
            <button type="button" className={s.docLink} onClick={() => setDocOpen(true)}>규칙 원문 보기</button>
          </>
        )}

        {/* 2안 — 눌러야 전부 펼쳐짐 (+ 질문 샘플) */}
        {variant === "gate" && (
          !revealed ? (
            <button type="button" className={s.gateBtn} onClick={() => setRevealed(true)}>규칙 보기</button>
          ) : (
            <div className={s.reveal}>
              <RuleLines />
              <button type="button" className={s.docLink} onClick={() => setDocOpen(true)}>규칙 원문 보기</button>
              <p className={s.qLabel}>기수별로 실제 나눴던 질문들이에요</p>
              <QuestionGallery />
            </div>
          )
        )}

        {/* 3안 — 규칙 1·2 노출, 3(거짓말)만 클릭해야 드러남 */}
        {variant === "partial" && (
          <>
            <ol className={s.ruleList}>
              {RULES.filter((r) => !r.star).map((r) => (
                <li key={r.n} className={s.rule}>
                  <span className={s.ruleNum}>{r.n}</span>
                  <span className={s.ruleText}>{r.text}</span>
                </li>
              ))}
              <li className={s.ruleStar}>
                <span className={s.ruleNum}>03</span>
                {!revealed ? (
                  <button type="button" className={s.punchlineBtn} onClick={() => setRevealed(true)}>
                    <s>나이</s>, <s>직업</s>, <s>학력</s>은 전부 <strong>거짓말</strong>해도 됩니다 — 클릭
                  </button>
                ) : (
                  <span className={`${s.ruleText} ${s.reveal}`}>{RULES[2].text}</span>
                )}
              </li>
            </ol>
            <button type="button" className={s.docLink} onClick={() => setDocOpen(true)}>규칙 원문 보기</button>
          </>
        )}
      </div>

      {/* 6안 — 카드 아래 낮은 질문 스트립 */}
      {variant === "duo" && (
        <div className={s.stripWrap}>
          <p className={s.qLabel}>기수별로 실제 나눴던 질문들이에요</p>
          <QuestionGallery />
        </div>
      )}

      {docOpen && <DocModal onClose={() => setDocOpen(false)} />}
    </div>
  )
}

/** 5안 전용 — 진행 방식 독립 섹션 (HowToBrief 를 대체). 규칙·질문은 모달 뒤. */
export function ProcessSection() {
  const [docOpen, setDocOpen] = useState(false)
  return (
    <section id="process" className={s.processSection}>
      <div className={s.processInner}>
        <div className={s.titleRow}>
          <h2 className={s.sectionTitle}>진행 방식</h2>
        </div>
        <div className={s.steps}>
          <div className={`${s.step} ${s.stepNew}`}>
            <span className={s.stepNum}>01</span>
            <span>
              <span className={s.stepLabel}>자기소개</span>
              <span className={s.stepDesc}>조금 특별한 규칙의 방식대로, 원하는 모습으로 자신을 소개합니다.</span>
              <button type="button" className={`${s.docLink} ${s.chipInline}`} onClick={() => setDocOpen(true)}>
                자기소개 규칙 보기
              </button>
            </span>
          </div>
          <div className={s.step}>
            <span className={s.stepNum}>02</span>
            <span>
              <span className={s.stepLabel}>오프닝, 질문 1~3</span>
              <span className={s.stepDesc}>레이지데이가 제시하는 주제를 바탕으로 대화를 시작합니다.</span>
              <QuestionGallery trigger="chip" />
            </span>
          </div>
          <div className={s.step}>
            <span className={s.stepNum}>03</span>
            <span>
              <span className={s.stepLabel}>서로의 페이지</span>
              <span className={s.stepDesc}>각자 가져온 문장이나 질문을 중심으로 대화를 이어갑니다. 텍스트에서 시작된 이야기가 삶과 맞닿는 시간입니다.</span>
            </span>
          </div>
          <div className={s.step}>
            <span className={s.stepNum}>04</span>
            <span>
              <span className={s.stepLabel}>마무리</span>
              <span className={s.stepDesc}>오늘 대화 중 사유를 넓혀준 이야기를 나누며 마무리합니다. 다음 모임에서 다룰 도서도 함께 안내해 드립니다.</span>
            </span>
          </div>
        </div>
      </div>
      {docOpen && <DocModal onClose={() => setDocOpen(false)} />}
    </section>
  )
}
