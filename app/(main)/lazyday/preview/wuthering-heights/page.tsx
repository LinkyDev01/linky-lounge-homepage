"use client"

import { useState } from "react"
import { Nanum_Pen_Script } from "next/font/google"
import styles from "./wuthering.module.css"
import {
  PRINCIPLES,
  INTRO_RULES,
  GUIDE,
  PHASES,
  NODES,
  EDGES,
  type EdgeType,
  type Node,
} from "./session-data"

/**
 * 폭풍의 언덕 진행자 콘솔 — 첨부 JSX(다크 콘솔)의 콰이어트 에디토리얼 재구성.
 * 배경 A(#f7f3ee) 위 종이 낱장 카드, 접힘은 FAQ 미니멀 라인 문법,
 * 관계도는 종이 오브제(크기 고정 ≤420px)로. 원고 텍스트는 원문 그대로.
 * 반응형: 390 문법 유지, 680+ 칼럼 560 중앙, 데스크톱은 여백만 확장.
 */

const penScript = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  preload: false,
})

// 관계 유형별 잉크 — 사랑은 브랜드 주황, 증오만 채도 낮춘 레드 액센트 (기능적 범주 구분)
const EDGE_STYLE: Record<EdgeType, { stroke: string; width: number; dash: string; mark: string }> = {
  blood: { stroke: "#b8a88f", width: 1.2, dash: "", mark: "━" },
  love: { stroke: "#d2691e", width: 2.4, dash: "", mark: "━" },
  marry: { stroke: "#8a6a50", width: 1.6, dash: "", mark: "━" },
  hate: { stroke: "#a05545", width: 1.6, dash: "5 4", mark: "╌" },
}

// 카드 기울임·테이프 회전 — 월력 시트 문법 (제각각, 결정적)
const SHEET_ROT = [0.4, -0.45, 0.3, -0.35]
const TAPE_ROT = [-2.5, 2, -1.5, 2.5]

type Tab = "guide" | "map" | "story"

export default function WutheringSessionPage() {
  const [tab, setTab] = useState<Tab>("guide")
  const [phase, setPhase] = useState(0)
  const [sel, setSel] = useState<string | null>(null)
  const [activeQ, setActiveQ] = useState("opening")
  const [open, setOpen] = useState<Record<string, boolean>>({})

  const toggle = (k: string) => setOpen((o) => ({ ...o, [k]: !o[k] }))

  const p = PHASES[phase]
  const st = p.s
  const shown = (n: Node) => n.born <= st
  const dead = (n: Node) => n.died !== null && st >= n.died
  const nodeById = (id: string) => NODES.find((n) => n.id === id)!
  const activeEdges = EDGES.filter((e) => st >= e.from && st <= e.to)
  // 캐서린 사후 국면 — 사랑 선은 점선(유령의 결속)으로
  const ghostLove = st > 1 && st < 4

  const selNode = sel ? nodeById(sel) : null
  const selEdges = sel
    ? EDGES.filter((e) => (e.a === sel || e.b === sel) && st >= e.from && st <= e.to)
    : []

  const goMap = (ph: number) => {
    setPhase(ph)
    setSel(null)
    setTab("map")
  }
  const goGuide = (qid: string) => {
    setActiveQ(qid)
    setTab("guide")
  }

  const q = GUIDE.find((g) => g.id === activeQ)

  const flowItems = [
    { id: "intro", label: "자기소개" },
    ...GUIDE.map((g) => ({ id: g.id, label: g.tag })),
    { id: "part2", label: "2부" },
    { id: "closing", label: "마무리" },
  ]

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* ── 헤더 ── */}
        <header>
          <div className={styles.eyebrow}>레이지데이 북클럽 · 3기 2회차</div>
          <h1 className={styles.title}>폭풍의 언덕</h1>
          <div className={styles.subtitle}>에밀리 브론테 · 민음사 세계문학전집 138 · 진행자 콘솔</div>
          <div className={styles.titleRule} />
        </header>

        {/* ── 탭 ── */}
        <div className={styles.tabs}>
          {(
            [
              ["guide", "진행"],
              ["map", "관계도"],
              ["story", "스토리"],
            ] as [Tab, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`${styles.tabBtn} ${tab === k ? styles.tabBtnActive : ""}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ═══ 진행 탭 ═══ */}
        {tab === "guide" && (
          <>
            {/* 세션 흐름 */}
            <div className={styles.flowRow}>
              {flowItems.map((s, i) => (
                <span key={s.id} style={{ display: "contents" }}>
                  {i > 0 && <span className={styles.flowDot}>·</span>}
                  <button
                    onClick={() => setActiveQ(s.id)}
                    className={`${styles.flowBtn} ${activeQ === s.id ? styles.flowBtnActive : ""}`}
                  >
                    {s.label}
                  </button>
                </span>
              ))}
            </div>

            {/* 운용 원칙 — 접힘 */}
            <div className={styles.colList} style={{ marginBottom: 26 }}>
              <div className={styles.colItem}>
                <button className={styles.colQ} onClick={() => toggle("pr")}>
                  <span className={styles.colQText}>세션 운용 가이드라인</span>
                  <span className={`${styles.colIcon} ${open.pr ? styles.colIconOpen : ""}`}>+</span>
                </button>
                <div className={`${styles.colBody} ${open.pr ? styles.colBodyOpen : ""}`}>
                  <div className={styles.colBodyInner}>
                    <div className={styles.colContent}>
                      {PRINCIPLES.map((t, i) => (
                        <div key={i} className={styles.numRow}>
                          <span className={styles.numIdx}>{i + 1}</span>
                          <span>{t}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 자기소개 */}
            {activeQ === "intro" && (
              <section className={styles.sheet} style={{ transform: `rotate(${SHEET_ROT[0]}deg)` }}>
                <div className={styles.tape} style={{ transform: `translateX(-50%) rotate(${TAPE_ROT[0]}deg)` }} />
                <h2 className={styles.blockTitle}>자기소개 · 익명의 공간</h2>
                <p className={styles.blockBody}>
                  나이, 직업, 학력 같은 사회적 명함과 거리를 두고 문장과 사유에만 집중하는 환경을
                  만드는 규칙 제안.
                </p>
                {INTRO_RULES.map((t, i) => (
                  <div key={i} className={styles.numRow}>
                    <span className={styles.numIdx}>{i + 1}</span>
                    <span>{t}</span>
                  </div>
                ))}
                <p className={styles.footnote}>
                  *3번 규칙은 실험적 제안. 불편하다는 의견이 나오면 유연하게 제외할 예정임을 안내.
                </p>
              </section>
            )}

            {/* 발제 질문 */}
            {q && (
              <section
                className={styles.sheet}
                style={{ transform: `rotate(${SHEET_ROT[GUIDE.indexOf(q) % SHEET_ROT.length]}deg)` }}
              >
                <div
                  className={styles.tape}
                  style={{
                    transform: `translateX(-50%) rotate(${TAPE_ROT[GUIDE.indexOf(q) % TAPE_ROT.length]}deg)`,
                  }}
                />
                <div className={styles.qHead}>
                  <span className={styles.qTag}>{q.tag.toUpperCase()}</span>
                  <span className={styles.qSrc}>{q.src}</span>
                  <button className={styles.crossLink} onClick={() => goMap(q.phase)}>
                    관계도 {PHASES[q.phase].label} →
                  </button>
                </div>
                <h2 className={styles.qTitle}>{q.title}</h2>
                <p className={styles.qSrcDesc}>
                  <strong>발췌</strong> · {q.srcDesc}
                </p>

                <div className={styles.question}>{q.question}</div>
                {q.note && <p className={styles.qNote}>*{q.note}</p>}

                <div className={styles.subQuote}>
                  <div className={styles.subQuoteText}>“{q.sub.quote}”</div>
                  <div className={styles.subQuoteBy}>{q.sub.by}</div>
                </div>

                {/* 접이식: 스크립트 / 배경 / 예상 답변 */}
                <div className={styles.colList}>
                  <div className={styles.colItem}>
                    <button className={styles.colQ} onClick={() => toggle(q.id + "s")}>
                      <span className={styles.colQText}>진행자 실전 코멘트</span>
                      <span className={`${styles.colIcon} ${open[q.id + "s"] ? styles.colIconOpen : ""}`}>+</span>
                    </button>
                    <div className={`${styles.colBody} ${open[q.id + "s"] ? styles.colBodyOpen : ""}`}>
                      <div className={styles.colBodyInner}>
                        <div className={styles.colContent}>
                          <p className={styles.script}>{q.script}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.colItem}>
                    <button className={styles.colQ} onClick={() => toggle(q.id + "b")}>
                      <span className={styles.colQText}>학문적 배경</span>
                      <span className={`${styles.colIcon} ${open[q.id + "b"] ? styles.colIconOpen : ""}`}>+</span>
                    </button>
                    <div className={`${styles.colBody} ${open[q.id + "b"] ? styles.colBodyOpen : ""}`}>
                      <div className={styles.colBodyInner}>
                        <div className={styles.colContent}>{q.bg}</div>
                      </div>
                    </div>
                  </div>
                  <div className={styles.colItem}>
                    <button className={styles.colQ} onClick={() => toggle(q.id + "d")}>
                      <span className={styles.colQText}>딥-다이버 예상 답변 ({q.divers.length})</span>
                      <span className={`${styles.colIcon} ${open[q.id + "d"] ? styles.colIconOpen : ""}`}>+</span>
                    </button>
                    <div className={`${styles.colBody} ${open[q.id + "d"] ? styles.colBodyOpen : ""}`}>
                      <div className={styles.colBodyInner}>
                        <div className={styles.colContent}>
                          {q.divers.map((d, i) => (
                            <div key={i} className={styles.diver}>
                              <div className={styles.diverK}>
                                Diver {String.fromCharCode(65 + i)} · {d.k}
                              </div>
                              <div className={styles.diverT}>{d.t}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 2부 */}
            {activeQ === "part2" && (
              <section className={styles.sheet} style={{ transform: `rotate(${SHEET_ROT[1]}deg)` }}>
                <div className={styles.tape} style={{ transform: `translateX(-50%) rotate(${TAPE_ROT[1]}deg)` }} />
                <h2 className={styles.blockTitle}>2부. 서로의 페이지</h2>
                <p className={styles.blockBody} style={{ marginBottom: 0 }}>
                  멤버들이 각자 가져온 문장이나 궁금증을 중심으로 이어간다. 책의 텍스트에서 시작된
                  이야기가 자연스럽게 실제 삶과 맞닿는 시간. 발언이 겹치는 논점은 1부의 질문(동일화,
                  경계선, 허무)과 연결해 심화를 유도한다.
                </p>
              </section>
            )}

            {/* 마무리 */}
            {activeQ === "closing" && (
              <section className={styles.sheet} style={{ transform: `rotate(${SHEET_ROT[2]}deg)` }}>
                <div className={styles.tape} style={{ transform: `translateX(-50%) rotate(${TAPE_ROT[2]}deg)` }} />
                <h2 className={styles.blockTitle}>마무리</h2>
                <p className={styles.blockBody}>
                  “오늘, 모임을 통해 얻게 된 새로운 생각이나 발견이 있었나요?” 를 물으며 한 가지씩
                  마음에 남기고 마무리한다.
                </p>
                <p className={styles.footnote}>*다음 모임 도서에 대한 짧은 예고 전달.</p>
              </section>
            )}
          </>
        )}

        {/* ═══ 관계도 탭 ═══ */}
        {tab === "map" && (
          <>
            <div className={styles.phaseRow}>
              {PHASES.map((ph) => (
                <button
                  key={ph.id}
                  onClick={() => {
                    setPhase(ph.id)
                    setSel(null)
                  }}
                  className={`${styles.phaseBtn} ${phase === ph.id ? styles.phaseBtnActive : ""}`}
                >
                  <div className={styles.phaseLabel}>{ph.label}</div>
                  <div className={styles.phaseCh}>{ph.ch}</div>
                </button>
              ))}
            </div>

            <div className={`${styles.sheet} ${styles.mapSheet}`} style={{ transform: "rotate(0.3deg)" }}>
              <div className={styles.tape} style={{ transform: "translateX(-50%) rotate(-2deg)" }} />
              <svg viewBox="0 0 400 420" className={styles.mapSvg}>
                <text x="70" y="26" textAnchor="middle" fill="#a08b70" fontSize="10" letterSpacing="3">
                  워더링 하이츠
                </text>
                <text x="330" y="26" textAnchor="middle" fill="#a08b70" fontSize="10" letterSpacing="3">
                  그레인지
                </text>
                <line x1="70" y1="34" x2="70" y2="400" stroke="#4a3a2a" strokeWidth="0.5" opacity="0.14" />
                <line x1="330" y1="34" x2="330" y2="400" stroke="#4a3a2a" strokeWidth="0.5" opacity="0.14" />

                {activeEdges.map((e, i) => {
                  const A = nodeById(e.a)
                  const B = nodeById(e.b)
                  if (!shown(A) || !shown(B)) return null
                  const s = EDGE_STYLE[e.type]
                  const isGhost = e.type === "love" && e.a === "catherine" && ghostLove
                  const hl = sel !== null && (e.a === sel || e.b === sel)
                  const dimmed = sel !== null && !hl
                  return (
                    <line
                      key={i}
                      x1={A.x}
                      y1={A.y}
                      x2={B.x}
                      y2={B.y}
                      stroke={s.stroke}
                      strokeWidth={hl ? s.width + 0.8 : s.width}
                      strokeDasharray={isGhost ? "2 4" : s.dash}
                      opacity={dimmed ? 0.12 : isGhost ? 0.55 : 0.8}
                      strokeLinecap="round"
                    />
                  )
                })}

                {NODES.map((n) => {
                  if (!shown(n)) return null
                  const d = dead(n)
                  const isSel = sel === n.id
                  const dimmed =
                    sel !== null && !isSel && !selEdges.some((e) => e.a === n.id || e.b === n.id)
                  return (
                    <g
                      key={n.id}
                      onClick={() => setSel(isSel ? null : n.id)}
                      style={{ cursor: "pointer" }}
                      opacity={dimmed ? 0.25 : d ? 0.5 : 1}
                    >
                      <circle
                        cx={n.x}
                        cy={n.y}
                        r={isSel ? 17 : 14}
                        fill="#fffdf8"
                        stroke={isSel ? "#d2691e" : "#4a3020"}
                        strokeWidth={isSel ? 2 : 1.4}
                        strokeDasharray={d ? "3 3" : ""}
                      />
                      {/* 성 없는 이방인 — 손그림풍 점선 겹원 */}
                      {n.house === "x" && (
                        <circle
                          cx={n.x}
                          cy={n.y}
                          r={isSel ? 21 : 18}
                          fill="none"
                          stroke="#d2691e"
                          strokeWidth="0.7"
                          opacity="0.55"
                          strokeDasharray="1 3"
                        />
                      )}
                      <text
                        x={n.x}
                        y={n.y + 30}
                        textAnchor="middle"
                        fill={d ? "#a08b70" : "#1a1208"}
                        fontSize="11.5"
                        fontWeight="600"
                      >
                        {d ? "† " : ""}
                        {n.name}
                      </text>
                    </g>
                  )
                })}
              </svg>

              <div className={styles.legend}>
                <span>
                  <span className={styles.legendMark} style={{ color: "#d2691e" }}>━</span> 사랑
                </span>
                <span>
                  <span className={styles.legendMark} style={{ color: "#8a6a50" }}>━</span> 혼인
                </span>
                <span>
                  <span className={styles.legendMark} style={{ color: "#b8a88f" }}>━</span> 혈연
                </span>
                <span>
                  <span className={styles.legendMark} style={{ color: "#a05545" }}>╌</span> 증오·지배
                </span>
                <span>† 사망</span>
              </div>
            </div>

            {selNode ? (
              <div className={styles.charDetail}>
                <div className={styles.charHead}>
                  <h2 className={styles.charName}>{selNode.name}</h2>
                  <span className={styles.charRole}>{selNode.role}</span>
                </div>
                <p className={styles.charBio}>{selNode.bio}</p>
                {selEdges.length > 0 && (
                  <div className={styles.charRels}>
                    {selEdges.map((e, i) => {
                      const other = nodeById(e.a === sel ? e.b : e.a)
                      const s = EDGE_STYLE[e.type]
                      return (
                        <div key={i} className={styles.charRel}>
                          <span className={styles.charRelDot} style={{ color: s.stroke }}>
                            {s.mark}
                          </span>
                          <span>
                            {other.name} <span className={styles.charRelType}>· {e.label}</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.mapHint}>인물을 누르면 설명과 관계가 표시됩니다</div>
            )}
          </>
        )}

        {/* ═══ 스토리 탭 ═══ */}
        {tab === "story" && (
          <>
            <div className={styles.phaseRow}>
              {PHASES.map((ph) => (
                <button
                  key={ph.id}
                  onClick={() => setPhase(ph.id)}
                  className={`${styles.phaseBtn} ${phase === ph.id ? styles.phaseBtnActive : ""}`}
                >
                  <div className={styles.phaseLabel}>{ph.label}</div>
                  <div className={styles.phaseCh}>{ph.ch}</div>
                </button>
              ))}
            </div>

            <section
              className={styles.sheet}
              style={{ transform: `rotate(${SHEET_ROT[phase % SHEET_ROT.length]}deg)` }}
            >
              <div
                className={styles.tape}
                style={{ transform: `translateX(-50%) rotate(${TAPE_ROT[phase % TAPE_ROT.length]}deg)` }}
              />
              <div className={styles.storyCh}>{p.ch}</div>
              <h2 className={styles.storyTitle}>{p.label}</h2>
              <p className={styles.storySummary}>{p.summary}</p>

              <div className={styles.divide}>
                <div className={styles.sectionLabel}>주요 사건</div>
                {p.events.map((ev, i) => (
                  <div key={i} className={styles.eventRow}>
                    <span className={styles.eventDot}>·</span>
                    <span>{ev}</span>
                  </div>
                ))}
              </div>

              <div className={styles.divide}>
                <div className={styles.sectionLabel}>장별 상세</div>
                {p.chapters.map((c, i) => (
                  <div key={c.n} className={`${styles.chapter} ${c.hl ? styles.chapterHl : ""}`}>
                    <div className={styles.chapterHead}>
                      <span className={styles.chapterN}>{c.n}</span>
                      {c.tag && (
                        <span
                          className={`${penScript.className} ${styles.chapterTag}`}
                          style={{ transform: `rotate(${i % 2 ? 2 : -2}deg)` }}
                        >
                          {c.tag}
                        </span>
                      )}
                    </div>
                    <div className={styles.chapterT}>{c.t}</div>
                  </div>
                ))}
              </div>

              {p.linked ? (
                <div className={styles.linkedRow}>
                  <span>관련 발제</span>
                  {p.linked.map((qid) => {
                    const g = GUIDE.find((x) => x.id === qid)!
                    return (
                      <button key={qid} className={styles.crossLink} onClick={() => goGuide(qid)}>
                        {g.tag} · {g.title.split(" ")[0]} →
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className={styles.briefNote}>
                  *{p.brief} · 질문 3(허무) 진행자 코멘트의 사전 브리핑 자료로 활용
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
