"use client"

// 로컬 카트·저장 스토어 — 로그인 DB 도입 전 임시 (localStorage, 라운드 10).
// 회원 체계 도입 시 서버 저장으로 승격한다.

import { useCallback, useEffect, useState } from "react"

export type CartItem = {
  id: string
  name: string
  price: number | null
  /** LazyclubLink 기준 내부 경로 (상세 페이지) */
  href: string
  img?: string
}

const CART_KEY = "lazyday_cart_v1"
const SAVED_KEY = "lazyday_saved_v1"
const EVENT = "lazyday-store-change"

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(new Event(EVENT))
  } catch {
    /* 저장 불가 환경 무시 */
  }
}

function useStoreValue<T>(key: string, fallback: T): T {
  const [value, setValue] = useState<T>(fallback)
  useEffect(() => {
    const sync = () => setValue(read(key, fallback))
    sync()
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", sync)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return value
}

export function useCart() {
  const items = useStoreValue<CartItem[]>(CART_KEY, [])
  const add = useCallback((item: CartItem) => {
    const cur = read<CartItem[]>(CART_KEY, [])
    if (cur.some((i) => i.id === item.id)) return false // 중복 담기 방지
    write(CART_KEY, [...cur, item])
    return true
  }, [])
  const remove = useCallback((id: string) => {
    write(
      CART_KEY,
      read<CartItem[]>(CART_KEY, []).filter((i) => i.id !== id),
    )
  }, [])
  const clear = useCallback(() => write(CART_KEY, []), [])
  return { items, add, remove, clear, count: items.length }
}

export function useSaved() {
  const ids = useStoreValue<string[]>(SAVED_KEY, [])
  const toggle = useCallback((id: string) => {
    const cur = read<string[]>(SAVED_KEY, [])
    const next = cur.includes(id) ? cur.filter((v) => v !== id) : [...cur, id]
    write(SAVED_KEY, next)
    return next.includes(id)
  }, [])
  const has = useCallback((id: string) => ids.includes(id), [ids])
  return { ids, toggle, has }
}
