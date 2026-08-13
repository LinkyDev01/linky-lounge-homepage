// ============================================================
// 레이지데이 북클럽 — 통합 접수 스크립트 (완성본)
// ============================================================
// 이 파일 하나가 기존 운영 스크립트(접수 doPost/doGet + 반배정)를 전부 대체합니다.
//
// ⚠ 원본은 이 편집기가 아니라 GitHub 레포입니다 (2026-08-13~).
//   LinkyDev01/linky-lounge-homepage 의 gas/linkyincdev-main.gs 를 고쳐 main 에
//   병합하면 GitHub Actions 가 이 프로젝트에 반영하고 기존 배포를 새 버전으로 갱신합니다.
//   여기서 직접 고쳐도 동작은 하지만, 다음 자동 배포 때 레포 내용으로 덮여 사라집니다.
//   (안전장치가 있어 조용히 덮이지는 않습니다 — 어긋난 것을 감지하면 배포가 멈춥니다.
//    급히 편집기에서 고쳤다면 반드시 알려 주세요. 레포로 회수한 뒤 다시 굴려야 합니다.)
//   절차서: docs/gas-automation.md
//
// (2026-08-06 정리) 1회용·미사용 코드를 제거한 정리본.
//   삭제: restoreMigratedOriginals / migratePhoneBookingRows / cleanupTestData
//         (모두 완료된 1회성 마이그레이션) · scheduleSMS(미사용) ·
//         scheduleReminderOnce(특정 신청자 실명·전화번호 하드코딩 — 개인정보)
//   메뉴: '이관 원본 복구(1회)'와 중복된 '전화 인터뷰 일정순 정렬' 제거
//   ⚠ 1회성 작업은 코드로 남기지 말고 편집기에서 실행 후 지울 것.
//
// 데이터 구조:
//   신청현황    — 신청 폼 제출 (1행 = 1신청). '인터뷰 상태'에 O/대기/X,
//                 '인터뷰 일시'에 전화 인터뷰 예약시간 기록
//   전화 인터뷰 — 전화 인터뷰 예약 내역 (별도 시트, 1행 = 1예약)
//   서면 인터뷰 — 서면 인터뷰 답변
//   4기 알림    — 다음 기수 오픈 알림 신청
//   1회성 모임  — 원데이 토크 신청
//   반배정      — 기수 기준 자동 반배정 (onEdit)
//
// ⚠ 프론트(Vercel)와의 계약
//   · POST type: written / phone_interview / admin_block / admin_delete /
//     notify / oneday / (없음 = 신청 폼)
//   · GET ?adminToken=<스크립트 속성 ADMIN_TOKEN> → 이벤트에 id·title 포함
//     (admin 차단 관리 화면이 이 값으로 차단/인터뷰를 구분·삭제한다.
//      Vercel 환경변수 ADMIN_SECRET 과 반드시 같은 값이어야 한다)
// ── 설정값 ──────────────────────────────────────────────────
var SHEET_ID    = "1yDy7VeJ_XkOYNfv_CXVqXy0S1UOAObgCiL4j22etfko"; // 레이지데이 북클럽 시트
var MAIN_SHEET  = "신청현황";
var PHONE_SHEET = "전화 인터뷰";
var WRITTEN_SHEET = "서면 인터뷰";
var CLASS_SHEET = "반배정";
var NOTIFY_SHEET = "4기 알림"; // 다음 기수 오픈 알림 신청 (2026-07-13)
var DRAFT_SHEET  = "임시저장"; // 신청 1단계 임시저장 (2026-07-27) — 같은 문서 별도 탭
var ONEDAY_SHEET = "1회성 모임"; // 1회성 모임 신청 (2026-07-24) — 같은 문서 별도 탭

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
    text: "최근 외부의 속도나 타인의 시선에서 완전히 벗어나 '오롯이 나로서 쉼을 누렸던 순간'은 언제였나요?",
    sub:  "" },
  { id: "q2", label: "Q2",
    text: "요즘 나의 머릿속을 자주 어지럽히거나, 혹은 마음을 끌어당기는 '나만의 화두나 질문'이 있다면 무엇인가요?",
    sub:  "" },
  { id: "q3", label: "Q3",
    text: "최근 누군가와의 대화나 책 속에서 “아, 이렇게 바라볼 수도 있구나” 하고 내 생각의 경계가 넓어지거나 선명해졌던 순간이 있다면 전해주실 수 있나요?",
    sub:  "" },
  { id: "q4", label: "Q4",
    text: "다양한 사람들이 모인 공간에서, 내가 타인의 이야기를 들을 때 가장 중요하게 유지하고 싶은 나만의 태도는 무엇인가요?",
    sub:  "" },
  { id: "q5", label: "Q5",
    text: "나와 전혀 다른 시각이나 낯선 생각을 가진 사람을 마주했을 때, 내 마음속에 가장 먼저 떠오르는 생각이나 감정은 무엇인가요?",
    sub:  "" },
  { id: "q6", label: "Q6",
    text: "한 기수의 레이지데이 북클럽을 마치고 집으로 돌아가는 마지막 길, 내 마음에 어떤 잔상이나 기분이 남아있기를 바라시나요?",
    sub:  "" },
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

    // ⚠️ ADMIN_TOKEN 속성이 비어 있으면 `"" === ""`가 성립해, 누구든 `?adminToken=`(빈 값)만
    //    붙이면 관리자 응답(이벤트 제목 = 신청자 이름·전화번호)을 받아갈 수 있었다.
    //    웹앱은 '모든 사용자' 공개라 프론트의 쿠키 가드로는 이 경로를 막지 못한다. (2026-08-13)
    var isAdmin = !!ADMIN_TOKEN && e && e.parameter && e.parameter.adminToken === ADMIN_TOKEN;
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
    var type = data.type ? String(data.type) : "";

    if (type === "written")         return handleWritten(data);
    if (type === "phone_interview") return handlePhoneBooking(data);
    if (type === "admin_block")     return handleAdminBlock(data);
    if (type === "admin_delete")    return handleAdminDelete(data);
    if (type === "notify")          return handleNotify(data);
    if (type === "oneday")          return handleOnedayApply(data);
    if (type === "" || type === "apply") return handleApply(data); // type 없음 = 신청 폼(기존 계약)

    // ⚠️ 예전엔 모르는 type이 전부 handleApply로 흘러들어, 오타나 구버전 GAS가 모르는
    //    새 type(예: 임시저장 apply_draft)이 신청현황에 엉뚱한 행을 쌓고 알림톡까지
    //    오발송했다. 화이트리스트 밖은 명시적으로 거절한다. (2026-08-13)
    return jsonResponse({ success: false, error: "지원하지 않는 요청 형식입니다: " + type });
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

// ── 1회성 모임 신청 → '1회성 모임' 시트 (2026-07-24) ─────────────
// 프론트 /oneday 폼 (payload: type:"oneday"/name/gender/age/phone/greeting/
// instagram/meetingDates/orderId/marketingConsent/consentAt).
// 시트가 없으면 자동 생성 + 헤더는 ensureColumn으로 보장 (수동 작업 불필요).
// 선결제→후신청 전환 (2026-08-11): 신청서는 이제 **토스 결제 승인 후** 제출된다 —
// 이 시트의 모든 행은 결제 완료 건. orderId('주문번호' 컬럼)로 토스 상점관리자의
// 결제 내역과 매칭한다. 알림톡은 보내지 않는다 (관리자 메일만).
function handleOnedayApply(d) {
  if (!d.name || !d.phone) {
    return jsonResponse({ success: false, error: "필수 항목 누락" });
  }
  var sheet = ss().getSheetByName(ONEDAY_SHEET);
  if (!sheet) {
    sheet = ss().insertSheet(ONEDAY_SHEET);
    // 빈 시트는 getLastColumn()이 0이라 ensureColumn이 못 읽음 — 첫 헤더 셀 선시드
    sheet.getRange(1, 1).setValue("신청일자")
      .setFontWeight("bold").setBackground("#f5ede4").setFontColor("#1a1208");
  }
  ensureColumn(sheet, "이름");
  ensureColumn(sheet, "성별");
  ensureColumn(sheet, "나이");
  ensureColumn(sheet, "전화번호");
  ensureColumn(sheet, "모임 일자");
  ensureColumn(sheet, "주문번호"); // 토스 orderId — 결제 내역과 매칭 (선결제→후신청, 2026-08-11)
  ensureColumn(sheet, "한 줄 인사");
  ensureColumn(sheet, "인스타그램");
  ensureColumn(sheet, "마케팅 동의");
  ensureColumn(sheet, "동의 시각");
  var col = colIndexMap(sheet);
  var row = new Array(sheet.getLastColumn()).fill("");
  row[col["신청일자"]]    = new Date();
  row[col["이름"]]        = d.name || "";
  row[col["성별"]]        = d.gender || "";
  row[col["나이"]]        = d.age || "";
  row[col["전화번호"]]    = d.phone || "";
  row[col["모임 일자"]]   = d.meetingDates || "";
  row[col["주문번호"]]    = d.orderId || "";
  row[col["한 줄 인사"]]  = d.greeting || "";
  row[col["인스타그램"]]  = d.instagram || "";
  row[col["마케팅 동의"]] = d.marketingConsent || "";
  row[col["동의 시각"]]   = d.consentAt ? new Date(d.consentAt) : "";
  prependRow(sheet, row);
  if (d.consentAt && col["동의 시각"] != null) {
    sheet.getRange(2, col["동의 시각"] + 1).setNumberFormat("yyyy-mm-dd hh:mm");
  }

  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "[레이지데이 북클럽] 1회성 모임 신청 — " + (d.name || "?") + "님",
    body: "1회성 모임 신청이 접수되었습니다. (토스 결제 완료 후 제출된 신청서 — 주문번호로 토스 결제 내역과 매칭)\n\n" +
          "이름: " + (d.name || "-") + "\n" +
          "성별: " + (d.gender || "-") + "\n" +
          "나이: " + (d.age || "-") + "\n" +
          "연락처: " + (d.phone || "-") + "\n" +
          "모임 일자: " + (d.meetingDates || "-") + "\n" +
          "주문번호: " + (d.orderId || "-") + "\n" +
          "한 줄 인사: " + (d.greeting || "-") + "\n" +
          "인스타그램: " + (d.instagram || "-") + "\n\n" +
          "📄 스프레드시트('1회성 모임' 탭):\nhttps://docs.google.com/spreadsheets/d/" + SHEET_ID
  });

  return jsonResponse({ success: true });
}

// ── 신청 폼 → 신청현황 ──────────────────────────────────────
// (2026-07-02) 새 폼 필드 반영: '희망 요일'(preferredDays) + '동의 시각'(consentAt).
//  두 컬럼이 없으면 맨 뒤에 자동 생성되므로 시트 수동 작업 불필요.
// (2026-07-27) '불가 요일'(unavailableDays) 추가 — 참여 불가 요일 복수 선택,
//  미선택 시 "없음"(모든 요일 가능). 희망 요일 문항은 꺼진 상태 유지(항상 빈 값).
// handleApply가 기록하는 컬럼 전체. 하나라도 시트에 없으면 col[헤더]가 undefined가 되어
// `row[undefined] = 값`으로 새어나가고, **행은 기록되는데 그 칸만 조용히 빈다** — 에러도 안 난다.
// 그래서 쓰기 전에 전부 ensureColumn으로 보장한다. (2026-08-13)
var APPLY_COLUMNS = [
  "신청일자", "이름", "성별", "나이", "전화번호", "인터뷰 방식",
  "한 줄 인사", "인스타그램", "추천인", "마케팅 동의",
  "희망 요일", "동의 시각", "불가 요일",
];

function handleApply(d) {
  if (!d.name || !d.phone) {
    return jsonResponse({ success: false, error: "필수 항목 누락" });
  }
  var sheet = ss().getSheetByName(MAIN_SHEET);
  if (!sheet) {
    sheet = ss().insertSheet(MAIN_SHEET);
    // 빈 시트는 getLastColumn()이 0이라 ensureColumn이 못 읽음 — 첫 헤더 셀 선시드
    sheet.getRange(1, 1).setValue(APPLY_COLUMNS[0])
      .setFontWeight("bold").setBackground("#f5ede4").setFontColor("#1a1208");
  }

  // 새 컬럼 보장 후 인덱스 계산 (row 배열 길이에 새 컬럼이 포함되도록 순서 중요)
  APPLY_COLUMNS.forEach(function (h) { ensureColumn(sheet, h); });
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
  row[col["불가 요일"]]   = d.unavailableDays || "";
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
          "불가 요일: " + (d.unavailableDays || "-") + "\n" +
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
  // ADMIN_TOKEN 미설정 시 빈 토큰으로 통과되던 것 차단 (2026-08-13, doGet과 동일 사유)
  if (!ADMIN_TOKEN || d.adminToken !== ADMIN_TOKEN) return jsonResponse({ success: false, error: "Unauthorized" });
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) return jsonResponse({ success: false, error: "캘린더 없음" });
  cal.createEvent("[BLOCK] " + (d.title || "차단"), new Date(d.start), new Date(d.end));
  return jsonResponse({ success: true });
}

function handleAdminDelete(d) {
  // ADMIN_TOKEN 미설정 시 빈 토큰으로 통과되던 것 차단 (2026-08-13, doGet과 동일 사유)
  if (!ADMIN_TOKEN || d.adminToken !== ADMIN_TOKEN) return jsonResponse({ success: false, error: "Unauthorized" });
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

// ── 반배정: 신청현황의 '반배정' 값에서 기수를 추출해 기수별로 고객정보를 묶는다 ──
//   · '2기, 3기'처럼 여러 기수가 적히면 각 기수에 모두 포함(다중 기수 지원)
//   · '1기-목-저녁'처럼 뒤에 요일·시간이 붙어도 '1기' 토큰으로 인식
//   · 가져오는 정보: 이름·성별·나이·전화번호·한 줄 인사·인스타그램 (신청현황 이름~인스타그램)
//   ⚠️ 반배정 시트는 이 함수가 그리는 **파생물**이다 — 매번 통째로 지우고 다시 그리므로
//      반배정 시트에 손으로 적은 내용은 남지 않는다. 메모는 신청현황 쪽에 적을 것.
// (2026-08-09 꼬임 수정)
//   ① 기수 하드코딩(1~4기) 폐지 — '5기', '10기'도 자동 인식 (숫자 정렬). 하드코딩 시절엔
//      5기부터 조용히 누락됐다.
//   ② '3기 환불'·'4기 취소' 같은 메모가 배정으로 집계되던 것 차단 — 제외어가 있으면 그 행 전체 스킵.
//   ③ onEdit이 '활성 시트'를 보던 것을 '실제 편집된 범위'로 교정 + **반배정/이름 열을
//      건드렸을 때만** 재빌드 — 무관한 셀 편집마다 시트를 다시 그리던 낭비(+ 손댄 서식
//      증발)를 줄인다.
var CLASS_FIELDS = ["이름", "성별", "나이", "전화번호", "인스타그램", "한 줄 인사"];
// 반배정 칸에 이 단어가 함께 적혀 있으면 배정으로 치지 않는다 (상태 메모로 간주)
var CLASS_EXCLUDE = ["환불", "취소", "대기", "보류", "노쇼", "이탈"];

function extractGisu(text) {
  var m = String(text || "").match(/\d+\s*기/g) || [];
  var seen = {};
  var out = [];
  m.forEach(function (t) {
    var g = t.replace(/\s+/g, ""); // "3 기" → "3기"
    if (!seen[g]) { seen[g] = true; out.push(g); }
  });
  return out;
}

function makeClassList() {
  var src = ss().getSheetByName(MAIN_SHEET);
  var dst = ss().getSheetByName(CLASS_SHEET);
  if (!src || !dst) return;
  var data = src.getDataRange().getValues();
  var col = colIndexMap(src);
  if (col["반배정"] == null || col["이름"] == null) return;

  var groups = {};
  for (var i = 1; i < data.length; i++) {
    var name = String(data[i][col["이름"]] || "").trim();
    if (!name) continue;
    var assign = String(data[i][col["반배정"]] || "");
    if (!assign.trim()) continue;
    // 상태 메모('3기 환불' 등)는 배정이 아니다 — 명단에서 제외
    var isExcluded = CLASS_EXCLUDE.some(function (w) { return assign.indexOf(w) !== -1; });
    if (isExcluded) continue;
    var matched = extractGisu(assign);
    if (!matched.length) continue;
    var info = CLASS_FIELDS.map(function (f) {
      return col[f] != null ? String(data[i][col[f]] || "").trim() : "";
    });
    matched.forEach(function (g) {
      if (!groups[g]) groups[g] = [];
      groups[g].push(info);
    });
  }

  dst.clearContents();
  dst.clearFormats();

  var width = CLASS_FIELDS.length + 1; // 번호 + 필드
  var titleCols = ["번호", "이름", "성별", "나이", "연락처", "인스타그램", "한 줄 인사"];
  var row = 1;
  // 기수 숫자 오름차순 (1기, 2기, … 10기 — 문자열 정렬이면 10기가 1기 뒤에 끼어든다)
  var gisus = Object.keys(groups).sort(function (a, b) { return parseInt(a, 10) - parseInt(b, 10); });
  gisus.forEach(function (g) {
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
  // 활성 시트가 아니라 **실제 편집된 범위** 기준 (활성 시트는 편집 위치와 다를 수 있다)
  if (!e || !e.range) return;
  var sheet = e.range.getSheet();
  if (sheet.getName() !== MAIN_SHEET) return;
  // 반배정·이름 열을 건드렸을 때만 재빌드 — 무관한 편집마다 반배정 시트를 다시 그리지 않는다
  var col = colIndexMap(sheet);
  var touched = [col["반배정"], col["이름"]].filter(function (c) { return c != null; })
    .map(function (c) { return c + 1; }); // 1-based
  var c1 = e.range.getColumn(), c2 = e.range.getLastColumn();
  // 행 삽입/삭제처럼 열 전체가 걸리는 편집(getColumn=1 & 넓은 범위)도 재빌드에 포함된다
  var hit = touched.some(function (c) { return c >= c1 && c <= c2; });
  if (hit) makeClassList();
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
    .addItem("지금 백업하기", "backupNowWithAlert")
    .addSeparator()
    .addItem("정렬 (신청·서면 최신순 / 전화 일정순)", "sortAllNewestFirst")
    .addItem("인터뷰 상태 재계산", "syncInterviewStatus")
    .addItem("반배정 다시 만들기", "makeClassList")
    .addSeparator()
    .addItem("시트 서식·정리 (최초 1회)", "applySheetFormatting")
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

// (삭제됨) 일회성 리마인더 예약 함수 — 특정 신청자의 실명·전화번호가 코드에
// 하드코딩돼 있어 제거했다 (2026-08-06). 공개 레포에 개인정보가 남지 않도록,
// 이런 1회성 작업은 코드로 남기지 말고 편집기에서 실행 후 지운다.

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
