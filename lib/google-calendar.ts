import type { Meetup, MeetupCategory } from "@/types"

interface GoogleCalendarEvent {
  id: string
  summary: string
  description?: string
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
}

interface GoogleCalendarResponse {
  items: GoogleCalendarEvent[]
}

interface ParsedEventData {
  image?: string
  registrationUrl?: string
  category?: MeetupCategory
  price?: string
  capacity?: number
  current?: number
  maleCapacity?: number
  maleCurrent?: number
  femaleCapacity?: number
  femaleCurrent?: number
  description: string
}

/**
 * HTML 태그를 제거하고 순수 텍스트만 추출합니다.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n") // <br> 태그를 줄바꿈으로
    .replace(/<a[^>]*href="([^"]*)"[^>]*>[^<]*<\/a>/gi, " $1 ") // <a> 태그에서 href 추출
    .replace(/<[^>]+>/g, "") // 나머지 HTML 태그 제거
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
}

/**
 * Google Drive 공유 링크를 직접 이미지 URL로 변환합니다.
 */
function convertGoogleDriveUrl(url: string): string {
  // https://drive.google.com/file/d/FILE_ID/view?... 형태
  const driveMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (driveMatch) {
    return `https://lh3.googleusercontent.com/d/${driveMatch[1]}`
  }
  return url
}

/**
 * description에서 Google Drive URL을 찾아 추출합니다.
 */
function extractGoogleDriveUrl(text: string): string | undefined {
  const match = text.match(/https:\/\/drive\.google\.com\/file\/d\/[a-zA-Z0-9_-]+/)
  return match ? match[0] : undefined
}

/**
 * description에서 일반 URL을 찾아 추출합니다 (Google Drive 제외).
 */
function extractNonDriveUrl(text: string): string | undefined {
  // Google Drive가 아닌 https URL 찾기
  const urls = text.match(/https?:\/\/(?!drive\.google\.com)[^\s\[\]<>"]+/g)
  return urls ? urls[0] : undefined
}

/**
 * 구글 캘린더 이벤트 description에서 메타데이터를 파싱합니다.
 *
 * 지원하는 태그:
 * [IMAGE]https://example.com/photo.jpg[/IMAGE]
 * [LINK]https://forms.google.com/...[/LINK]
 * [CATEGORY]wine|book|network|party[/CATEGORY]
 * [PRICE]15,000원[/PRICE]
 * [CAPACITY]12[/CAPACITY]
 * [CURRENT]8[/CURRENT]
 */
function parseEventDescription(description: string | undefined): ParsedEventData {
  if (!description) {
    return { description: "" }
  }

  // 먼저 HTML 태그를 처리
  const cleanedHtml = stripHtml(description)

  // 간단한 태그 추출 (HTML 변환되지 않은 경우)
  const extractSimpleTag = (tag: string): string | undefined => {
    const regex = new RegExp(`\\[${tag}\\]([^\\[]*?)\\[\\/${tag}\\]`, "i")
    const match = cleanedHtml.match(regex)
    return match ? match[1].trim() : undefined
  }

  // IMAGE 태그 영역에서 Google Drive URL 추출
  const imageSection = cleanedHtml.match(/\[IMAGE\][\s\S]*?\[\/IMAGE\]/i)?.[0] || ""
  const imageUrl = extractGoogleDriveUrl(imageSection) || extractSimpleTag("IMAGE")

  // LINK 태그 영역에서 URL 추출 (Google Drive 제외)
  const linkSection = cleanedHtml.match(/\[LINK\][\s\S]*?\[\/LINK\]/i)?.[0] || ""
  const linkUrl = extractNonDriveUrl(linkSection) || extractSimpleTag("LINK")

  const categoryRaw = extractSimpleTag("CATEGORY")
  const price = extractSimpleTag("PRICE")
  const capacityRaw = extractSimpleTag("CAPACITY")
  const currentRaw = extractSimpleTag("CURRENT")
  const maleCapacityRaw = extractSimpleTag("MALE_CAPACITY")
  const maleCurrentRaw = extractSimpleTag("MALE_CURRENT")
  const femaleCapacityRaw = extractSimpleTag("FEMALE_CAPACITY")
  const femaleCurrentRaw = extractSimpleTag("FEMALE_CURRENT")

  // Google Drive URL 변환
  const image = imageUrl ? convertGoogleDriveUrl(imageUrl) : undefined
  const registrationUrl = linkUrl || undefined

  // 메타데이터 태그들을 제거한 순수 설명
  let cleanDescription = cleanedHtml
    .replace(/\[IMAGE\][\s\S]*?\[\/IMAGE\]/gi, "")
    .replace(/\[LINK\][\s\S]*?\[\/LINK\]/gi, "")
    .replace(/\[CATEGORY\][^\[]*?\[\/CATEGORY\]/gi, "")
    .replace(/\[PRICE\][^\[]*?\[\/PRICE\]/gi, "")
    .replace(/\[CAPACITY\][^\[]*?\[\/CAPACITY\]/gi, "")
    .replace(/\[CURRENT\][^\[]*?\[\/CURRENT\]/gi, "")
    .replace(/\[MALE_CAPACITY\][^\[]*?\[\/MALE_CAPACITY\]/gi, "")
    .replace(/\[MALE_CURRENT\][^\[]*?\[\/MALE_CURRENT\]/gi, "")
    .replace(/\[FEMALE_CAPACITY\][^\[]*?\[\/FEMALE_CAPACITY\]/gi, "")
    .replace(/\[FEMALE_CURRENT\][^\[]*?\[\/FEMALE_CURRENT\]/gi, "")
    .replace(/---+/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const validCategories: MeetupCategory[] = ["gathering", "focus", "language", "potato"]
  const category = categoryRaw && validCategories.includes(categoryRaw.trim() as MeetupCategory)
    ? (categoryRaw.trim() as MeetupCategory)
    : undefined

  return {
    image,
    registrationUrl,
    category,
    price,
    capacity: capacityRaw ? parseInt(capacityRaw, 10) : undefined,
    current: currentRaw ? parseInt(currentRaw, 10) : undefined,
    maleCapacity: maleCapacityRaw ? parseInt(maleCapacityRaw, 10) : undefined,
    maleCurrent: maleCurrentRaw ? parseInt(maleCurrentRaw, 10) : undefined,
    femaleCapacity: femaleCapacityRaw ? parseInt(femaleCapacityRaw, 10) : undefined,
    femaleCurrent: femaleCurrentRaw ? parseInt(femaleCurrentRaw, 10) : undefined,
    description: cleanDescription,
  }
}

/**
 * 구글 캘린더 이벤트를 Meetup 타입으로 변환합니다.
 */
function convertToMeetup(event: GoogleCalendarEvent, index: number): Meetup | null {
  const startDateTime = event.start.dateTime || event.start.date
  if (!startDateTime) return null

  const startDate = new Date(startDateTime)
  const endDateTime = event.end.dateTime || event.end.date
  const endDate = endDateTime ? new Date(endDateTime) : startDate

  const parsed = parseEventDescription(event.description)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const timeString = `${formatTime(startDate)} - ${formatTime(endDate)}`

  return {
    id: index + 1,
    title: event.summary || "제목 없음",
    date: startDate.toISOString().split("T")[0],
    day: startDate.getDate(),
    time: timeString,
    category: parsed.category || "gathering",
    capacity: parsed.capacity || 20,
    current: parsed.current || 0,
    price: parsed.price || "",
    description: parsed.description || event.summary || "",
    image: parsed.image || "/placeholder.svg",
    registrationUrl: parsed.registrationUrl,
    maleCapacity: parsed.maleCapacity,
    maleCurrent: parsed.maleCurrent,
    femaleCapacity: parsed.femaleCapacity,
    femaleCurrent: parsed.femaleCurrent,
  }
}

export interface FetchMeetupsOptions {
  calendarId: string
  apiKey: string
  timeMin?: Date
  timeMax?: Date
  maxResults?: number
}

/**
 * 구글 캘린더에서 이벤트를 가져와 Meetup 배열로 반환합니다.
 */
export async function fetchGoogleCalendarMeetups(
  options: FetchMeetupsOptions
): Promise<Meetup[]> {
  const {
    calendarId,
    apiKey,
    timeMin = new Date(),
    timeMax,
    maxResults = 50,
  } = options

  const params = new URLSearchParams({
    key: apiKey,
    timeMin: timeMin.toISOString(),
    maxResults: maxResults.toString(),
    singleEvents: "true",
    orderBy: "startTime",
  })

  if (timeMax) {
    params.set("timeMax", timeMax.toISOString())
  }

  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Google Calendar API error: ${response.status} ${response.statusText}`)
  }

  const data: GoogleCalendarResponse = await response.json()

  return data.items
    .map((event, index) => convertToMeetup(event, index))
    .filter((meetup): meetup is Meetup => meetup !== null)
}

/**
 * 특정 월의 이벤트만 가져옵니다.
 */
export async function fetchMeetupsForMonth(
  options: Omit<FetchMeetupsOptions, "timeMin" | "timeMax">,
  year: number,
  month: number
): Promise<Meetup[]> {
  const timeMin = new Date(year, month, 1)
  const timeMax = new Date(year, month + 1, 0, 23, 59, 59)

  return fetchGoogleCalendarMeetups({
    ...options,
    timeMin,
    timeMax,
  })
}
