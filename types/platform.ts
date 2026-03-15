export interface CleaningItem {
  id: string
  name: string
  price: number
  time: number // 분 단위
}

export interface ProblemItem {
  title: string
  items: string[]
}
