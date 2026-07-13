// ============================================================
// 레이지데이 북클럽 — 통합 접수 스크립트 (완성본)
// ============================================================
// 이 파일 하나가 기존 운영 스크립트(접수 doPost/doGet + 반배정)를
// 전부 대체합니다. 시트에 바인딩된 Apps Script 프로젝트에 붙여넣으세요.
//
// (2026-07-02 동기화) 배포본 원문 기준. 변경점은 handleApply 하나:
//   신청 폼의 새 필드 '희망 요일'(preferredDays)과 '동의 시각'(consentAt)을
//   신청현황에 기록 — 두 컬럼은 없으면 첫 신청 때 맨 뒤에 자동 생성됨.
//
// 데이터 구조:
//   신청현황    — 신청 폼 제출 (1행 = 1신청). "서면 인터뷰"/"전화 인터뷰"
//                 열에 제출 여부 O/X 자동 표시, "인터뷰 일시"에 예약시간 기록
//   전화 인터뷰 — 전화 인터뷰 예약 내역 (별도 시트, 1행 = 1예약)
//   서면 인터뷰 — 서면 인터뷰 답변 (기존 그대로)
//   반배정      — 기수-요일-시간 기준 자동 반배정 (onEdit)
//
// 설치 후 1회 실행: 메뉴 [레이지데이 관리] → "전화예약 행 이전(1회)"
//   → 신청현황에 섞여 있던 전화 예약 행을 전화 인터뷰 시트로 옮기고
//     O/X 상태를 전체 재계산합니다.
// ============================================================

// ── 설정값 ──────────────────────────────────────────────────
var SHEET_ID    = "1yDy7VeJ_XkOYNfv_CXVqXy0S1UOAObgCiL4j22etfko"; // 레이지데이 북클럽 시트
var MAIN_SHEET  = "신청현황";
var PHONE_SHEET = "전화 인터뷰";
var WRITTEN_SHEET = "서면 인터뷰";
var CLASS_SHEET = "반배정";
var NOTIFY_SHEET = "4기 알림"; // 다음 기수 오픈 알림 신청 (2026-07-13)

// 확인 완료: 운영 캘린더 "레이지데이북클럽 인터뷰" (라이브 일정과 대조 검증됨)
var CALENDAR_ID = "8c67d5250aeba2aa08f4c8f8811fc6b965b7c44d57ca968378ae2d90575b8008@group.calendar.google.com";

// ── 비밀값은 코드가 아니라 '스크립트 속성'에서 읽는다 (붙여넣기/공개저장소에 노출 방지) ──
//   설정: 편집기 → 프로젝트 설정(⚙️) → 스크립트 속성 → 아래 3개 키 추가
//     ADMIN_TOKEN = Vercel ADMIN_SECRET 와 동일한 값
//     SOLAPI_KEY  = Solapi API Key
//     SOLAPI_SEC  = Solapi API Secret
var _PROPS = PropertiesService.getScriptProperties();
var ADMIN_TOKEN = _PROPS.getProperty("ADMIN_TOKEN") || "";

var ADMIN_EMAIL  = "linkylounge@gmail.com";
var SENDER_PHONE = "01074445790";
var SOLAPI_KEY   = _PROPS.getProperty("SOLAPI_KEY") || "";
var SOLAPI_SEC   = _PROPS.getProperty("SOLAPI_SEC") || "";

// 카카오 알림톡 (Solapi) — 신청자에게 발송. 템플릿은 Solapi 콘솔에서 "승인된" ID여야 함.
// (승인/변수 불일치 시 sendKakaoAlimtalk가 false → 자동으로 SMS fallback)
var KAKAO_PFID             = "KA01PF260214104943015o3o4k9QEnYH";
var KAKAO_TEMPLATE_APPLY   = "KA01TP260508044732078Nim5W0a9FgT"; // 신청 완료 (전화 인터뷰 선택 시 = 기존)
var KAKAO_TEMPLATE_APPLY_WRITTEN = "KA01TP260626000112001ipk1yKnYV9l"; // 신청 완료 (서면 인터뷰 선택 시 = 별도 안내)
var KAKAO_TEMPLATE_PHONE   = "KA01TP260508044527472ApL7vKEq4ZE"; // 전화 인터뷰 예약 완료
var KAKAO_TEMPLATE_WRITTEN = "KA01TP260508044618959Levf57dcz2q"; // 서면 인터뷰 제출 완료
var KAKAO_TEMPLATE_REMIND  = "KA01TP260622024010341GGWbJcYzjak"; // 전화 인터뷰 당일 리마인더

// 전화 인터뷰 3시간 전 리마인더 자동 발송 스위치. 템플릿 승인 완료 → 알림톡 예약 발송 ON.
var ENABLE_REMINDER = true;

// 진행 상태(선발·결제 깔때기) — 인터뷰 확인 + 결제 칼럼을 대체하는 단일 관리 칼럼.
//  (인터뷰 완료 여부는 '서면 인터뷰'/'전화 인터뷰' 칼럼이 O/대기/X로 따로 표시)
var PROGRESS_HEADER  = "진행 상태";
//  미진행: 인터뷰 X(미진행) 시 자동 기입. 나머지는 수동.
var PROGRESS_OPTIONS = ["미진행", "미결제", "결제완료", "환불", "탈락"];
var PAID_COLOR = "#d9ead3"; // 결제완료 행 색

// 인터뷰 상태(서면/전화 통합) — 방식에 따라 O / 대기 / X / 빈칸.
//  서면+전화 두 칼럼 대신 단일 칼럼. 무슨 방식인지는 '인터뷰 방식'이 답한다.
var INTERVIEW_STATUS_HEADER = "인터뷰 상태";

// 인터뷰 일시 표시 형식: 실제 날짜값 + "6/23 (화) 18:00" 표기 (요일은 시트 한국어 로캘 기준)
var SLOT_FMT = 'm/d" ("ddd") "hh:mm';

// 서면 인터뷰 질문 원문 (written 페이지와 동일하게 유지) — 이메일에 질문+답변 매핑용 폴백
//  ※ 프론트가 questions를 함께 보내면 그걸 우선 사용. 이 배열은 폴백(프론트 미전송 시)이라 동일 유지.
var WRITTEN_QUESTIONS = [
  { id: "q1", label: "Q1",
    text: "내가 가장 나다워지는 느긋한 '레이지데이'의 풍경은 무엇인가요?",
    sub:  "이른 아침 창가에서 마시는 커피 한 잔, 아무에게도 방해받지 않는 심야의 독서 등 거창하지 않은 일상의 한 장면이어도 좋습니다." },
  { id: "q2", label: "Q2",
    text: "내 가치관을 바꾸었거나 인생의 기준이 되어준 책이나 문장이 있다면 무엇인가요?",
    sub:  "삶의 방향을 바꾸어 준 책의 한 구절이나, 힘들 때마다 중심을 잡아주는 문장과 그에 얽힌 짧은 생각을 편하게 들려주세요." },
  { id: "q3", label: "Q3",
    text: "혼자 책을 읽다 보면 내 생각에 갇히기 쉽습니다. 책이나 타인을 통해 '내가 미처 생각지 못했던 맹점'을 깨달았거나, 사유가 넓어지는 경험이 있다면 무엇이었나요?",
    sub:  "내 기존 생각과 전혀 다른 의견을 접하고 신선한 자극을 받았던 순간이나, 책을 읽으며 '내가 틀렸을 수도 있겠구나' 느꼈던 경험을 편하게 적어주시면 됩니다." },
  { id: "q4", label: "Q4",
    text: "타인과 대화할 때 가장 중요하게 생각하는 나만의 태도나 원칙은 무엇인가요?",
    sub:  "상대방의 이야기를 편견 없이 끝까지 듣는 것, 혹은 적당한 맞장구보다 솔직한 의견을 주고받는 것 등 평소 대화 스타일을 적어주시면 됩니다." },
  { id: "q5", label: "Q5",
    text: "나와 정반대의 성향이나 가치관을 가진 타인을 마주할 때, 평소 어떤 감정이나 시선을 가지시나요?",
    sub:  "나와 다른 세계를 들여다보는 것 같아 흥미로움을 느끼거나, 혹은 나와 맞지 않아 조심스러워지는 마음 등 솔직한 태도를 적어주시면 모임 구성에 큰 도움이 됩니다." },
  { id: "q6", label: "Q6",
    text: "이번 시즌 레이지데이 북클럽을 마무리할 때, 도달하고 싶은 나의 삶의 모습이나 던지고 싶은 화두는 무엇인가요?",
    sub:  "마음 맞는 사람들과 깊은 대화를 나누며 일상의 생기를 얻은 모습, 혹은 평소 풀지 못했던 나만의 고민에 대한 실마리를 찾은 모습 등 기대하시는 바를 편하게 적어주세요." },
];

// ── 공통 유틸 ───────────────────────────────────────────────
function ss() { return SpreadsheetApp.openById(SHEET_ID); }

function normPhone(v) { return String(v || "").replace(/[^0-9]/g, ""); }

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet(name, headers) {
  var sheet = ss().getSheetByName(name);
  if (!sheet) {
    sheet = ss().insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold").setBackground("#f5ede4").setFontColor("#1a1208");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// 신청현황 헤더에서 열 위치 찾기 (없으면 맨 뒤에 생성)
function ensureColumn(sheet, header) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var idx = headers.indexOf(header);
  if (idx === -1) {
    idx = headers.length;
    sheet.getRange(1, idx + 1).setValue(header)
      .setFontWeight("bold").setBackground("#f5ede4").setFontColor("#1a1208");
  }
  return idx; // 0-based
}

function colIndexMap(sheet) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  headers.forEach(function (h, i) { map[String(h).trim()] = i; });
  return map;
}

// 새 행을 헤더 바로 아래(2행)에 삽입 — 최신 데이터가 항상 맨 위에 오도록.
// (appendRow는 맨 아래에 추가되므로 최신순 유지를 위해 prepend 사용)
function prependRow(sheet, values) {
  sheet.insertRowsAfter(1, 1);
  var range = sheet.getRange(2, 1, 1, values.length);
  range.setValues([values]);
  // 헤더 서식이 새 행에 복사되는 것을 방지 (일반 서식으로 초기화)
  range.setBackground(null).setFontColor(null).setFontWeight("normal");
  return range;
}

function slotLabel(start, end) {
  return Utilities.formatDate(start, "Asia/Seoul", "M/d (E) HH:mm") +
    " – " + Utilities.formatDate(end, "Asia/Seoul", "HH:mm");
}

// ── GET: 예약된 슬롯 / (adminToken 시) 관리자용 이벤트 목록 ──
function doGet(e) {
  try {
    var cal = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!cal) return jsonResponse({ success: true, bookedSlots: [] });

    var isAdmin = e && e.parameter && e.parameter.adminToken === ADMIN_TOKEN;
    var now = new Date();
    var limit = new Date(now.getTime() + (isAdmin ? 60 : 28) * 24 * 60 * 60 * 1000);
    var events = cal.getEvents(now, limit);

    var bookedSlots = events.map(function (ev) {
      var o = { start: ev.getStartTime().toISOString(), end: ev.getEndTime().toISOString() };
      if (isAdmin) { o.id = ev.getId(); o.title = ev.getTitle(); }
      return o;
    });
    return jsonResponse({ success: true, bookedSlots: bookedSlots });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ── POST: 타입별 분기 ───────────────────────────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.type === "written")         return handleWritten(data);
    if (data.type === "phone_interview") return handlePhoneBooking(data);
    if (data.type === "admin_block")     return handleAdminBlock(data);
    if (data.type === "admin_delete")    return handleAdminDelete(data);
    if (data.type === "notify")          return handleNotify(data);

    return handleApply(data); // type 없음 = 신청 폼
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ── 다음 기수(4기) 오픈 알림 신청 → '4기 알림' 시트 ─────────────
// 프론트 NextSeasonNotify 폼 (payload: type:"notify"/name/phone/marketingConsent/consentAt).
// 시트가 없으면 자동 생성 + 헤더는 ensureColumn으로 보장 (수동 작업 불필요).
function handleNotify(d) {
  if (!d.name || !d.phone) {
    return jsonResponse({ success: false, error: "필수 항목 누락" });
  }
  var sheet = ss().getSheetByName(NOTIFY_SHEET);
  if (!sheet) {
    sheet = ss().insertSheet(NOTIFY_SHEET);
    // 빈 시트는 getLastColumn()이 0이라 ensureColumn이 못 읽음 — 첫 헤더 셀 선시드
    sheet.getRange(1, 1).setValue("신청일자")
      .setFontWeight("bold").setBackground("#f5ede4").setFontColor("#1a1208");
  }
  ensureColumn(sheet, "이름");
  ensureColumn(sheet, "전화번호");
  ensureColumn(sheet, "마케팅 동의");
  ensureColumn(sheet, "동의 시각");
  var col = colIndexMap(sheet);
  var row = new Array(sheet.getLastColumn()).fill("");
  row[col["신청일자"]]    = new Date();
  row[col["이름"]]        = d.name || "";
  row[col["전화번호"]]    = d.phone || "";
  row[col["마케팅 동의"]] = d.marketingConsent || "";
  row[col["동의 시각"]]   = d.consentAt ? new Date(d.consentAt) : "";
  prependRow(sheet, row);
  if (d.consentAt && col["동의 시각"] != null) {
    sheet.getRange(2, col["동의 시각"] + 1).setNumberFormat("yyyy-mm-dd hh:mm");
  }

  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "[레이지데이 북클럽] 4기 오픈 알림 신청 — " + (d.name || "?") + "님",
    body: "4기 오픈 알림 신청이 접수되었습니다.\n\n" +
          "이름: " + (d.name || "-") + "\n" +
          "연락처: " + (d.phone || "-") + "\n" +
          "마케팅 동의: " + (d.marketingConsent || "-") + "\n\n" +
          "📄 스프레드시트('4기 알림' 탭):\nhttps://docs.google.com/spreadsheets/d/" + SHEET_ID
  });

  return jsonResponse({ success: true });
}

// ── 신청 폼 → 신청현황 ──────────────────────────────────────
// (2026-07-02) 새 폼 필드 반영: '희망 요일'(preferredDays) + '동의 시각'(consentAt).
//  두 컬럼이 없으면 맨 뒤에 자동 생성되므로 시트 수동 작업 불필요.
function handleApply(d) {
  var sheet = ss().getSheetByName(MAIN_SHEET);

  // 새 컬럼 보장 후 인덱스 계산 (row 배열 길이에 새 컬럼이 포함되도록 순서 중요)
  ensureColumn(sheet, "희망 요일");
  ensureColumn(sheet, "동의 시각");
  var col = colIndexMap(sheet);
  var row = new Array(sheet.getLastColumn()).fill("");

  row[col["신청일자"]]    = new Date();
  row[col["이름"]]        = d.name || "";
  row[col["성별"]]        = d.gender || "";
  row[col["나이"]]        = d.age || "";
  row[col["전화번호"]]    = d.phone || "";
  row[col["인터뷰 방식"]] = d.interviewType || "";
  row[col["한 줄 인사"]]  = d.greeting || "";
  row[col["인스타그램"]]  = d.instagram || "";
  row[col["추천인"]]      = d.referral || "";
  row[col["마케팅 동의"]] = d.marketingConsent || "";
  row[col["희망 요일"]]   = d.preferredDays || "";
  row[col["동의 시각"]]   = d.consentAt ? new Date(d.consentAt) : "";
  prependRow(sheet, row);
  if (d.consentAt && col["동의 시각"] != null) {
    sheet.getRange(2, col["동의 시각"] + 1).setNumberFormat("yyyy-mm-dd hh:mm");
  }

  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "[레이지데이 북클럽] 새 신청 — " + (d.name || "?") + "님 (" + (d.interviewType || "방식 미선택") + ")",
    body: "새 신청이 접수되었습니다.\n\n" +
          "이름: " + (d.name || "-") + "\n" +
          "성별: " + (d.gender || "-") + "\n" +
          "나이: " + (d.age || "-") + "\n" +
          "연락처: " + (d.phone || "-") + "\n" +
          "희망 요일: " + (d.preferredDays || "-") + "\n" +
          "인터뷰 방식: " + (d.interviewType || "-") + "\n" +
          "한 줄 인사: " + (d.greeting || "-") + "\n" +
          "인스타그램: " + (d.instagram || "-") + "\n" +
          "추천인: " + (d.referral || "-") + "\n\n" +
          "📄 스프레드시트:\nhttps://docs.google.com/spreadsheets/d/" + SHEET_ID
  });

  // 신청자에게 카카오 알림톡 (실패 시 SMS fallback)
  // 인터뷰 방식 분기: 서면 인터뷰 선택 시 별도 템플릿, 그 외(전화)는 기존과 동일
  var npApply = normPhone(d.phone);
  if (npApply) {
    var applyTemplate = (d.interviewType === "서면 인터뷰") ? KAKAO_TEMPLATE_APPLY_WRITTEN : KAKAO_TEMPLATE_APPLY;
    var okApply = sendKakaoAlimtalk(npApply, applyTemplate, { "#{이름}": d.name || "" });
    if (!okApply) sendSMS(npApply,
      "[레이지데이 북클럽]\n" + (d.name || "") + "님, 신청해주셔서 감사합니다.\n인터뷰 일정 조율을 위해 카카오톡채널로 연락드릴게요.\n레이지데이 북클럽에서 곧 만나요.");
  }

  return jsonResponse({ success: true });
}

// ── 전화 인터뷰 예약 → 전화 인터뷰 시트 + 신청현황 O 표시 ──
function handlePhoneBooking(d) {
  if (!d.name || !d.phone || !d.slotStart || !d.slotEnd) {
    return jsonResponse({ success: false, error: "필수 항목 누락" });
  }
  var start = new Date(d.slotStart);
  var end   = new Date(d.slotEnd);

  // 1. 캘린더 중복 확인 + 이벤트 생성
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (cal) {
    if (cal.getEvents(start, end).length > 0) {
      return jsonResponse({ success: false, error: "이미 예약된 시간입니다. 다른 시간을 선택해주세요." });
    }
    cal.createEvent("[인터뷰] " + d.name + " (" + d.phone + ")", start, end,
      { description: "전화 인터뷰\n이름: " + d.name + "\n연락처: " + d.phone });
  }

  var label = slotLabel(start, end);

  // 2. 전화 인터뷰 시트에 기록 (인터뷰 일시 = 시작시각 '날짜값', 진행 여부 = 대기)
  var phoneSheet = getOrCreateSheet(PHONE_SHEET,
    ["예약일시", "이름", "전화번호", "인터뷰 일시", "진행 여부", "비고"]);
  prependRow(phoneSheet, [new Date(), d.name, d.phone, start, "대기", ""]);
  var pCol = colIndexMap(phoneSheet);
  phoneSheet.getRange(2, (pCol["인터뷰 일시"] != null ? pCol["인터뷰 일시"] : 3) + 1)
    .setNumberFormat(SLOT_FMT);
  sortPhoneByInterview(); // 인터뷰 일정순(미래 위·과거 아래)

  // 3. 신청현황 매핑: 인터뷰 일시(시작 날짜값) + 인터뷰 상태 = 대기(예약 완료·인터뷰 전)
  updateMainStatus(d.phone, { "인터뷰 일시": start, "인터뷰 상태": "대기" });

  // 4. 관리자 메일 + 신청자 SMS
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "[레이지데이 북클럽] 전화 인터뷰 예약 — " + d.name + "님 " + label,
    body: "전화 인터뷰 예약이 접수되었습니다.\n\n이름: " + d.name +
          "\n연락처: " + d.phone + "\n일시: " + label +
          "\n인터뷰 방식: 전화 인터뷰\n\nGoogle Calendar에서 확인하세요." +
          "\n\n📄 스프레드시트:\nhttps://docs.google.com/spreadsheets/d/" + SHEET_ID
  });
  if (SOLAPI_KEY && SOLAPI_SEC) {
    var npPhone = normPhone(d.phone);
    var dateStr = Utilities.formatDate(start, "Asia/Seoul", "M/d (E)");
    var timeStr = Utilities.formatDate(start, "Asia/Seoul", "HH:mm");
    var okPhone = sendKakaoAlimtalk(npPhone, KAKAO_TEMPLATE_PHONE,
      { "#{이름}": d.name, "#{날짜}": dateStr, "#{시간}": timeStr });
    if (!okPhone) sendSMS(npPhone,
      "[레이지데이 북클럽]\n" + d.name + "님, 전화 인터뷰 예약이 완료되었습니다.\n\n일시: " +
      label + "\n담당자가 해당 시간에 전화드릴게요.");
  }

  // ── 리마인더 예약: "당일" 예약은 제외, 다른 날이면 인터뷰 3시간 전 알림톡 예약 발송 ──
  //    (Solapi 예약 발송 — 등록만 해두면 해당 시각에 자동 전송, 별도 트리거 불필요)
  if (ENABLE_REMINDER && SOLAPI_KEY && SOLAPI_SEC) {
    try {
      var nowDay  = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");
      var slotDay = Utilities.formatDate(start,      "Asia/Seoul", "yyyy-MM-dd");
      if (nowDay !== slotDay) {  // 당일이 아닐 때만(=하루 이상 차이)
        var remindAt = new Date(start.getTime() - 3 * 3600 * 1000); // 인터뷰 3시간 전
        var schedKST = Utilities.formatDate(remindAt, "Asia/Seoul", "yyyy-MM-dd'T'HH:mm:ss") + "+09:00";
        var rDate = Utilities.formatDate(start, "Asia/Seoul", "M/d (E)");
        var rTime = Utilities.formatDate(start, "Asia/Seoul", "HH:mm");
        // ⚠️ 변수명은 승인된 템플릿의 #{...} 토큰과 정확히 일치해야 발송됨.
        scheduleKakao(normPhone(d.phone), schedKST, KAKAO_TEMPLATE_REMIND,
          { "#{이름}": d.name, "#{날짜}": rDate, "#{시간}": rTime });
      }
    } catch (err) { Logger.log("리마인더 예약 오류: " + err.message); }
  }

  return jsonResponse({ success: true });
}

// ── 서면 인터뷰 → 서면 인터뷰 시트 + 신청현황 O 표시 ────────
function handleWritten(d) {
  var a = d.answers || {};
  var sheet = getOrCreateSheet(WRITTEN_SHEET,
    ["제출일시", "이름", "연락처", "Q1", "Q2", "Q3", "Q4", "Q5", "Q6"]);
  prependRow(sheet, [new Date(), d.name || "", d.phone || "",
    a.q1 || "", a.q2 || "", a.q3 || "", a.q4 || "", a.q5 || "", a.q6 || ""]);

  updateMainStatus(d.phone, { "인터뷰 상태": "O" });

  // 질문 원문(프론트가 보낸 questions) + 답변 매핑. 없으면 WRITTEN_QUESTIONS fallback.
  var qs = (d.questions && d.questions.length) ? d.questions : WRITTEN_QUESTIONS;
  var qaBlocks = qs.map(function (q) {
    return q.label + ". " + q.text + (q.sub ? "\n   (" + q.sub + ")" : "") +
           "\n\n" + (a[q.id] || "(미작성)");
  }).join("\n\n─────────────────────────────\n\n");

  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "[레이지데이 북클럽] 서면 인터뷰 제출 — " + (d.name || "?") + "님",
    body: "서면 인터뷰 답변이 접수되었습니다.\n\n이름: " + (d.name || "-") + "\n연락처: " + (d.phone || "-") +
          "\n\n📄 스프레드시트:\nhttps://docs.google.com/spreadsheets/d/" + SHEET_ID +
          "\n\n═════════════════════════════\n\n" + qaBlocks
  });

  // 신청자에게 카카오 알림톡 (실패 시 SMS fallback)
  var npWritten = normPhone(d.phone);
  if (npWritten) {
    var okWritten = sendKakaoAlimtalk(npWritten, KAKAO_TEMPLATE_WRITTEN, { "#{이름}": d.name || "" });
    if (!okWritten) sendSMS(npWritten,
      "[레이지데이 북클럽]\n" + (d.name || "") + "님, 서면 인터뷰가 제출되었습니다.\n소중한 답변 감사드려요. 검토 후 개별 연락드리겠습니다.");
  }

  return jsonResponse({ success: true });
}

// ── 관리자: 시간 차단 / 이벤트 삭제 ─────────────────────────
function handleAdminBlock(d) {
  if (d.adminToken !== ADMIN_TOKEN) return jsonResponse({ success: false, error: "Unauthorized" });
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) return jsonResponse({ success: false, error: "캘린더 없음" });
  cal.createEvent("[BLOCK] " + (d.title || "차단"), new Date(d.start), new Date(d.end));
  return jsonResponse({ success: true });
}

function handleAdminDelete(d) {
  if (d.adminToken !== ADMIN_TOKEN) return jsonResponse({ success: false, error: "Unauthorized" });
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) return jsonResponse({ success: false, error: "캘린더 없음" });
  var ev = cal.getEventById(d.id);
  if (!ev) return jsonResponse({ success: false, error: "이벤트를 찾을 수 없습니다" });
  ev.deleteEvent();
  return jsonResponse({ success: true });
}

// ── 신청현황 상태 매핑 ──────────────────────────────────────
// phone과 일치하는 가장 최근 신청 행에 값들을 기록
function updateMainStatus(phone, values) {
  var sheet = ss().getSheetByName(MAIN_SHEET);
  var data = sheet.getDataRange().getValues();
  var col = colIndexMap(sheet);
  var np = normPhone(phone);
  if (!np) return false;

  // 대상 열이 없으면 생성
  Object.keys(values).forEach(function (h) { ensureColumn(sheet, h); });
  col = colIndexMap(sheet);

  // 최신순(최신이 위)이므로 위에서부터 검색 → 가장 최근 신청 행에 기록
  for (var i = 1; i < data.length; i++) {
    var rowPhone = normPhone(data[i][col["전화번호"]]);
    var isApplication = String(data[i][col["마케팅 동의"]]).trim() !== "";
    if (rowPhone === np && isApplication) {
      Object.keys(values).forEach(function (h) {
        var cell = sheet.getRange(i + 1, col[h] + 1);
        cell.setValue(values[h]);
        if (values[h] instanceof Date) cell.setNumberFormat(SLOT_FMT);
      });
      return true;
    }
  }
  return false;
}

// ── 세 시트를 최신순(최신이 맨 위)으로 정렬 ─────────────────
// 새 제출은 prependRow로 자동 최신순 유지되지만, 기존 데이터 정렬용/수동 보정용.
function sortSheetNewestFirst(name) {
  var sheet = ss().getSheetByName(name);
  if (!sheet || sheet.getLastRow() < 3) return;
  // 1행(헤더) 제외, 1열(날짜) 기준 내림차순
  sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
    .sort({ column: 1, ascending: false });
}

function sortAllNewestFirst() {
  sortSheetNewestFirst(MAIN_SHEET);
  sortSheetNewestFirst(WRITTEN_SHEET);
  sortPhoneByInterview(); // 전화 인터뷰는 인터뷰 일정순(미래 위·과거 아래)
  SpreadsheetApp.getUi().alert("정렬 완료. (전화 인터뷰는 인터뷰 일정순, 신청현황·서면은 최신순)");
}

// 전화 인터뷰 시트: 인터뷰 일시(날짜값) 기준 내림차순 — 미래가 위, 과거가 아래
function sortPhoneByInterview() {
  var s = ss().getSheetByName(PHONE_SHEET);
  if (!s || s.getLastRow() < 3) return;
  var col = colIndexMap(s);
  var dCol = (col["인터뷰 일시"] != null ? col["인터뷰 일시"] : 3) + 1;
  s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn())
    .sort({ column: dCol, ascending: false });
}

// ── 1회용: 신청현황에 섞인 전화 예약 행 → 전화 인터뷰 시트로 이전 ──
function migratePhoneBookingRows() {
  var sheet = ss().getSheetByName(MAIN_SHEET);
  var col = colIndexMap(sheet);
  var data = sheet.getDataRange().getValues();
  var phoneSheet = getOrCreateSheet(PHONE_SHEET,
    ["예약일시", "이름", "전화번호", "인터뷰 일시", "비고"]);

  var moved = 0;
  // 예약 행 판별: 인터뷰 일시 있음 + 마케팅 동의 없음 (= 폼 신청이 아닌 행)
  for (var i = data.length - 1; i >= 1; i--) {
    var slot = String(data[i][col["인터뷰 일시"]] || "").trim();
    var consent = String(data[i][col["마케팅 동의"]] || "").trim();
    if (slot && !consent) {
      phoneSheet.appendRow([
        data[i][col["신청일자"]] || "",
        data[i][col["이름"]] || "",
        data[i][col["전화번호"]] || "",
        slot, "신청현황에서 이전"
      ]);
      // 본 신청 행에 일시 복사
      updateMainStatus(data[i][col["전화번호"]], { "인터뷰 일시": slot, "인터뷰 상태": "대기" });
      sheet.deleteRow(i + 1);
      moved++;
    }
  }
  syncInterviewStatus();
  SpreadsheetApp.getUi().alert("이전 완료: " + moved + "건을 전화 인터뷰 시트로 옮기고 O/X를 갱신했습니다.");
}

// 시트의 연락처 존재 집합 (있으면 true)
function presenceSet(sheetName, phoneHeader, defaultIdx) {
  var s = ss().getSheetByName(sheetName), set = {};
  if (!s) return set;
  var v = s.getDataRange().getValues();
  if (v.length < 2) return set;
  var idx = v[0].map(function (h) { return String(h).trim(); }).indexOf(phoneHeader);
  if (idx === -1) idx = defaultIdx;
  for (var i = 1; i < v.length; i++) {
    var np = normPhone(v[i][idx]);
    if (np) set[np] = true;
  }
  return set;
}

// 전화 인터뷰 시트: 연락처 → '진행 여부'(E열) 매핑 (행 없으면 키 자체가 없음)
function phoneNoteMap(sheetName) {
  var s = ss().getSheetByName(sheetName), map = {};
  if (!s) return map;
  var v = s.getDataRange().getValues();
  if (v.length < 2) return map;
  var head = v[0].map(function (h) { return String(h).trim(); }); // 헤더 공백 제거
  var pIdx = head.indexOf("전화번호"); if (pIdx === -1) pIdx = 2; // C
  // 상태 칸은 '진행 여부'(관리자가 O/대기/X 기입). 못 찾으면 E열(고정)을 사용 — '비고'는 절대 폴백 금지.
  var nIdx = head.indexOf("진행 여부");
  if (nIdx === -1) nIdx = head.indexOf("진행여부");
  if (nIdx === -1) nIdx = 4; // E열 고정
  for (var i = 1; i < v.length; i++) {
    var np = normPhone(v[i][pIdx]);
    if (!np) continue;
    var note = String(v[i][nIdx] || "");
    // 같은 번호 여러 예약이면 '값이 채워진' 행을 우선
    if (!(np in map) || (!String(map[np]).trim() && note.trim())) map[np] = note;
  }
  return map;
}

// ── 인터뷰 상태 재계산 (서면/전화 시트 → 신청현황 단일 '인터뷰 상태' 칼럼) ──
//   서면 방식: 시트에 있으면 O, 없으면 X
//   전화 방식: 예약행 없으면 X / 행 있으면 '진행 여부' 값을 미러링(O→O, X→X, 그 외·빈칸→대기)
//   (방식은 '인터뷰 방식' 칼럼이 답하므로 상태는 한 칼럼이면 충분)
function syncInterviewStatus() {
  var main = ss().getSheetByName(MAIN_SHEET);
  ensureColumn(main, INTERVIEW_STATUS_HEADER);
  ensureColumn(main, PROGRESS_HEADER);
  var col = colIndexMap(main);
  var data = main.getDataRange().getValues();

  var written   = presenceSet(WRITTEN_SHEET, "연락처", 2);
  var phoneNote = phoneNoteMap(PHONE_SHEET);

  for (var i = 1; i < data.length; i++) {
    var method = String(data[i][col["인터뷰 방식"]] || "");
    if (method.indexOf("인터뷰") === -1) continue; // 인터뷰 제도 이전 행 제외
    var np = normPhone(data[i][col["전화번호"]]);
    if (!np) continue;

    var val = "";
    if (method.indexOf("서면") !== -1) {
      val = written[np] ? "O" : "X";
    } else if (method.indexOf("전화") !== -1) {
      if (!(np in phoneNote)) {
        val = "X";                                      // 예약 행 없음
      } else {
        var note = String(phoneNote[np]).trim();
        if (/대기/.test(note))                                      val = "대기";
        else if (/^[oO0○◯●⭕✓✔ㅇ]+$/.test(note) || /완료|함|했/.test(note)) val = "O";   // O 표기 변형 허용
        else if (/^[xX×✕✗]+$/.test(note) || /불참|취소|노쇼/.test(note))    val = "X";   // X 표기 변형 허용
        else                                                        val = "대기"; // 빈칸·기타 텍스트
      }
    }
    main.getRange(i + 1, col[INTERVIEW_STATUS_HEADER] + 1).setValue(val);

    // 인터뷰 X(미진행) → 진행 상태 '미진행' 자동 기입 (진행 상태가 비어있을 때만; 수동값은 보존)
    if (val === "X" && col[PROGRESS_HEADER] != null) {
      var curProg = String(data[i][col[PROGRESS_HEADER]] || "").trim();
      if (!curProg) main.getRange(i + 1, col[PROGRESS_HEADER] + 1).setValue("미진행");
    }
  }
}

// ── 반배정: 신청현황의 '반배정' 값에서 기수(1~4기)를 추출해 기수별로 고객정보를 묶는다 ──
//   · '2기, 3기'처럼 여러 기수가 적히면 각 기수에 모두 포함(다중 기수 지원)
//   · '1기-목-저녁'처럼 뒤에 요일·시간이 붙어도 '1기' 토큰으로 인식
//   · 가져오는 정보: 이름·성별·나이·전화번호·한 줄 인사·인스타그램 (신청현황 이름~인스타그램)
var CLASS_FIELDS = ["이름", "성별", "나이", "전화번호", "인스타그램", "한 줄 인사"];
var GISU_LIST = ["1기", "2기", "3기", "4기"];

function makeClassList() {
  var src = ss().getSheetByName(MAIN_SHEET);
  var dst = ss().getSheetByName(CLASS_SHEET);
  if (!src || !dst) return;
  var data = src.getDataRange().getValues();
  var col = colIndexMap(src);
  if (col["반배정"] == null || col["이름"] == null) return;

  var groups = {};
  GISU_LIST.forEach(function (g) { groups[g] = []; });

  for (var i = 1; i < data.length; i++) {
    var name = String(data[i][col["이름"]] || "").trim();
    if (!name) continue;
    var assign = String(data[i][col["반배정"]] || "");
    var matched = GISU_LIST.filter(function (g) { return assign.indexOf(g) !== -1; });
    if (!matched.length) continue;
    var info = CLASS_FIELDS.map(function (f) {
      return col[f] != null ? String(data[i][col[f]] || "").trim() : "";
    });
    matched.forEach(function (g) { groups[g].push(info); });
  }

  dst.clearContents();
  dst.clearFormats();

  var width = CLASS_FIELDS.length + 1; // 번호 + 필드
  var titleCols = ["번호", "이름", "성별", "나이", "연락처", "인스타그램", "한 줄 인사"];
  var row = 1;
  GISU_LIST.forEach(function (g) {
    var members = groups[g];
    if (!members.length) return;
    var tr = dst.getRange(row, 1, 1, width);
    tr.setValues([[g + " (" + members.length + "명)"].concat(titleCols.slice(1))]);
    tr.setBackground("#4A4A8A").setFontColor("#FFFFFF").setFontWeight("bold").setFontSize(11);
    row++;
    for (var m = 0; m < members.length; m++) {
      var mr = dst.getRange(row, 1, 1, width);
      mr.setValues([[m + 1].concat(members[m])]);
      mr.setBackground(m % 2 === 0 ? "#F0F0F8" : "#FFFFFF")
        .setFontColor("#000000").setFontWeight("normal");
      row++;
    }
    row++;
  });
}

function onEdit(e) {
  var sheet = e.source.getActiveSheet();
  if (sheet.getName() === MAIN_SHEET) makeClassList();
}

// ── 1회용: 전화예약 이관 때 잘못 삭제된 신청 원본 복구 ──────
// 이관(6/12) 과정에서 전화 예약자 5명의 신청 원본 행이 함께 삭제됨.
// 마이그레이션 전 백업에서 "현재 신청현황에 없는 신청 원본"만 찾아 복원한다.
var PRE_MIGRATION_BACKUP_ID = "1ucEsDSh9pWVeoICstV-h8Hp506FR0Poriat5TUkv4ms";

function restoreMigratedOriginals() {
  var backup = SpreadsheetApp.openById(PRE_MIGRATION_BACKUP_ID).getSheetByName(MAIN_SHEET);
  var main = ss().getSheetByName(MAIN_SHEET);
  var bData = backup.getDataRange().getValues();
  var bCol = {};
  bData[0].forEach(function (h, i) { bCol[String(h).trim()] = i; });
  var col = colIndexMap(main);
  var mData = main.getDataRange().getValues();

  // 행 식별 키: 전화번호 + 신청일자(초 단위)
  function rowKey(phone, date) {
    var d = (date instanceof Date)
      ? Utilities.formatDate(date, "Asia/Seoul", "yyyyMMddHHmmss")
      : String(date);
    return normPhone(phone) + "|" + d;
  }
  var existing = {};
  for (var i = 1; i < mData.length; i++) {
    existing[rowKey(mData[i][col["전화번호"]], mData[i][col["신청일자"]])] = true;
  }

  var SKIP_NAMES = { "test": true, "검증테스트": true }; // 의도적으로 지운 테스트 행
  var restored = 0, names = [];
  for (var j = 1; j < bData.length; j++) {
    var consent = String(bData[j][bCol["마케팅 동의"]] || "").trim();
    var name = String(bData[j][bCol["이름"]] || "").trim();
    if (!consent || SKIP_NAMES[name]) continue; // 신청 원본만 (예약 행 제외)
    var key = rowKey(bData[j][bCol["전화번호"]], bData[j][bCol["신청일자"]]);
    if (existing[key]) continue; // 이미 있으면 건너뜀 → 중복 복원 방지

    var row = new Array(main.getLastColumn()).fill("");
    Object.keys(bCol).forEach(function (h) {
      if (col[h] !== undefined) row[col[h]] = bData[j][bCol[h]];
    });
    prependRow(main, row);
    restored++;
    names.push(name);
  }

  // 전화 인터뷰 시트의 예약시간을 복원된 신청 행에 다시 매핑
  var ps = ss().getSheetByName(PHONE_SHEET);
  if (ps) {
    var pData = ps.getDataRange().getValues();
    var pCol = {};
    pData[0].forEach(function (h, i) { pCol[String(h).trim()] = i; });
    for (var k = 1; k < pData.length; k++) {
      var slot = String(pData[k][pCol["인터뷰 일시"]] || "").trim();
      if (slot) updateMainStatus(pData[k][pCol["전화번호"]], { "인터뷰 일시": slot, "인터뷰 상태": "대기" });
    }
  }
  syncInterviewStatus();
  [MAIN_SHEET, PHONE_SHEET, WRITTEN_SHEET].forEach(sortSheetNewestFirst);
  SpreadsheetApp.getUi().alert(
    "복구 완료: " + restored + "건\n" + names.join(", ") +
    "\n\n신청 원본을 신청현황에 복원하고 인터뷰 일시·O/X를 다시 매핑했습니다."
  );
}

// ── 1회용: 테스트 데이터 삭제 (이름이 test/검증테스트인 행) ──
function cleanupTestData() {
  var TEST_NAMES = { "test": true, "검증테스트": true };
  var targets = [
    { name: MAIN_SHEET,    nameHeader: "이름" },
    { name: PHONE_SHEET,   nameHeader: "이름" },
    { name: WRITTEN_SHEET, nameHeader: "이름" }
  ];
  var removed = 0;
  targets.forEach(function (t) {
    var sheet = ss().getSheetByName(t.name);
    if (!sheet) return;
    var data = sheet.getDataRange().getValues();
    var idx = data[0].map(String).indexOf(t.nameHeader);
    if (idx === -1) idx = 1; // 기본: 2번째 열
    for (var i = data.length - 1; i >= 1; i--) {
      if (TEST_NAMES[String(data[i][idx]).trim()]) {
        sheet.deleteRow(i + 1);
        removed++;
      }
    }
  });
  syncInterviewStatus();
  SpreadsheetApp.getUi().alert("테스트 데이터 " + removed + "행을 삭제했습니다.");
}

// ── 백업: 시트 전체 사본을 백업 폴더에 저장 ─────────────────
var BACKUP_FOLDER = "레이지데이 백업";
var BACKUP_KEEP   = 14; // 보관 개수 (이보다 오래된 사본은 자동 삭제)

function backupNow() {
  var folders = DriveApp.getFoldersByName(BACKUP_FOLDER);
  var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(BACKUP_FOLDER);

  var stamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm");
  DriveApp.getFileById(SHEET_ID).makeCopy("레이지데이 북클럽 백업 " + stamp, folder);

  // 오래된 백업 정리 (최신 BACKUP_KEEP개만 유지)
  var files = folder.getFiles();
  var list = [];
  while (files.hasNext()) {
    var f = files.next();
    if (f.getName().indexOf("레이지데이 북클럽 백업") === 0) list.push(f);
  }
  list.sort(function (a, b) { return b.getDateCreated() - a.getDateCreated(); });
  for (var i = BACKUP_KEEP; i < list.length; i++) list[i].setTrashed(true);
  return list.length;
}

function backupNowWithAlert() {
  backupNow();
  SpreadsheetApp.getUi().alert("백업 완료: 드라이브의 '" + BACKUP_FOLDER + "' 폴더에 사본을 저장했습니다.");
}

// 매일 새벽 4시 자동 백업 트리거 등록 (중복 등록 방지)
function enableDailyBackup() {
  var exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === "backupNow";
  });
  if (!exists) {
    ScriptApp.newTrigger("backupNow").timeBased().everyDays(1).atHour(4).create();
  }
  SpreadsheetApp.getUi().alert(exists ? "자동 백업이 이미 켜져 있습니다." : "자동 백업이 켜졌습니다 (매일 새벽 4시).");
}

// 1-based 칼럼 번호 → 알파벳 (1→A, 27→AA)
function colLetter(n) {
  var s = "";
  while (n > 0) { var m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// ── 시트 구조·서식 정리 (재실행 가능) ──────────────────────────
//   1) '인터뷰 방식' 칼럼을 '비고'와 '인터뷰 상태' 사이로 이동
//   2) '진행 상태' 드롭다운(미진행 포함)
//   3) 신청현황: 결제완료 = 행 전체 연두색 + 나머지 상태는 셀 색
//   4) 전화/서면 인터뷰 시트: 결제완료(비고 VLOOKUP) 행을 비고열까지 연두색
function applySheetFormatting() {
  var main = ss().getSheetByName(MAIN_SHEET);
  if (!main) return;

  // 1) 인터뷰 방식 → 비고와 인터뷰 상태 사이로 이동 (이미 그 자리면 건너뜀)
  var col = colIndexMap(main);
  var mIdx = col["인터뷰 방식"], sIdx = col[INTERVIEW_STATUS_HEADER];
  if (mIdx != null && sIdx != null && mIdx !== sIdx - 1) {
    main.moveColumns(main.getRange(1, mIdx + 1, main.getMaxRows(), 1), sIdx + 1);
    col = colIndexMap(main); // 이동 후 인덱스 갱신
  }

  // 1b) 인스타그램을 '한 줄 인사' 앞으로 (한 줄 인사가 길어서 뒤로 보냄)
  var hIdx = col["한 줄 인사"], iIdx = col["인스타그램"];
  if (hIdx != null && iIdx != null && iIdx > hIdx) {
    main.moveColumns(main.getRange(1, iIdx + 1, main.getMaxRows(), 1), hIdx + 1);
    col = colIndexMap(main); // 스왑 후 인덱스 갱신
  }

  // 2) 진행 상태 드롭다운
  var pc = col[PROGRESS_HEADER] + 1;
  var maxRows = main.getMaxRows();
  var rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(PROGRESS_OPTIONS, true).setAllowInvalid(true).build();
  main.getRange(2, pc, maxRows - 1, 1).setDataValidation(rule);

  // 3) 신청현황 조건부서식: 결제완료=행 전체, 나머지=진행 상태 셀
  var pL = colLetter(pc);
  var fullRange = main.getRange(2, 1, maxRows - 1, main.getLastColumn());
  var cellRange = main.getRange(2, pc, maxRows - 1, 1);
  function rowRule(text, bg) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=$' + pL + '2="' + text + '"').setBackground(bg)
      .setRanges([fullRange]).build();
  }
  function cellRule(text, bg) {
    return SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo(text).setBackground(bg).setRanges([cellRange]).build();
  }
  main.setConditionalFormatRules([
    rowRule("결제완료", PAID_COLOR),          // 결제완료 → 행 전체
    cellRule("미결제", "#fff2cc"),
    cellRule("환불",   "#f4cccc"),
    cellRule("탈락",   "#efefef"),
    cellRule("미진행", "#e6e6e6")
  ]);

  // 4) 전화/서면 인터뷰 시트: 결제완료 행 색칠 (비고열까지)
  colorPaidRows(PHONE_SHEET);   // 전화: A~비고(F)
  colorPaidRows(WRITTEN_SHEET); // 서면: A~비고(J)

  SpreadsheetApp.getUi().alert("시트 서식·정리 완료.\n· 인터뷰 방식 칼럼 이동\n· 진행 상태 드롭다운(미진행 포함)\n· 결제완료 행 색칠(신청현황 전체 / 전화·서면 비고열까지)");
}

// 비고(=VLOOKUP 진행 상태) 값이 '결제완료'면 A열~비고열을 연두색으로
function colorPaidRows(sheetName) {
  var s = ss().getSheetByName(sheetName);
  if (!s || s.getLastColumn() < 2) return;
  var head = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0]
    .map(function (h) { return String(h).trim(); });
  var bIdx = head.indexOf("비고");
  if (bIdx === -1) bIdx = s.getLastColumn() - 1; // 못 찾으면 마지막 열
  var bL = colLetter(bIdx + 1);
  var range = s.getRange(2, 1, s.getMaxRows() - 1, bIdx + 1); // A ~ 비고열
  var rule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=$' + bL + '2="결제완료"').setBackground(PAID_COLOR)
    .setRanges([range]).build();
  s.setConditionalFormatRules([rule]);
}

// ── 관리 메뉴 ───────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("레이지데이 관리")
    .addItem("0. 지금 백업하기", "backupNowWithAlert")
    .addItem("★ 이관 원본 복구(1회)", "restoreMigratedOriginals")
    .addSeparator()
    .addItem("정렬 (신청·서면 최신순 / 전화 일정순)", "sortAllNewestFirst")
    .addItem("전화 인터뷰 일정순 정렬", "sortPhoneByInterview")
    .addItem("인터뷰 상태 재계산", "syncInterviewStatus")
    .addItem("시트 서식·정리 (이동·드롭다운·색)", "applySheetFormatting")
    .addItem("반배정 다시 만들기", "makeClassList")
    .addItem("자동 백업 켜기 (매일 4시)", "enableDailyBackup")
    .addToUi();
}

// ── SMS (Solapi) ────────────────────────────────────────────
function buildSolapiAuth() {
  var date = new Date().toISOString();
  var salt = Utilities.getUuid().replace(/-/g, "").substring(0, 20);
  var raw = Utilities.computeHmacSha256Signature(date + salt, SOLAPI_SEC);
  var signature = raw.map(function (b) {
    return ("0" + (b & 0xff).toString(16)).slice(-2);
  }).join("");
  return "HMAC-SHA256 apiKey=" + SOLAPI_KEY + ", date=" + date +
    ", salt=" + salt + ", signature=" + signature;
}

function sendSMS(to, text) {
  try {
    UrlFetchApp.fetch("https://api.solapi.com/messages/v4/send", {
      method: "post",
      headers: { "Authorization": buildSolapiAuth(), "Content-Type": "application/json" },
      payload: JSON.stringify({ message: { to: to, from: SENDER_PHONE, text: text } }),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log("SMS 발송 오류: " + err.message);
  }
}

// ── 예약 문자 (Solapi 예약 발송) — scheduledDate(ISO8601 KST)에 자동 전송 ──
function scheduleSMS(to, scheduledDate, text) {
  if (!to || !scheduledDate) return;
  try {
    var resp = UrlFetchApp.fetch("https://api.solapi.com/messages/v4/send-many/detail", {
      method: "post",
      headers: { "Authorization": buildSolapiAuth(), "Content-Type": "application/json" },
      payload: JSON.stringify({
        messages: [ { to: to, from: SENDER_PHONE, text: text } ],
        scheduledDate: scheduledDate
      }),
      muteHttpExceptions: true
    });
    Logger.log("예약문자 응답: " + resp.getContentText());
  } catch (err) {
    Logger.log("예약문자 오류: " + err.message);
  }
}

// ── 예약 알림톡 (Solapi 예약 발송) — scheduledDate(ISO8601 KST)에 자동 전송 ──
function scheduleKakao(to, scheduledDate, templateId, variables) {
  if (!to || !scheduledDate || !templateId) return;
  try {
    var resp = UrlFetchApp.fetch("https://api.solapi.com/messages/v4/send-many/detail", {
      method: "post",
      headers: { "Authorization": buildSolapiAuth(), "Content-Type": "application/json" },
      payload: JSON.stringify({
        messages: [ { to: to, from: SENDER_PHONE,
          kakaoOptions: { pfId: KAKAO_PFID, templateId: templateId, variables: variables } } ],
        scheduledDate: scheduledDate
      }),
      muteHttpExceptions: true
    });
    Logger.log("예약 알림톡 응답: " + resp.getContentText());
  } catch (err) {
    Logger.log("예약 알림톡 오류: " + err.message);
  }
}

// ── 윤채원님(이미 예약된 분) 일회성 리마인더 예약 — 한 번만 실행 ──
// GAS 편집기에서 아래 값(연락처/인터뷰 일시)을 채우고 이 함수를 직접 실행하세요.
function scheduleReminderOnce() {
  var name  = "윤채원";
  var phone = "01045446912";               // 윤채원님 연락처
  var when  = "2026-06-26T19:00:00+09:00";  // 인터뷰 시작 일시(KST) — 6/26(금) 19:00
  var start = new Date(when);
  var remindAt = new Date(start.getTime() - 3 * 3600 * 1000); // 3시간 전
  var schedKST = Utilities.formatDate(remindAt, "Asia/Seoul", "yyyy-MM-dd'T'HH:mm:ss") + "+09:00";
  var rDate = Utilities.formatDate(start, "Asia/Seoul", "M/d (E)");
  var rTime = Utilities.formatDate(start, "Asia/Seoul", "HH:mm");
  scheduleKakao(normPhone(phone), schedKST, KAKAO_TEMPLATE_REMIND,
    { "#{이름}": name, "#{날짜}": rDate, "#{시간}": rTime });
  Logger.log("윤채원 리마인더 예약 완료: " + schedKST);
}

// ── 카카오 알림톡 (Solapi) — 신청자 발송. 성공 true / 실패 false(→ SMS fallback) ──
function sendKakaoAlimtalk(to, templateId, variables) {
  if (!to || !templateId) return false;
  try {
    var resp = UrlFetchApp.fetch("https://api.solapi.com/messages/v4/send", {
      method: "post",
      headers: { "Authorization": buildSolapiAuth(), "Content-Type": "application/json" },
      payload: JSON.stringify({ message: {
        to: to, from: SENDER_PHONE,
        kakaoOptions: { pfId: KAKAO_PFID, templateId: templateId, variables: variables }
      }}),
      muteHttpExceptions: true
    });
    var result = JSON.parse(resp.getContentText());
    Logger.log("알림톡 응답: " + JSON.stringify(result));
    return !result.errorCode;  // errorCode 없으면 성공
  } catch (err) {
    Logger.log("알림톡 발송 오류: " + err.message);
    return false;
  }
}
