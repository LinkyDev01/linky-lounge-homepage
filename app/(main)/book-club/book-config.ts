export type Book = {
  week: number
  weekLabel: string
  title: string
  author: string
  tagline: string
  curatorNote: string
  quotes: string[]
  paragraphs: string[]
  note: string
  imagePath: string
}

export type Schedule = {
  name: string
  day: string
  time: string
  dates: string
}

export type SeasonConfig = {
  season: number
  sectionTitle: string
  introTitle: string
  introParagraphs: string[]
  books: Book[]
  schedules: Schedule[]
  scheduleNote: string
}

export const currentSeasonConfig: SeasonConfig = {
  season: 1,
  sectionTitle: "1기 책 일정",
  introTitle: "왜 이 네 권인가요?",
  introParagraphs: [
    "시중에 좋은 책은 많지만, 레이지데이는 '나를 정면으로 마주하게 하는 힘'이 있는 책들을 골랐습니다.",
    "고전부터 에세이까지 장르는 제각각이지만 관통하는 질문은 하나입니다. \"타인의 속도가 아닌, 나의 상태를 확인하고 있는가?\"",
    "익숙한 줄 알았던 《어린 왕자》에서 나의 집착을 발견하고, 《시지프 신화》에 이르러 비로소 '그럼에도 살아가는 나'를 긍정하게 되는 여정. 이 흐름을 따라가다 보면 마지막 페이지를 덮을 때쯤, 책보다 더 선명해진 '나'의 이야기를 만나게 될 거예요.",
  ],
  books: [
    {
      week: 1,
      weekLabel: "1회차 — 멈춘 자리",
      title: "어린 왕자",
      author: "생텍쥐페리",
      tagline: "나도 모르게 '이상한 어른'이 되어버린 지점을 발견합니다.",
      quotes: ["네가 길들인 것에 대해서는 영원히 책임이 있어."],
      paragraphs: [
        "어린 왕자가 만난 소유욕 강한 사업가, 박수받길 원하는 허영쟁이, 명령만 내리는 왕. 어릴 땐 그저 풍자적인 캐릭터였지만, 사회생활을 하며 다시 펼친 이 책 속에는 지금 나의 결핍이 투영되어 있습니다.",
      ],
      curatorNote: "가장 익숙한 텍스트에서 가장 낯선 나의 모습을 발견하기 위해서입니다. \"내가 왜 여기서 멈췄지?\"라는 질문 하나로 충분합니다.",
      note: "멈추는 캐릭터가 사람마다 달라요. 거기서 얘기가 시작돼요.",
      imagePath: "/linky-lounge/book-club/books/little-prince.jpg",
    },
    {
      week: 2,
      weekLabel: "2회차 — 나한테 맞는 것",
      title: "부처님 말씀대로 살아보니",
      author: "토니 페르난도",
      tagline: "내 삶의 해상도를 높여주는 실질적인 렌즈를 장착합니다.",
      quotes: [
        "그럴 수도 있고, 아닐 수도 있다.",
        "마음은 언제든 바뀔 수 있고, 언젠가는 바뀌기 마련이라는 사실을 기억해야 한다.",
      ],
      paragraphs: [
        "정신과 의사가 쓴 이 책은 종교 서적이 아니라, 마음의 고통을 다루는 '임상 매뉴얼'에 가깝습니다. 정답을 강요하지 않고 선택지를 제안하죠.",
      ],
      curatorNote: "막연한 위로보다 내 삶에 바로 대입해 볼 수 있는 구체적인 기준이 필요했습니다. \"이건 나랑 맞고, 이건 도저히 안 되겠다\"라는 선을 그어보며 나라는 사람의 윤곽을 확인합니다.",
      note: "\"이건 나다\" 하는 사람이 있고 \"이건 아닌데\" 하는 사람이 있어요. 그 경계가 달라서 얘기가 많이 나와요.",
      imagePath: "/linky-lounge/book-club/books/buddhist-words.jpg",
    },
    {
      week: 3,
      weekLabel: "3회차 — 내 몫",
      title: "엥케이리디온",
      author: "에픽테토스",
      tagline: "불필요한 감정 소모를 줄이고, 오직 '내 것'에만 집중합니다.",
      quotes: ["사람을 불안하게 만드는 것은 사건 자체가 아니라, 사건에 대한 우리의 판단이다."],
      paragraphs: [
        "2,000년 전 노예였던 에픽테토스는 우리에게 묻습니다. \"그게 네 마음대로 할 수 있는 일이니?\" 이 짧은 고전은 우리가 휘둘렸던 수많은 관계와 성과들이 사실 '내 소관'이 아니었음을 깨닫게 합니다.",
      ],
      curatorNote: "퇴근 후에도 일과 사람 생각에 잠 못 드는 우리에게 가장 필요한 '감정의 다이어트'를 시작하기 위해서입니다. 내려놓지 못하는 것들을 모임에서 털어놓아 봅니다.",
      note: "어떤 사람은 일에서 걸려요. 어떤 사람은 사람에서. 내려놓지 못하는 게 드러나요.",
      imagePath: "/linky-lounge/book-club/books/enchiridion.jpg",
    },
    {
      week: 4,
      weekLabel: "4회차 — 그래도 산다",
      title: "시지프 신화",
      author: "알베르 카뮈",
      tagline: "반복되는 일상이라는 형벌을 축제로 바꾸는 마지막 퍼즐입니다.",
      quotes: ["시지프가 행복하다고 상상해야 한다."],
      paragraphs: [
        "매일 돌을 굴려 올리는 시지프의 삶은 어쩌면 매일 출근하고 퇴근하는 우리의 일상과 닮아 있습니다. 카뮈는 이 허무함 속에서 비로소 '자유'와 '열정'을 찾으라고 말합니다.",
      ],
      curatorNote: "1기 모임의 마침표를 찍으며, \"그래서 우리는 왜 계속 살아가야 하는가\"라는 묵직한 질문에 각자의 답을 내리기 위해서입니다. 마지막 회차가 끝날 때, 우리는 조금 더 가벼워진 마음으로 돌을 굴릴 수 있게 됩니다.",
      note: "그래도 살게 하는 게 뭔지 물어요. 어떤 사람은 사람 이름을 대요. 어떤 사람은 아직 못 끝낸 것.",
      imagePath: "/linky-lounge/book-club/books/myth-of-sisyphus.jpg",
    },
  ],
  schedules: [
    {
      name: "목요일 저녁반",
      day: "목요일",
      time: "19:30 – 22:30",
      dates: "3/26, 4/9, 4/23, 5/7",
    },
    {
      name: "일요일 오후반",
      day: "일요일",
      time: "14:30 – 17:30",
      dates: "3/29, 4/12, 4/26, 5/10",
    },
  ],
  scheduleNote: "반 배정은 인터뷰 후 희망 일정을 반영해서 확정됩니다.",
}
