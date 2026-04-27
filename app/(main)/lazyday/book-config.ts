export type Book = {
  week: number
  weekLabel: string
  title: string
  author: string
  quotes: string[]
  paragraphs: string[]
  curatorNote: string
  imagePath: string
}

export type SeasonConfig = {
  season: number
  label: string
  dateRange: string
  books: Book[]
}

export const season1Config: SeasonConfig = {
  season: 1,
  label: "1기",
  dateRange: "",
  books: [
    {
      week: 1,
      weekLabel: "1회차",
      title: "어린 왕자",
      author: "생텍쥐페리",
      quotes: ["어른들이란 그렇다. 그렇다고 그런 걸로 어른들을 탓해서는 안 된다. 어린이들은 어른들에게 너그러워야 한다."],
      paragraphs: ["어린 왕자가 만난 소유욕 강한 사업가, 박수받길 원하는 허영쟁이, 명령만 내리는 왕. 어릴 땐 그저 풍자적인 캐릭터였지만, 사회생활을 하며 다시 펼친 이 책 속에는 인지하지 못했던 나의 모습이 투영되어 있습니다."],
      curatorNote: "어린 왕자의 시선에서 바라보는 세상을 통해 어쩌면 낯설지도 모르는 나의 내면을 발견하게 됩니다.",
      imagePath: "/linky-lounge/book-club/books/little-prince.jpg",
    },
    {
      week: 2,
      weekLabel: "2회차",
      title: "부처님 말씀대로 살아보니",
      author: "토니 페르난도",
      quotes: ["마음은 언제든 바뀔 수 있고, 언젠가는 바뀌기 마련이라는 사실을 기억해야 한다."],
      paragraphs: ["정신과 의사가 쓴 이 책은 종교 서적이 아니라, 마음의 고통을 다루는 '임상 매뉴얼'에 가깝습니다. 정답을 강요하지 않고 선택지를 제안하죠."],
      curatorNote: "막연한 위로보다 내 삶에 바로 대입해 볼 수 있는 구체적인 기준이 필요했습니다. 저자가 제시한 방법을 따라가며 나에게 맞는 것이 있는지, 각각의 멤버들마다 '이것'을 어떻게 생각하는지 이야기를 나눠볼 수 있습니다.",
      imagePath: "/linky-lounge/book-club/books/buddhist-words.jpg",
    },
    {
      week: 3,
      weekLabel: "3회차",
      title: "엥케이리디온",
      author: "에픽테토스",
      quotes: ["사람을 불안하게 만드는 것은 사건 자체가 아니라, 사건에 대한 우리의 판단이다."],
      paragraphs: ["2,000년 전 노예였던 에픽테토스는 우리에게 묻습니다. \"그게 네 마음대로 할 수 있는 일이야?\" 이 짧은 고전은 우리가 휘둘렸던 수많은 관계와 성과들이 사실 '내 소관'이 아니었음을 깨닫게 합니다."],
      curatorNote: "퇴근 후에도 일과 사람 생각에 잠 못 드는 우리에게 가장 필요한 책일지도 모릅니다. 내려놓지 못하는 것, 어느새 바뀌게 된 나의 관점들을 모임에서 털어놓아 봅니다.",
      imagePath: "/linky-lounge/book-club/books/enchiridion.jpg",
    },
    {
      week: 4,
      weekLabel: "4회차",
      title: "시지프 신화",
      author: "알베르 카뮈",
      quotes: ["그럼에도, 남김없이 살아갈 것이다."],
      paragraphs: ["매일 돌을 굴려 올리는 시지프의 삶은 어쩌면 매일 출근하고 퇴근하는 우리의 일상과 닮아 있습니다. 카뮈는 이 허무함 속에서 비로소 '자유'와 '열정'을 찾으라고 말합니다."],
      curatorNote: "1기 모임의 마침표를 찍으며, \"그래서 우리는 왜 계속 살아가야 하는가\"라는 묵직한 질문에 각자의 답을 내리기 위해서입니다. 마지막 회차가 끝날 때, 우리는 조금 더 가벼워진 마음으로 돌을 굴릴 수 있게 됩니다.",
      imagePath: "/linky-lounge/book-club/books/myth-of-sisyphus.jpg",
    },
  ],
}

export const season2Config: SeasonConfig = {
  season: 2,
  label: "2기",
  dateRange: "5.21 – 7.5",
  books: [
    { week: 1, weekLabel: "1회차", title: "가장 짧은 날의 철학", author: "이중녕", quotes: [], paragraphs: [], curatorNote: "", imagePath: "/linky-lounge/book-club/books/2기-1-가장짧은날의철학.jpg" },
    { week: 2, weekLabel: "2회차", title: "브람스를 좋아하세요...", author: "프랑수아즈 사강", quotes: [], paragraphs: [], curatorNote: "", imagePath: "/linky-lounge/book-club/books/2기-2-브람스를좋아하세요.jpg" },
    { week: 3, weekLabel: "3회차", title: "사랑의 기술", author: "에리히 프롬", quotes: [], paragraphs: [], curatorNote: "", imagePath: "/linky-lounge/book-club/books/2기-3-사랑의기술.jpg" },
    { week: 4, weekLabel: "4회차", title: "이방인", author: "알베르 카뮈", quotes: [], paragraphs: [], curatorNote: "", imagePath: "/linky-lounge/book-club/books/2기-4-이방인.jpg" },
  ],
}
