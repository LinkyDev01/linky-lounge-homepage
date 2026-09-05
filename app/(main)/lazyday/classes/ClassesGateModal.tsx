"use client"

import { useEffect, useRef, useState } from "react"
import styles from "./classes.module.css"

/**
 * 열람 암호 모달 (운영자 2026-09-05 "누구나 직접 그 자리 모달에서 입력하는 형태로").
 *
 * ⚠ **명단은 이 화면 뒤에 없다.** 모달은 가림막이 아니라 문이다 — 서버가 쿠키를 확인하기 전에는
 *   HTML 에 이름이 한 글자도 실리지 않는다(page.tsx). 뒤에 깔고 흐리게 덮는 방식이면
 *   소스 보기로 그대로 읽힌다.
 * ⚠ 닫는 버튼이 없다 — 닫아도 볼 것이 없는 자리라 '닫기'가 거짓말이 된다.
 *   Esc·바깥 클릭도 같은 이유로 받지 않는다.
 *
 * 성공하면 `location.reload()` — 서버가 쿠키를 보고 명단을 그려 내려준다.
 * (router.refresh() 는 클라이언트 캐시 경계를 타서 잠금 화면이 한 박자 남는 경우가 있다.)
 */
export function ClassesGateModal({ endpoint }: { endpoint: string }) {
  const [pw, setPw] = useState("")
  const [err, setErr] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setErr("")
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pw }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean } | null
      if (data?.ok) {
        window.location.reload()
        return // 새로고침이 뜨는 동안 로더 상태를 유지한다 (버튼이 되살아나면 두 번 눌린다)
      }
      setErr("암호가 맞지 않습니다.")
    } catch {
      setErr("잠시 후 다시 시도해 주세요.")
    }
    setLoading(false)
    inputRef.current?.select()
  }

  return (
    <div className={styles.scrim}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="gate-title">
        <h2 id="gate-title" className={styles.modalTitle}>
          열람 암호
        </h2>
        <p className={styles.modalNote}>안내받으신 암호를 입력해 주세요.</p>
        <form onSubmit={submit}>
          <input
            ref={inputRef}
            name="password"
            type="text"
            className={styles.input}
            value={pw}
            onChange={(e) => {
              setPw(e.target.value)
              if (err) setErr("")
            }}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            aria-invalid={!!err}
            aria-describedby={err ? "gate-err" : undefined}
          />
          {err && (
            <p id="gate-err" className={styles.error} role="alert">
              {err}
            </p>
          )}
          <div className={styles.actions}>
            <button type="submit" className={styles.submit} disabled={loading || !pw.trim()}>
              {loading ? "확인 중" : "열람"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
