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
      <Arrow d="M 860 120 V 150 H 606" dashed red label="로그인 직후: localStorage 카트·저장 → 서버 이관 (한 번)" lx={600} ly={172} />
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
