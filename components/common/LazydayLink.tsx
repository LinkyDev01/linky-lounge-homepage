"use client"

import Link from "next/link"
import type { ComponentProps } from "react"
import { useBasePath } from "@/hooks/use-base-path"

type Props = Omit<ComponentProps<typeof Link>, "href"> & { href: string }

/**
 * 책클럽 내부 링크. href는 /lazyday 프리픽스 없이 적는다(예: "/apply", "/").
 * 호스트에 따라 "/lazyday/apply"(linkylounge) 또는 "/apply"(책클럽 도메인)로 자동 렌더된다.
 */
export function LazydayLink({ href, ...props }: Props) {
  const base = useBasePath()
  const full = href === "/" ? base || "/" : `${base}${href}`
  return <Link href={full} {...props} />
}
