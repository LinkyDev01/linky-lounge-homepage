/**
 * 여정·설계 흐름도 4종 — 손좌표 SVG (운영자 2026-08-18 "그릴 수 있는 건 좀 그려줘.
 * 텍스트 및 표로만 나열하면 여정 같은 흐름도가 전혀 보이지 않아").
 * 외부 라이브러리 없이 박스·화살표만. 모바일에선 가로 스크롤 컨테이너가 감싼다.
 * 상태색은 문서 범례와 동일: 초록 구현 · 노랑 임시 · 빨강 없음.
 */

const C = { done: "#4a8f5c", temp: "#d9a222", none: "#c04a3a", ink: "#1a1208", sub: "#8a7660", line: "#b7a894" }

function Box({ x, y, w = 118, h = 44, label, sub, status, dashed }: {
  x: number; y: number; w?: number; h?: number; label: string; sub?: string
  status?: keyof typeof C | "plain"; dashed?: boolean
}) {
  const stroke = status && status !== "plain" ? C[status as "done"] : "rgba(26,18,8,0.35)"
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={9} fill="#fffdf8" stroke={stroke}
        strokeWidth={status && status !== "plain" ? 2 : 1.2} strokeDasharray={dashed ? "5 4" : undefined} />
      <text x={x + w / 2} y={y + (sub ? h / 2 - 4 : h / 2 + 4)} textAnchor="middle" fontSize={13} fontWeight={700} fill={C.ink}>{label}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" fontSize={10} fill={C.sub}>{sub}</text>}
    </g>
  )
}

function Arrow({ d, dashed, red, label, lx, ly }: { d: string; dashed?: boolean; red?: boolean; label?: string; lx?: number; ly?: number }) {
  return (
    <g>
      <path d={d} fill="none" stroke={red ? C.none : C.line} strokeWidth={1.6}
        strokeDasharray={dashed ? "5 4" : undefined} markerEnd={red ? "url(#ahR)" : "url(#ah)"} />
      {label && <text x={lx} y={ly} fontSize={10.5} fill={red ? C.none : C.sub} textAnchor="middle">{label}</text>}
    </g>
  )
}

function Defs() {
  return (
    <defs>
      <marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill={C.line} />
      </marker>
      <marker id="ahR" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10 z" fill={C.none} />
      </marker>
    </defs>
  )
}

/** ① 전체 여정 흐름도 — 레인 2개 + 회원 기반층 + 재방문 루프 */
export function JourneyFlow() {
  const y1 = 64, y2 = 148, y3 = 252 // 원데이 / 굿즈 / 회원 레인의 박스 y
  const xs = [86, 232, 378, 524, 670, 816] // 발견~이후 x
  const w = 118, h = 44
  const mid = (i: number) => xs[i] + w
  return (
    <svg viewBox="0 0 960 330" width="100%" role="img" aria-label="전체 여정 흐름도" style={{ minWidth: 720, display: "block" }}>
      <Defs />
      {/* 레인 라벨 */}
      <text x={12} y={y1 + 27} fontSize={11.5} fontWeight={700} fill={C.sub}>원데이</text>
      <text x={12} y={y2 + 27} fontSize={11.5} fontWeight={700} fill={C.sub}>굿즈</text>
      <text x={12} y={y3 + 27} fontSize={11.5} fontWeight={700} fill={C.sub}>회원</text>
      <line x1={10} y1={y3 - 34} x2={950} y2={y3 - 34} stroke="rgba(26,18,8,0.15)" strokeDasharray="3 5" />
      <text x={12} y={y3 - 42} fontSize={10} fill={C.sub}>↓ 아래는 여정을 떠받치는 기반층 (전부 미개통)</text>

      {/* 원데이 레인 */}
      <Box x={xs[0]} y={y1} label="발견" sub="인트로·홈" status="done" />
      <Box x={xs[1]} y={y1} label="탐색" sub="목록·상세" status="done" />
      <Box x={xs[2]} y={y1} label="결정" sub="카트·저장(로컬)" status="temp" />
      <Box x={xs[3]} y={y1} label="결제" sub="토스 — 심사 대기" status="temp" />
      <Box x={xs[4]} y={y1} label="참여" sub="리마인드 없음" status="temp" />
      <Box x={xs[5]} y={y1} label="이후" sub="동선 없음" status="none" />
      {[0, 1, 2, 3, 4].map((i) => (
        <Arrow key={i} d={`M ${mid(i)} ${y1 + h / 2} H ${xs[i + 1] - 4}`} />
      ))}

      {/* 굿즈 레인 — 탐색부터 시작, 발견은 공유 */}
      <Arrow d={`M ${xs[0] + w / 2} ${y1 + h} V ${y2 + h / 2 - 10} H ${xs[1] - 4}`} label="홈에서 굿즈로" lx={xs[0] + w / 2 + 50} ly={y2 + 4} />
      <Box x={xs[1]} y={y2} label="탐색" sub="샵·상세" status="done" />
      <Box x={xs[2]} y={y2} label="결정" sub="카트(로컬)" status="temp" />
      <Box x={xs[3]} y={y2} label="결제" sub="흐름 없음" status="none" />
      <Box x={xs[4]} y={y2} label="수령/배송" sub="설계 확정 필요" status="none" />
      {[1, 2, 3].map((i) => (
        <Arrow key={i} d={`M ${mid(i)} ${y2 + h / 2} H ${xs[i + 1] - 4}`} />
      ))}

      {/* 재방문 루프 — 이후 → 탐색 (지금은 끊김) */}
      <Arrow d={`M ${xs[5] + w / 2} ${y1 - 6} C ${xs[5] + w / 2} 14, ${xs[1] + w / 2} 14, ${xs[1] + w / 2} ${y1 - 6}`}
        dashed red label="재방문 루프 — 지금은 끊겨 있다 (이력·알림 없음)" lx={524} ly={46} />

      {/* 회원 기반층 */}
      <Box x={xs[2]} y={y3} label="로그인" sub="네이버·카카오·구글" status="none" />
      <Box x={xs[3]} y={y3} label="이어 하기" sub="카트·저장 동기화" status="none" />
      <Box x={xs[4]} y={y3} label="이력·재참여" sub="주문·참가 기록" status="none" />
      <Arrow d={`M ${mid(2)} ${y3 + h / 2} H ${xs[3] - 4}`} />
      <Arrow d={`M ${mid(3)} ${y3 + h / 2} H ${xs[4] - 4}`} />
      {/* 기반층 → 위 레인 지지 화살표 */}
      <Arrow d={`M ${xs[3] + w / 2} ${y3 - 6} V ${y2 + h + 6}`} dashed label="결제·카트가 계정에 붙는다" lx={xs[3] + w / 2 + 106} ly={y3 - 28} />
      <Arrow d={`M ${xs[4] + w / 2 + 30} ${y3 + h / 2} H ${xs[5] + w / 2} V ${y1 + h + 6}`} dashed label="이력이 있어야 '이후'가 생긴다" lx={xs[4] + w / 2 + 40} ly={y3 + h + 22} />
    </svg>
  )
}

/** ② DB ERD — Supabase 확정 반영 */
export function ErdDiagram() {
  return (
    <svg viewBox="0 0 960 400" width="100%" role="img" aria-label="DB 스키마 관계도" style={{ minWidth: 720, display: "block" }}>
      <Defs />
      <Box x={40} y={28} w={170} h={50} label="auth.users" sub="Supabase Auth (소셜 3사)" status="plain" />
      <Box x={40} y={140} w={170} h={50} label="profiles" sub="이름·전화·마케팅 동의" status="done" />
      <Box x={40} y={252} w={170} h={50} label="carts" sub="user_id + product_id" status="plain" />
      <Box x={40} y={330} w={170} h={50} label="saved" sub="저장(북마크)" status="plain" />
      <Box x={400} y={140} w={180} h={50} label="orders" sub="비회원 가능 (이름·전화)" status="plain" />
      <Box x={400} y={252} w={180} h={50} label="order_items" sub="수량·결제 시점 가격" status="plain" />
      <Box x={730} y={252} w={180} h={50} label="products" sub="모임·굿즈 통합 (type)" status="plain" />
      <Box x={730} y={140} w={180} h={50} label="order_shipping" sub="굿즈 포함 주문만 (조건부)" status="plain" dashed />
      <Box x={400} y={28} w={180} h={50} label="북클럽 신청 (GAS 시트)" sub="전화번호 매칭으로 연결" status="plain" dashed />

      <Arrow d="M 125 78 V 134" label="1:1" lx={138} ly={110} />
      <Arrow d="M 125 190 V 246" />
      <Arrow d="M 125 302 V 324" />
      <Arrow d="M 210 165 H 394" label="1:N (user_id, 비회원은 null)" lx={300} ly={158} />
      <Arrow d="M 490 190 V 246" label="1:N" lx={504} ly={222} />
      <Arrow d="M 580 277 H 724" label="N:1" lx={652} ly={270} />
      <Arrow d="M 580 165 H 724" dashed label="0..1 — 배송형 상품 포함 시" lx={652} ly={158} />
      <Arrow d="M 490 78 V 134" dashed label="이관은 후속 (지금은 매칭만)" lx={604} ly={110} />
      <Arrow d="M 210 290 H 250 V 372 H 820 V 308" dashed label="carts.product_id (박스 아래로 우회)" lx={520} ly={386} />
    </svg>
  )
}

/** ③ 인증 흐름 */
export function AuthFlow() {
  return (
    <svg viewBox="0 0 960 190" width="100%" role="img" aria-label="인증 흐름도" style={{ minWidth: 720, display: "block" }}>
      <Defs />
      <Box x={30} y={20} w={120} h={38} label="카카오" status="plain" />
      <Box x={30} y={76} w={120} h={38} label="네이버" status="plain" />
      <Box x={30} y={132} w={120} h={38} label="구글" status="plain" />
      <Box x={250} y={76} w={170} h={44} label="Supabase Auth" sub="OAuth 콜백 한 곳" status="plain" />
      <Box x={520} y={76} w={170} h={44} label="profiles upsert" sub="첫 로그인 시 생성" status="plain" />
      <Box x={780} y={76} w={160} h={44} label="세션" sub="이후 모든 요청에" status="plain" />
      <Arrow d="M 150 39 C 200 39, 210 90, 244 95" />
      <Arrow d="M 150 95 H 244" />
      <Arrow d="M 150 151 C 200 151, 210 104, 244 101" />
      <Arrow d="M 420 98 H 514" />
      <Arrow d="M 690 98 H 774" />
      <Arrow d="M 860 120 V 150 H 606" dashed red label="로그인 직후: localStorage 카트·저장을 서버로 이관 (한 번)" lx={600} ly={172} />
      <text x={30} y={180} fontSize={10.5} fill={C.sub}>* 네이버는 Supabase 기본 제공자가 아니라 커스텀 OIDC 연동 — 셋 중 가장 손이 간다. 어려우면 카카오·구글 먼저 열고 네이버 후속 (운영자 "어려우면 고민해보자")</text>
    </svg>
  )
}

/** ④ 주문·결제 흐름 — 조건부 배송지 분기 */
export function CheckoutFlow() {
  return (
    <svg viewBox="0 0 960 250" width="100%" role="img" aria-label="주문·결제 흐름도" style={{ minWidth: 720, display: "block" }}>
      <Defs />
      <Box x={20} y={40} w={110} h={44} label="카트" sub="주문하기" status="plain" />
      <Box x={180} y={40} w={130} h={44} label="주문서" sub="이름·전화만" status="plain" />
      {/* 분기 다이아몬드 */}
      <g>
        <polygon points="430,62 500,20 570,62 500,104" fill="#fffdf8" stroke="rgba(26,18,8,0.35)" strokeWidth={1.2} />
        <text x={500} y={56} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={C.ink}>배송형 상품</text>
        <text x={500} y={70} textAnchor="middle" fontSize={11.5} fontWeight={700} fill={C.ink}>포함?</text>
      </g>
      <Box x={620} y={20} w={130} h={40} label="배송지 입력" sub="이때만 주소를 묻는다" status="plain" />
      <Box x={620} y={110} w={130} h={40} label="토스 결제" sub="PG 심사 대기" status="temp" />
      <Box x={20} y={170} w={150} h={44} label="confirm 재검증" sub="서버가 금액 대조" status="plain" />
      <Box x={230} y={170} w={140} h={44} label="주문 확정" sub="orders 기록 (DB)" status="plain" />
      <Box x={430} y={170} w={150} h={44} label="안내 발송" sub="완료 화면 + 알림" status="plain" />
      <Arrow d="M 130 62 H 174" />
      <Arrow d="M 310 62 H 424" />
      <Arrow d="M 570 50 C 590 44, 600 40, 614 40" label="예" lx={594} ly={30} />
      <Arrow d="M 685 60 V 104" />
      <Arrow d="M 552 84 C 580 110, 594 122, 614 126" label="아니오" lx={566} ly={112} />
      <Arrow d="M 685 150 C 685 192, 400 150, 176 186" />
      <Arrow d="M 170 192 H 224" />
      <Arrow d="M 370 192 H 424" />
      <text x={20} y={238} fontSize={10.5} fill={C.sub}>* 모임만 있는 주문은 종전 그대로 주소를 묻지 않는다 — "불필요 정보 미수집" 원칙은 그대로, 필요해진 주문에만 필요한 만큼 (운영자 확정 2026-08-18)</text>
    </svg>
  )
}

/** 5. 주문 상태 머신 — 약관 제15·16조가 정의하는 전이만 존재한다 */
export function OrderStateMachine() {
  return (
    <svg viewBox="0 0 960 300" width="100%" role="img" aria-label="주문 상태 머신" style={{ minWidth: 720, display: "block" }}>
      <Defs />
      <Box x={20} y={110} w={120} h={44} label="장바구니" sub="주문 아님" status="plain" dashed />
      <Box x={190} y={110} w={130} h={44} label="결제 대기" sub="선점 만료 있음" status="temp" />
      <Box x={390} y={110} w={130} h={44} label="결제 완료" sub="계약 성립" status="done" />
      <Box x={600} y={40} w={140} h={44} label="참가 완료" sub="모임 개최됨" status="done" />
      <Box x={600} y={180} w={140} h={44} label="환불 신청" sub="신청 시각 기록" status="temp" />
      <Box x={800} y={180} w={140} h={44} label="환불 완료" sub="금액 산정 확정" status="done" />
      <Box x={390} y={210} w={130} h={40} label="자동 취소" sub="선점 만료" status="none" />
      <Arrow d="M 140 132 H 184" label="주문하기" lx={162} ly={124} />
      <Arrow d="M 320 132 H 384" label="결제 승인" lx={352} ly={124} />
      <Arrow d="M 520 124 C 560 118, 570 70, 594 66" label="개최" lx={556} ly={92} />
      <Arrow d="M 520 146 C 560 158, 570 196, 594 200" label="신청" lx={556} ly={182} />
      <Arrow d="M 740 202 H 794" />
      <Arrow d="M 255 154 V 230 H 384" red label="만료" lx={300} ly={224} />
      <text x={20} y={272} fontSize={10.5} fill={C.sub}>* 환불 금액은 상태가 아니라 &lsquo;신청 시각과 모임 시작일&rsquo; 로 계산된다 (약관 §15). 그래서 상태 필드가 아니라 refunds 행이 필요하다.</text>
      <text x={20} y={288} fontSize={10.5} fill={C.sub}>* 개최된 모임과 무단 불참은 환불 신청 자체가 성립하지 않는다. 회사 사정 취소는 이 경로를 건너뛰고 전액 환불 또는 이월.</text>
    </svg>
  )
}

/** 6. 기수제 모임 흐름 — 일회성과 규칙이 다르다 (약관 제4조 개별약관 우선) */
export function SeasonFlow() {
  return (
    <svg viewBox="0 0 960 200" width="100%" role="img" aria-label="기수제 모임 흐름" style={{ minWidth: 720, display: "block" }}>
      <Defs />
      <Box x={20} y={70} w={120} h={44} label="신청" sub="폼 제출" status="done" />
      <Box x={190} y={70} w={130} h={44} label="인터뷰" sub="서면·전화" status="done" />
      <Box x={370} y={70} w={130} h={44} label="합격 안내" sub="운영자 판단" status="temp" />
      <Box x={550} y={70} w={130} h={44} label="결제" sub="여기서 주문 생성" status="temp" />
      <Box x={730} y={70} w={140} h={44} label="기수 참가 확정" sub="회차 5회" status="temp" />
      <Arrow d="M 140 92 H 184" />
      <Arrow d="M 320 92 H 364" />
      <Arrow d="M 500 92 H 544" />
      <Arrow d="M 680 92 H 724" />
      <text x={20} y={150} fontSize={10.5} fill={C.sub}>* 신청·인터뷰는 결제 이전이라 &lsquo;주문&rsquo;이 아니다. applications 로 분리하고, 결제 시점에 비로소 orders 가 생겨 둘이 연결된다.</text>
      <text x={20} y={168} fontSize={10.5} fill={C.sub}>* 현재 이 흐름 전체가 GAS 시트에 있다. DB 이관은 원데이 주문이 자리 잡은 뒤 후속 — 지금은 전화번호로 회원과 매칭만.</text>
      <text x={20} y={186} fontSize={10.5} fill={C.none}>* 일회성 모임의 &lsquo;바로 결제&rsquo; 와 달리 승인 단계가 있다. 같은 테이블에 억지로 넣으면 두 규칙이 서로를 오염시킨다.</text>
    </svg>
  )
}

/** 7. ERD v3 — 규칙에서 도출. 보존기간이 다른 것을 같은 행에 두지 않는다(R9) */
export function ErdV3() {
  const zone = (x: number, y: number, w: number, h: number, label: string, color: string) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} fill="none" stroke={color} strokeWidth={1} strokeDasharray="6 5" opacity={0.85} />
      <text x={x + 10} y={y + 16} fontSize={10.5} fill={color} fontWeight={700}>{label}</text>
    </g>
  )
  return (
    <svg viewBox="0 0 960 470" width="100%" role="img" aria-label="DB 스키마 관계도 v3" style={{ minWidth: 760, display: "block" }}>
      <Defs />
      {zone(14, 30, 250, 250, "회원 — 탈퇴 시 파기", C.done)}
      {zone(300, 30, 380, 300, "법정 보존 5년 — 삭제 요청으로도 못 지움", C.none)}
      {zone(300, 350, 380, 98, "모임 종료 후 1년 뒤 파기", C.temp)}
      {zone(716, 30, 232, 300, "카탈로그 — 개인정보 아님", C.sub)}
      <Box x={40} y={52} w={190} h={46} label="auth.users" sub="Supabase Auth" status="plain" />
      <Box x={40} y={130} w={190} h={46} label="profiles" sub="이름·전화·동의(R10)" status="done" />
      <Box x={40} y={208} w={190} h={46} label="carts · saved" sub="로그인 시 이관" status="done" />
      <Box x={330} y={52} w={190} h={46} label="orders" sub="order_no(R1)·비회원 가능(R11)" status="none" />
      <Box x={330} y={130} w={190} h={46} label="order_items" sub="가격 스냅샷(R2)" status="none" />
      <Box x={330} y={208} w={190} h={46} label="refunds" sub="신청 시각·사유·산정(R4·R5)" status="none" />
      <Box x={330} y={270} w={190} h={44} label="order_shipping" sub="배송형 포함 시에만" status="none" dashed />
      <Box x={330} y={378} w={190} h={46} label="participants" sub="참가자 본인(R3) — 양도 불가" status="temp" />
      <Box x={740} y={52} w={190} h={46} label="products" sub="모임·제품 통합(type)" status="plain" />
      <Box x={740} y={130} w={190} h={46} label="holds" sub="결제 중 선점·만료(R7)" status="plain" />
      <Box x={740} y={208} w={190} h={46} label="applications" sub="기수제 신청·인터뷰(R6)" status="plain" dashed />
      <Arrow d="M 135 98 V 124" label="1:1" lx={148} ly={114} />
      <Arrow d="M 135 176 V 202" />
      <Arrow d="M 230 153 H 324" label="1:N · nullable" lx={277} ly={146} />
      <Arrow d="M 425 98 V 124" label="1:N" lx={438} ly={114} />
      <Arrow d="M 425 176 V 202" label="0:N" lx={438} ly={192} />
      <Arrow d="M 425 254 V 266" />
      <Arrow d="M 380 176 C 250 250, 250 330, 356 372" label="주문당 참가자 N" lx={238} ly={352} />
      <Arrow d="M 520 68 H 734" label="order_items 가 products 를 참조" lx={628} ly={60} />
      <Arrow d="M 734 153 C 640 153, 560 120, 520 105" dashed label="선점" lx={640} ly={140} />
      <Arrow d="M 740 231 C 640 231, 560 120, 524 100" dashed label="결제 시 연결" lx={648} ly={216} />
      <text x={14} y={462} fontSize={10.5} fill={C.sub}>* 구획(점선)은 보존기간이다. 참가자 개인정보를 orders 에서 떼어낸 것이 R9 의 직접 결과 — 붙여 두면 5년 보존과 1년 파기가 한 행에서 충돌해 어느 쪽도 못 지킨다.</text>
    </svg>
  )
}
