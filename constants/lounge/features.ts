import { Users, Globe, Moon, Heart, MapPin, Clock } from "lucide-react"
import type { Feature, SpaceInfo } from "@/types"

export const LOUNGE_FEATURES: Feature[] = [
  {
    icon: Users,
    title: "게더링",
    description: "복잡한 일상을 잠시 멈추고, 함께 모인 사람들과의 대화에만 집중하는 시간",
  },
  {
    icon: Globe,
    title: "외국어 회화",
    description: "웃고 떠들며 자연스럽게 배우는 언어! 원어민(또는 원어민 회화 수준) 호스트와 함께하는 회화 스터디",
  },
  {
    icon: Moon,
    title: "몰입의 밤",
    description: "스마트폰과 알림에서 벗어나, 오직 자신의 작업과 내면, 그리고 함께하는 사람에게 집중하는 3시간의 몰입 의식(Ritual)",
  },
]

export const LOUNGE_GOALS: Feature[] = [
  {
    icon: Heart,
    title: "경험의 공간",
    description: "모임이 필요한 사람에게 특별한 경험을 선사합니다",
  },
  {
    icon: Users,
    title: "목적 있는 만남",
    description: "취향과 관심사를 공유하는 사람들과의 연결",
  },
  {
    icon: MapPin,
    title: "최적의 위치",
    description: "접근성이 좋은 도심 속 프라이빗 공간",
  },
  {
    icon: Clock,
    title: "유연한 운영",
    description: "다양한 시간대와 형태의 모임 지원",
  },
]

export const SPACE_INFO: SpaceInfo = {
  name: "링키라운지",
  capacity: "5-20명",
  description:
    "소규모 파티부터 네트워킹 모임까지, 다양한 목적에 맞게 활용할 수 있는 유연한 공간입니다.",
  highlights: [
    "따뜻한 세이지 그린 톤의 인테리어",
    "최대 20명까지 수용 가능",
    "와인 파티, 독서 모임 등 다양한 프로그램 운영",
    "프라이빗한 분위기 보장",
  ],
}
