"use client"

import { useState, useEffect, useCallback } from "react"
import { fetchMeetupsForMonth } from "@/lib/google-calendar"
import { MEETUPS } from "@/constants/lounge"
import type { Meetup } from "@/types"

interface UseGoogleCalendarMeetupsOptions {
  calendarId?: string
  apiKey?: string
  enabled?: boolean
}

interface UseGoogleCalendarMeetupsResult {
  meetups: Meetup[]
  isLoading: boolean
  error: Error | null
  refetch: () => void
}

/**
 * 구글 캘린더에서 모임 데이터를 가져오는 hook.
 * 환경 변수가 설정되지 않은 경우 기본 MEETUPS 상수를 사용합니다.
 */
export function useGoogleCalendarMeetups(
  year: number,
  month: number,
  options: UseGoogleCalendarMeetupsOptions = {}
): UseGoogleCalendarMeetupsResult {
  const {
    calendarId = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_ID || 'e7aa933e2731ec29bab190a7779bef50a475643004f48724bb538f5a8bc9bf44@group.calendar.google.com',
    apiKey = process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY || 'AIzaSyBAZ_CiH2CAcXZqt63RqX4_lRwL4xeHcKw',
    enabled = true,
  } = options

  const [meetups, setMeetups] = useState<Meetup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const isConfigured = Boolean(calendarId && apiKey)

  const fetchData = useCallback(async () => {
    // 구글 캘린더가 설정되지 않은 경우 기본 데이터 사용
    if (!isConfigured || !enabled) {
      const filtered = MEETUPS.filter((m) => {
        const meetupDate = new Date(m.date)
        return meetupDate.getFullYear() === year && meetupDate.getMonth() === month
      })
      setMeetups(filtered)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchMeetupsForMonth(
        { calendarId: calendarId!, apiKey: apiKey! },
        year,
        month
      )
      setMeetups(data)
    } catch (err) {
      console.error("Failed to fetch Google Calendar events:", err)
      setError(err instanceof Error ? err : new Error("Unknown error"))
      // 에러 시 기본 데이터로 폴백
      const filtered = MEETUPS.filter((m) => {
        const meetupDate = new Date(m.date)
        return meetupDate.getFullYear() === year && meetupDate.getMonth() === month
      })
      setMeetups(filtered)
    } finally {
      setIsLoading(false)
    }
  }, [calendarId, apiKey, year, month, enabled, isConfigured])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    meetups,
    isLoading,
    error,
    refetch: fetchData,
  }
}
