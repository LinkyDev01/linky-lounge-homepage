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
//     notify / oneday / coffeebar / (없음 = 신청 폼)
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
// ⚠ 2026-08-24 이후 **쓰지 않는다** — 원데이 접수는 레이지클럽 파일로 이전됐다
// (LAZYCLUB_ONEDAY_SHEET). 북클럽 시트의 이 탭은 이전 이전(以前) 기록 보관용으로 남는다.
var ONEDAY_SHEET = "1회성 모임"; // (과거 기록 탭 — 신규 접수는 여기로 오지 않는다)

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

// ── 레이지클럽 모임 신청 완료 알림톡 (2026-08-31, 운영자 지급) ──────────────
// ⚠ **채널이 북클럽과 다르다.** 위 KAKAO_PFID 는 북클럽 채널이고, 레이지클럽은 별도
//   채널을 쓴다 — 그래서 sendKakaoAlimtalk 에 pfId 를 넘기는 인자를 뒀다(4번째).
//   채널을 안 갈아끼우면 "템플릿이 이 발신프로필에 없다"로 조용히 실패한다.
// ⚠ **아직 승인 전이다** (운영자 2026-08-31 "아직 승인은 안 났는데 미리 반영할게").
//   승인 전에는 Solapi 가 에러를 돌려주고 발송이 실패하는데, 아래 호출부는 **SMS 폴백을
//   붙이지 않으므로** 손님에게 아무것도 안 나간다(승인 전 오발송 방지). 접수·시트·메일은
//   종전대로 진행된다. 승인이 나면 코드 변경 없이 그대로 발송된다.
var KAKAO_PFID_LAZYCLUB           = "KA01PF260831065614085Y3w41QKym0u"; // 레이지클럽 채널
var KAKAO_TEMPLATE_LAZYCLUB_APPLY = "KA01TP260831070822208VLuwoxsTYW7"; // 템플릿 코드 JZvGf8LJM5

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

// ── 레이지클럽 신청 관리 (2026-08-24 신설) ──────────────────
// 북클럽 시트(SHEET_ID)와 **다른 파일**이다 (운영자: "기존 레이지데이 북클럽과는 다르니까").
// 모임 단위로 탭을 나눈다 — 탭은 payload 가 지정한 이름으로 자동 생성되므로
// 모임이 늘어도 이 스크립트를 고칠 필요가 없다.
//
// 파일 ID 는 코드에 박지 않고 **스크립트 속성**에 둔다(비밀값 규율과 같은 자리).
// 없으면 최초 접수 때 새 스프레드시트를 만들어 ID 를 적어 두고 운영자에게 메일로 알린다 —
// 운영자가 미리 만들어 둔 파일을 쓰려면 스크립트 속성 LAZYCLUB_SHEET_ID 에 그 ID 를 넣으면 된다.
var LAZYCLUB_SHEET_NAME = "레이지클럽 신청 관리";
var LAZYCLUB_COFFEEBAR_SHEET = "커피앤바";
var LAZYCLUB_ONEDAY_SHEET    = "원데이 토크";

function lazyclubSs() {
  var id = _PROPS.getProperty("LAZYCLUB_SHEET_ID") || "";
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (err) { /* 지워졌거나 권한 없음 → 새로 만든다 */ }
  }
  var created = SpreadsheetApp.create(LAZYCLUB_SHEET_NAME);
  _PROPS.setProperty("LAZYCLUB_SHEET_ID", created.getId());
  try {
    DriveApp.getFileById(created.getId()).addEditor(ADMIN_EMAIL);
  } catch (err) {}
  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: "[레이지클럽] 신청 관리 스프레드시트가 새로 만들어졌습니다",
      body: "레이지클럽 신청을 받을 새 스프레드시트를 만들었습니다.\n" +
            "앞으로 커피앤바·원데이 토크 신청은 모두 이 파일의 모임별 탭에 쌓입니다.\n\n" +
            "https://docs.google.com/spreadsheets/d/" + created.getId()
    });
  } catch (err) {}
  return created;
}

/** 레이지클럽 파일 안에서 탭 확보 — 없으면 만들고 첫 헤더 셀을 선시드한다.
 *  (빈 시트는 getLastColumn()이 0이라 ensureColumn 이 못 읽는다 — 원데이 시트와 같은 함정) */
function lazyclubSheet(name) {
  var doc = lazyclubSs();
  var sheet = doc.getSheetByName(name);
  if (!sheet) {
    sheet = doc.insertSheet(name);
    sheet.getRange(1, 1).setValue("신청일자")
      .setFontWeight("bold").setBackground("#f5ede4").setFontColor("#1a1208");
    sheet.setFrozenRows(1);
  }
  // 새 파일이면 기본 '시트1' 이 남아 지저분하다 — 비어 있을 때만 치운다
  try {
    var first = doc.getSheetByName("시트1") || doc.getSheetByName("Sheet1");
    if (first && doc.getSheets().length > 1 && first.getLastRow() === 0) doc.deleteSheet(first);
  } catch (err) {}
  return sheet;
}

function lazyclubSheetUrl() {
  return "https://docs.google.com/spreadsheets/d/" + (_PROPS.getProperty("LAZYCLUB_SHEET_ID") || "");
}

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
    if (type === "coffeebar")       return handleCoffeeBar(data);
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

// ── 커피앤바 신청 → 레이지클럽 파일 '커피앤바' 탭 (2026-08-24) ──────
// 프론트 /lazyclub/meetings/dm-gd 폼 (payload: type:"coffeebar"/name/age/phone/
// intro/preferredWhen/marketingConsent/consentAt).
// **결제 없는 선신청**이다 — 접수 후 운영자가 해당 번호로 직접 연락한다(카피 근거).
// 알림톡 없음, 관리자 메일만 (운영자 2026-08-24 "메일만").
function handleCoffeeBar(d) {
  if (!d.name || !d.phone) {
    return jsonResponse({ success: false, error: "필수 항목 누락" });
  }
  var sheet = lazyclubSheet(LAZYCLUB_COFFEEBAR_SHEET);
  ensureColumn(sheet, "이름");
  ensureColumn(sheet, "나이");
  ensureColumn(sheet, "전화번호");
  ensureColumn(sheet, "희망 날짜와 시간대");
  ensureColumn(sheet, "자기소개");
  ensureColumn(sheet, "마케팅 동의");
  ensureColumn(sheet, "동의 시각");
  var col = colIndexMap(sheet);
  var row = new Array(sheet.getLastColumn()).fill("");
  row[col["신청일자"]]          = new Date();
  row[col["이름"]]              = d.name || "";
  row[col["나이"]]              = d.age || "";
  row[col["전화번호"]]          = d.phone || "";
  row[col["희망 날짜와 시간대"]] = d.preferredWhen || "";
  row[col["자기소개"]]          = d.intro || "";
  row[col["마케팅 동의"]]       = d.marketingConsent || "";
  row[col["동의 시각"]]         = d.consentAt ? new Date(d.consentAt) : "";
  prependRow(sheet, row);
  if (d.consentAt && col["동의 시각"] != null) {
    sheet.getRange(2, col["동의 시각"] + 1).setNumberFormat("yyyy-mm-dd hh:mm");
  }

  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "[레이지클럽] 동민과 고든 커피앤바 신청 — " + (d.name || "?") + "님",
    body: "커피앤바 신청이 접수되었습니다. (결제 없는 선신청 — 해당 번호로 연락해 주세요)\n\n" +
          "이름: " + (d.name || "-") + "\n" +
          "나이: " + (d.age || "-") + "\n" +
          "연락처: " + (d.phone || "-") + "\n" +
          "희망 날짜와 시간대: " + (d.preferredWhen || "-") + "\n" +
          "자기소개: " + (d.intro || "-") + "\n\n" +
          "📄 스프레드시트('" + LAZYCLUB_COFFEEBAR_SHEET + "' 탭):\n" + lazyclubSheetUrl()
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
  // 2026-08-24: 도착지를 북클럽 시트 → **레이지클럽 파일 '원데이 토크' 탭**으로 이전.
  // 북클럽 시트의 기존 '1회성 모임' 탭은 과거 기록으로 그대로 둔다(이전은 신규 접수부터).
  var sheet = lazyclubSheet(LAZYCLUB_ONEDAY_SHEET);
  ensureColumn(sheet, "이름");
  ensureColumn(sheet, "성별");
  ensureColumn(sheet, "나이");
  ensureColumn(sheet, "전화번호");
  // 2026-08-24 칼럼 분해 (운영자: "너무 많은 정보가 한 칼럼에 들어오므로 항목별 쪼개야").
  // 종전에는 제목·회차·일시가 meetingDates 한 문자열로 뭉쳐 '모임 일자' 한 칸에 들어갔다.
  ensureColumn(sheet, "모임");        // 제목 (예: 원데이 토크, 브람스를 좋아하세요...)
  ensureColumn(sheet, "모임 slug");   // 집계·필터용 안정 키 (brahms)
  ensureColumn(sheet, "일시");        // 8.30 (일) 08:00–11:00
  ensureColumn(sheet, "회차");        // 4주 과정만 — 단일 회차는 빈칸
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
  // ⚠ 새 필드 우선, 없으면 meetingDates 로 폴백 — 프론트가 아직 구 payload 를 보내도
  //   행이 통째로 비지 않게(§6 뒤집힘 대비). 프론트 전환이 끝나면 폴백은 걷어낸다.
  row[col["모임"]]        = d.meetingTitle || d.meetingDates || "";
  row[col["모임 slug"]]   = d.meetingSlug || "";
  row[col["일시"]]        = d.meetingDate || "";
  row[col["회차"]]        = d.meetingSessions || "";
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
    subject: "[레이지클럽] 원데이 토크 신청 — " + (d.name || "?") + "님",
    body: "원데이 토크 신청이 접수되었습니다.\n\n" +
          "이름: " + (d.name || "-") + "\n" +
          "성별: " + (d.gender || "-") + "\n" +
          "나이: " + (d.age || "-") + "\n" +
          "연락처: " + (d.phone || "-") + "\n" +
          "모임: " + (d.meetingTitle || d.meetingDates || "-") + "\n" +
          "일시: " + (d.meetingDate || "-") + "\n" +
          (d.meetingSessions ? "회차: " + d.meetingSessions + "\n" : "") +
          "주문번호: " + (d.orderId || "-") + "\n" +
          "한 줄 인사: " + (d.greeting || "-") + "\n" +
          "인스타그램: " + (d.instagram || "-") + "\n\n" +
          "📄 스프레드시트('" + LAZYCLUB_ONEDAY_SHEET + "' 탭):\n" + lazyclubSheetUrl()
  });

  // ── 신청자에게 카카오 알림톡 (레이지클럽 채널, 2026-08-31) ──────────────
  // ⚠ **SMS 폴백을 일부러 붙이지 않았다.** 다른 핸들러(handleApply 등)는 알림톡 실패 시
  //   문자로 대체하지만, 이 템플릿은 아직 승인 전이라 항상 실패한다 — 폴백을 달면
  //   승인도 나기 전에 문자가 나가고 요금까지 붙는다. 승인 뒤 폴백이 필요하면 그때 추가.
  // ⚠ 실패해도 **접수 결과에 영향 없다** — 아래 return 은 발송 성공 여부와 무관하다
  //   (시트·관리자 메일은 이미 끝났다). ledger·CAPI 와 같은 규율.
  // ⚠ 변수는 기존 템플릿 관례대로 #{이름} 하나다. 승인된 템플릿 본문에 다른 변수가
  //   있으면 변수 불일치로 발송이 실패하므로, 승인 시 본문을 보고 이 맵을 맞출 것.
  var npOneday = normPhone(d.phone);
  if (npOneday) {
    sendKakaoAlimtalk(
      npOneday,
      KAKAO_TEMPLATE_LAZYCLUB_APPLY,
      { "#{이름}": d.name || "" },
      KAKAO_PFID_LAZYCLUB
    );
  }

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
  // 전환 재발화 여부 — 예약을 **만들기 전에** 본다 (지금 넣을 행에 걸리면 안 된다)
  var alreadyConverted = hasInterviewAlready(d.phone);

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
  // 유입 출처 (2026-08-26) — 운영 중인 시트에는 위 헤더 배열이 안 먹으므로 ensureColumn 으로.
  var pSrcIdx = ensureColumn(phoneSheet, "유입 출처"); // 0-based
  prependRow(phoneSheet, [new Date(), d.name, d.phone, start, "대기", ""]);
  var pSrcCell = phoneSheet.getRange(2, pSrcIdx + 1); // 헤더 서식 상속 끊기 (위와 같은 이유)
  pSrcCell.setBackground(null).setFontColor(null).setFontWeight("normal");
  if (d.trafficSrc) pSrcCell.setValue(d.trafficSrc);
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

  // duplicate=true 면 프론트가 CompleteRegistration 을 쏘지 않는다.
  // 시간 변경 재예약, 그리고 서면 이력이 있는 사람의 예약이 여기 걸린다.
  // 예약·알림톡은 정상 처리된다 — 바뀐 시간은 안내해야 하므로.
  return jsonResponse({ success: true, duplicate: alreadyConverted });
}

// ── 서면 인터뷰 → 서면 인터뷰 시트 + 신청현황 O 표시 ────────
/**
 * 이 번호가 **이미 인터뷰를 확정했는지** — 서면·전화 시트를 함께 본다.
 *
 * 운영자 2026-08-18: "전화/서면 모두 같은 거고 방식만 다른 거지."
 * 실제로 "전화 예약했다가 시간이 안 맞아 서면으로 가는" 경로가 종종 있는데,
 * 시트를 따로 보면 전화에서 한 번·서면에서 또 한 번 전환이 잡혀 **한 사람이
 * 2건**으로 집계된다. 한 사람은 한 번만 세야 광고 최적화가 왜곡되지 않는다.
 *
 * ⚠ 접수·알림톡 같은 실제 처리는 막지 않는다 — 이 값은 **전환 재발화 여부**만
 *   정한다. 시간을 바꿔 다시 잡는 사람에게 새 시간 안내는 나가야 한다.
 */
function hasInterviewAlready(phone) {
  var np = normPhone(phone);
  if (!np) return false;
  var sheets = [WRITTEN_SHEET, PHONE_SHEET];
  for (var si = 0; si < sheets.length; si++) {
    var sh = ss().getSheetByName(sheets[si]);
    if (!sh) continue;
    var rows = sh.getDataRange().getValues();
    if (rows.length < 2) continue;
    var col = colIndexMap(sh);
    // 서면은 '연락처', 전화는 '전화번호' 로 헤더가 다르다
    var idx = (col["연락처"] !== undefined) ? col["연락처"] : col["전화번호"];
    if (idx === undefined) continue;
    for (var ri = 1; ri < rows.length; ri++) {
      if (normPhone(rows[ri][idx]) === np) return true;
    }
  }
  return false;
}

function handleWritten(d) {
  var a = d.answers || {};
  var sheet = getOrCreateSheet(WRITTEN_SHEET,
    ["제출일시", "이름", "연락처", "Q1", "Q2", "Q3", "Q4", "Q5", "Q6"]);

  // ── 중복 제출 차단 (운영자 2026-08-18 "똑같은 사람이 제출하기 2번 누르는 게 문제네.
  //    한 번만 받아올 수 있나?").
  //    프론트 버튼은 disabled 로 연타를 막지만, 그것으로는 못 막는 경로가 있다:
  //      · 응답이 유실된 뒤 '다시 제출하기' (서버는 이미 접수했는데 화면은 실패)
  //      · 완료 후 뒤로가기·새로고침해서 다시 제출
  //    막지 않으면 시트 행·관리자 메일이 겹치고, **신청자에게 알림톡이 두 번** 나간다.
  //    같은 번호가 이미 있으면 그 행을 덮어쓴다(=재제출은 수정으로 취급).
  // 전환 재발화 여부는 **두 시트를 함께** 본다 (전화 → 서면 전환자 포함).
  // 행 덮어쓰기·알림톡 판단에 쓰는 existingRow 와는 별개다.
  var alreadyConverted = hasInterviewAlready(d.phone);

  var np = normPhone(d.phone);
  var existingRow = 0;
  if (np) {
    var rows = sheet.getDataRange().getValues();
    var wcol = colIndexMap(sheet);
    for (var wi = 1; wi < rows.length; wi++) {
      if (normPhone(rows[wi][wcol["연락처"]]) === np) { existingRow = wi + 1; break; }
    }
  }

  // 유입 출처 (2026-08-26) — 어느 경로로 들어온 손님인지. 프론트가 안 보내면 빈 값.
  //   ⚠ 헤더를 ensureColumn 으로 만든다. 위 getOrCreateSheet 의 헤더 배열은 **시트가
  //     없을 때만** 쓰인다 — 운영 중인 시트에는 배열에 칸을 더해도 컬럼이 안 생긴다.
  var srcIdx = ensureColumn(sheet, "유입 출처"); // 0-based

  var rowValues = [new Date(), d.name || "", d.phone || "",
    a.q1 || "", a.q2 || "", a.q3 || "", a.q4 || "", a.q5 || "", a.q6 || ""];
  if (existingRow) {
    // 재제출은 수정으로 취급해 답변을 덮어쓴다. 다만 setValues 는 1~9열만 건드리므로
    // 유입 출처는 자연히 보존된다 — **최초 유입이 공이다**(운영자 2026-08-26).
    // 옛 행(이 기능 이전 제출)만 비어 있으니 그때만 채운다.
    sheet.getRange(existingRow, 1, 1, rowValues.length).setValues([rowValues]);
    var cur = sheet.getRange(existingRow, srcIdx + 1);
    if (!String(cur.getValue()).trim() && d.trafficSrc) cur.setValue(d.trafficSrc);
  } else {
    prependRow(sheet, rowValues);
    // prependRow 는 값 범위에만 서식을 초기화한다 — 그 밖인 이 칸도 헤더 서식(굵게·배경)을
    // 물려받으므로 같이 끊는다.
    var srcCell = sheet.getRange(2, srcIdx + 1);
    srcCell.setBackground(null).setFontColor(null).setFontWeight("normal");
    if (d.trafficSrc) srcCell.setValue(d.trafficSrc);
  }

  updateMainStatus(d.phone, { "인터뷰 상태": "O" });

  // 질문 원문(프론트가 보낸 questions) + 답변 매핑. 없으면 WRITTEN_QUESTIONS fallback.
  var qs = (d.questions && d.questions.length) ? d.questions : WRITTEN_QUESTIONS;
  var qaBlocks = qs.map(function (q) {
    return q.label + ". " + q.text + (q.sub ? "\n   (" + q.sub + ")" : "") +
           "\n\n" + (a[q.id] || "(미작성)");
  }).join("\n\n─────────────────────────────\n\n");

  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "[레이지데이 북클럽] 서면 인터뷰 " + (existingRow ? "재제출(수정)" : "제출") + " — " + (d.name || "?") + "님",
    body: "서면 인터뷰 답변이 접수되었습니다.\n\n이름: " + (d.name || "-") + "\n연락처: " + (d.phone || "-") +
          "\n\n📄 스프레드시트:\nhttps://docs.google.com/spreadsheets/d/" + SHEET_ID +
          "\n\n═════════════════════════════\n\n" + qaBlocks
  });

  // 신청자에게 카카오 알림톡 (실패 시 SMS fallback).
  // ⚠ 재제출(수정)이면 보내지 않는다 — 같은 안내가 두 번 가고 발송 비용도 이중이다.
  var npWritten = normPhone(d.phone);
  if (npWritten && !existingRow) {
    var okWritten = sendKakaoAlimtalk(npWritten, KAKAO_TEMPLATE_WRITTEN, { "#{이름}": d.name || "" });
    if (!okWritten) sendSMS(npWritten,
      "[레이지데이 북클럽]\n" + (d.name || "") + "님, 서면 인터뷰가 제출되었습니다.\n소중한 답변 감사드려요. 검토 후 개별 연락드리겠습니다.");
  }

  // duplicate=true 면 프론트가 CompleteRegistration 을 다시 쏘지 않는다
  // (한 사람의 인터뷰 확정이 전환 2건으로 잡히는 것을 막는다)
  return jsonResponse({ success: true, duplicate: alreadyConverted });
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

// ═══════════════════════════════════════════════════════════════════
// 전화 인터뷰 미예약 24h 리마인드 (2026-08-12, 운영자 지시)
//   전화 인터뷰를 신청하고 24시간이 지나도록 일정을 제출하지 않은 사람을 찾아,
//   **운영자에게만** 메일을 보낸다. 메일에는 그대로 복사해 카카오톡에 붙여넣을
//   안내 초안이 들어가고, 초안의 가능 시간대(금일·익일·모레)는 발송 시점의
//   캘린더를 읽어 계산한다. 신청자에게 자동 발송하는 것이 아니다 — 운영자가
//   눈으로 한 번 거른 뒤 직접 보내는 구조.
//
//   실행: 10분 간격 트리거 + 창(窓) 게이트. 매일 15:30~22:00 사이에만 동작하므로
//        대상이 생겨도 10분 넘게 방치되지 않는다 (운영자 2026-08-12
//        "매일 15:30 기준 / 15:30-22:00에는 10분 이상 알림 없으면 바로 메일").
//   1회 보장: 발송분은 '리마인드 발송' 칼럼에 타임스탬프를 남겨 다시 잡히지 않는다.
// ═══════════════════════════════════════════════════════════════════

var DIGEST_EMAIL = "contact@linkylounge.com"; // 운영자 수신 (ADMIN_EMAIL 과 별개 — 수신처가 다르다)
var REMIND_AFTER_H = 24;                      // 신청 후 이 시간이 지나야 대상 (하한)
// 상한 — "하루 기준"이라는 건 하한만이 아니라 상한도 하루 남짓이라는 뜻이다
// (운영자 2026-08-13 "하루 기준 아니야?"). 이게 없으면 지난 기수에 신청하고
// 예약 안 한 사람이 전원 한꺼번에 잡혀, 몇 달 전 신청자에게 "금일은 아래 시간에
// 가능합니다" 초안이 만들어진다.
// ⚠ 24 가 아니라 48 인 이유: 점검 창이 15:30~22:00 이라 22:01 에 24시간을 넘긴
//   사람은 다음날 15:30 에 처음 잡힌다(그때 경과 약 41.5시간). 24 로 조이면
//   창 밖에서 24시간을 넘긴 사람이 영구히 누락된다.
var REMIND_MAX_AGE_H = 48;
var REMIND_DONE_HEADER = "리마인드 발송";       // 신청현황에 자동 생성되는 플래그 칼럼
var REMIND_AGE_MIN = 20;                      // 나이 허용 범위 (운영자 확정: 20~55)
var REMIND_AGE_MAX = 55;
var REMIND_TEST_NAMES = ["안동민", "조세훈"];   // 내부 테스트 제출 명단 — 필요하면 여기만 고친다
var REMIND_DAYS = 3;                          // 초안에 넣을 날: 금일·익일·모레
var REMIND_WINDOW_START_MIN = 15 * 60 + 30;   // 15:30 KST
var REMIND_WINDOW_END_MIN   = 22 * 60;        // 22:00 KST

// 인터뷰 슬롯 규칙 — apply/interview/schedule/page.tsx 14~26행과 **같은 값**이어야 한다.
// (한쪽만 고치면 안내한 시간에 신청자가 예약을 못 하는 사고가 난다)
var IV_SLOT_MIN = 30;                    // 슬롯 길이(분)
var IV_MIN_NOTICE_MS = 2 * 3600 * 1000;  // 지금부터 2시간 넘게 남은 슬롯만
function ivSlotConfig(dow) {
  if (dow >= 1 && dow <= 5) return { startH: 18, endH: 23 }; // 평일 18:00–23:00
  return { startH: 13, endH: 23 };                            // 주말 13:00–23:00
}

// ── 필터 (통과면 "" 반환, 걸리면 사유 문자열 반환) ──────────────────
function remindNameOk(raw) {
  var n = String(raw || "").replace(/\s+/g, "");
  if (!n) return "이름 없음";
  if (/[ㄱ-ㅎㅏ-ㅣ]/.test(n)) return "자음·모음만 입력";
  var hangul = /^[가-힣]{2,5}$/.test(n);
  var latin = /^[A-Za-z][A-Za-z.\-]+$/.test(n);
  if (!hangul && !latin) return "이름 형식이 아님";
  if (/^(.)\1+$/.test(n)) return "같은 글자 반복";
  var low = n.toLowerCase();
  var junk = ["test", "테스트", "asdf", "qwer", "abcd", "aaaa", "1234"];
  for (var i = 0; i < junk.length; i++) if (low.indexOf(junk[i]) !== -1) return "테스트 입력으로 보임";
  for (var j = 0; j < REMIND_TEST_NAMES.length; j++) if (n === REMIND_TEST_NAMES[j]) return "내부 테스트 명단";
  return "";
}

function remindAgeOk(raw) {
  var s = String(raw == null ? "" : raw).replace(/[^0-9]/g, "");
  if (!s) return "나이 없음";
  var n = parseInt(s, 10);
  if (isNaN(n)) return "나이 형식 아님";
  if (n < REMIND_AGE_MIN || n > REMIND_AGE_MAX) {
    return "나이 범위 밖 (" + REMIND_AGE_MIN + "~" + REMIND_AGE_MAX + ")";
  }
  return "";
}

function remindPhoneOk(raw) {
  var p = normPhone(raw);
  if (!p) return "번호 없음";
  if (p.length !== 11) return "자릿수 이상";
  if (p.indexOf("010") !== 0) return "010 아님";
  var tail = p.substring(3);
  if (/^(\d)\1+$/.test(tail)) return "반복 번호";
  if ("0123456789012345678".indexOf(tail) !== -1) return "연속 번호";
  if ("9876543210987654321".indexOf(tail) !== -1) return "연속 번호";
  return "";
}

// 경과 시간 창 — 신청 후 24~48시간 사이만 대상 ("하루 기준").
// 루프 안 조건이 아니라 함수로 뺀 이유: 이 판정이 대상 선정의 핵심인데
// 경계(23h/24h/48h/49h)를 눈으로만 확인하면 놓친다 — node 로 검증하려고.
function remindAgeWindowOk(appliedMs, nowMs) {
  var elapsed = nowMs - appliedMs;
  if (elapsed < REMIND_AFTER_H * 3600000) return false;    // 아직 하루 안 됨
  if (elapsed > REMIND_MAX_AGE_H * 3600000) return false;  // 하루 기준을 넘겨 지난 건
  return true;
}

// 호칭 — 한글 3자면 성을 뗀다(안동민 → 동민). 2자·4자 이상·영문은 전체 그대로.
function shortName(raw) {
  var n = String(raw || "").replace(/\s+/g, "");
  if (/^[가-힣]{3}$/.test(n)) return n.substring(1);
  return n;
}

// ── 가능 시간대 계산 ────────────────────────────────────────────────
// KST 기준 offsetDays 일 뒤의 달력 날짜. 요일은 UTC 로 만들어 계산해
// 스크립트 타임존 설정에 좌우되지 않게 한다.
function ivKstDay(offsetDays, nowMs) {
  var s = Utilities.formatDate(new Date(nowMs + offsetDays * 86400000), "Asia/Seoul", "yyyy-MM-dd");
  var p = s.split("-");
  var y = parseInt(p[0], 10), mo = parseInt(p[1], 10) - 1, d = parseInt(p[2], 10);
  return { y: y, mo: mo, d: d, dow: new Date(Date.UTC(y, mo, d)).getUTCDay() };
}

// 하루치 가용 슬롯. busy = [{s: ms, e: ms}] (인터뷰 예약 + [BLOCK] 차단 모두)
// ⚠ 겹침(overlap) 판정을 쓴다 — 클라이언트(schedule/page.tsx)는 이벤트 시작에서
//   30분씩 전진해 키를 만들기 때문에 :00/:30 에 정렬되지 않은 수기 이벤트를 놓친다.
//   여기서 같은 방식을 쓰면 "가능"이라 안내한 시간이 실제로는 막혀 있을 수 있다.
function interviewFreeSlots(day, busy, nowMs) {
  var cfg = ivSlotConfig(day.dow);
  var out = [];
  for (var h = cfg.startH; h < cfg.endH; h++) {
    for (var m = 0; m < 60; m += IV_SLOT_MIN) {
      var s = Date.UTC(day.y, day.mo, day.d, h - 9, m); // KST → UTC
      var e = s + IV_SLOT_MIN * 60000;
      if (s <= nowMs + IV_MIN_NOTICE_MS) continue;
      var blocked = false;
      for (var i = 0; i < busy.length; i++) {
        if (busy[i].s < e && s < busy[i].e) { blocked = true; break; }
      }
      if (!blocked) out.push({ s: s, e: e });
    }
  }
  return out;
}

function ivHm(ms) { return Utilities.formatDate(new Date(ms), "Asia/Seoul", "HH:mm"); }

// 연속 슬롯을 한 구간으로 합쳐 "19:00-21:00" 형태로
function mergeSlotRanges(slots) {
  var merged = [];
  for (var i = 0; i < slots.length; i++) {
    var last = merged[merged.length - 1];
    if (last && last.e === slots[i].s) last.e = slots[i].e;
    else merged.push({ s: slots[i].s, e: slots[i].e });
  }
  return merged.map(function (r) { return ivHm(r.s) + "-" + ivHm(r.e); });
}

// ── 카톡 안내 초안 (운영자 지정 문형) ────────────────────────────────
function buildInterviewDraft(name, days) {
  var t = shortName(name) + "님, 안녕하세요. 레이지데이 북클럽입니다.\n\n";
  t += "전화인터뷰 신청하셔서 일정 확인차 연락 드립니다.\n";

  var shown = 0;
  for (var i = 0; i < days.length; i++) {
    var d = days[i];
    if (!d.ranges.length) continue;
    if (shown === 0) {
      // 첫 줄만 서술형 — 금일이 비면 익일이 그 자리를 받는다
      t += (i === 0 ? d.name : d.name + " " + d.dowLabel) + d.suffix + " 아래 시간 사이에 가능합니다.\n\n";
    } else {
      t += "\n" + d.name + " " + d.dowLabel + "\n\n";
    }
    for (var j = 0; j < d.ranges.length; j++) t += "* " + d.ranges[j] + "\n";
    shown++;
  }
  if (shown === 0) t += "\n가능한 시간을 확인해 다시 안내드리겠습니다.\n";

  t += "\n희망하시는 시간 있으시면 말씀해주세요!";
  return t;
}

// ── 본체 ────────────────────────────────────────────────────────────
var REMIND_DOW_KO = ["일", "월", "화", "수", "목", "금", "토"];

// 플래그 기록 — 스캔 중 새 신청이 prependRow 로 들어오면 행이 밀리므로,
// 쓰기 전에 전화번호로 같은 행인지 확인하고 어긋나면 다시 찾는다.
function remindMarkRow(sheet, phoneIdx, flagIdx, rowNo, phone, value) {
  var np = normPhone(phone);
  if (normPhone(sheet.getRange(rowNo, phoneIdx + 1).getValue()) !== np) {
    var colVals = sheet.getRange(1, phoneIdx + 1, sheet.getLastRow(), 1).getValues();
    rowNo = -1;
    for (var i = 1; i < colVals.length; i++) {
      if (normPhone(colVals[i][0]) === np) { rowNo = i + 1; break; }
    }
    if (rowNo === -1) return false;
  }
  sheet.getRange(rowNo, flagIdx + 1).setValue(value);
  return true;
}

/** 트리거 핸들러. 창 밖이면 아무것도 하지 않는다. */
function remindPendingInterviews() {
  var nowMs = Date.now();
  var hm = Utilities.formatDate(new Date(nowMs), "Asia/Seoul", "HH:mm").split(":");
  var minOfDay = parseInt(hm[0], 10) * 60 + parseInt(hm[1], 10);
  // 게이트를 시트 열기 전에 둔다 — 창 밖 실행은 거의 비용이 없다
  if (minOfDay < REMIND_WINDOW_START_MIN || minOfDay >= REMIND_WINDOW_END_MIN) {
    return { skipped: "창 밖", sent: 0 };
  }
  return remindPendingScan(nowMs);
}

/** 실제 스캔·발송. 창 게이트 없이 도는 형태라 수동 실행에서도 쓴다. */
function remindPendingScan(nowMs) {
  var main = ss().getSheetByName(MAIN_SHEET);
  if (!main) return { sent: 0, excluded: 0, error: "신청현황 시트 없음" };

  ensureColumn(main, REMIND_DONE_HEADER);
  var col = colIndexMap(main);
  var flagIdx = col[REMIND_DONE_HEADER];
  var phoneIdx = col["전화번호"];
  var data = main.getDataRange().getValues();

  // '전화 인터뷰' 시트에 번호가 있으면 이미 예약한 사람 — 신청현황 역매핑이
  // 실패(다른 번호로 예약)했을 때의 위양성을 여기서 막는다
  var booked = presenceSet(PHONE_SHEET, "전화번호", 2);

  var targets = [], excluded = [];
  for (var i = 1; i < data.length; i++) {
    var r = data[i];
    if (String(r[col["인터뷰 방식"]] || "").indexOf("전화") === -1) continue;
    if (String(r[col["인터뷰 일시"]] || "").trim() !== "") continue;
    if (String(r[flagIdx] || "").trim() !== "") continue;

    var applied = r[col["신청일자"]];
    if (!(applied instanceof Date)) continue;      // 날짜값이 아니면 판정 불가 — 건너뜀
    // 24~48시간 창 밖은 건너뛴다. ⚠ 상한 초과분에는 플래그를 찍지 않는다 —
    // 찍으면 나중에 기준을 넓혀도 되살릴 수 없다 (안 찍으면 기준을 바꾸는 즉시 살아난다)
    if (!remindAgeWindowOk(applied.getTime(), nowMs)) continue;

    var phone = String(r[phoneIdx] || "");
    if (booked[normPhone(phone)]) continue;

    var name = String(r[col["이름"]] || "");
    var age = r[col["나이"]];
    var rec = {
      row: i + 1, name: name, age: age, phone: phone, applied: applied,
      hours: Math.floor((nowMs - applied.getTime()) / 3600000),
    };
    var why = remindNameOk(name) || remindAgeOk(age) || remindPhoneOk(phone);
    if (why) { rec.why = why; excluded.push(rec); } else { targets.push(rec); }
  }

  if (!targets.length && !excluded.length) return { sent: 0, excluded: 0 };

  // 가능 시간대는 전원 공통 — 한 번만 계산
  var busy = [];
  try {
    var cal = CalendarApp.getCalendarById(CALENDAR_ID);
    if (cal) {
      var evs = cal.getEvents(new Date(nowMs), new Date(nowMs + (REMIND_DAYS + 1) * 86400000));
      busy = evs.map(function (ev) {
        return { s: ev.getStartTime().getTime(), e: ev.getEndTime().getTime() };
      });
    }
  } catch (err) { Logger.log("리마인드 캘린더 조회 오류: " + err.message); }

  var defs = [
    { name: "금일", suffix: "은", off: 0 },
    { name: "익일", suffix: "은", off: 1 },
    { name: "모레", suffix: "는", off: 2 },
  ];
  var days = defs.map(function (dd) {
    var k = ivKstDay(dd.off, nowMs);
    return {
      name: dd.name, suffix: dd.suffix,
      dowLabel: "(" + REMIND_DOW_KO[k.dow] + "요일)",
      ranges: mergeSlotRanges(interviewFreeSlots(k, busy, nowMs)),
    };
  });

  // ── 메일 본문 ──
  var body = "";
  if (targets.length) {
    body += "전화 인터뷰 신청 후 24시간이 지나도록 일정을 제출하지 않은 분이 "
      + targets.length + "명 있습니다.\n아래 초안을 그대로 복사해 카카오톡으로 보내시면 됩니다.\n";
  } else {
    body += "발송 대상은 없고, 자동 판별로 제외된 신청만 " + excluded.length + "건 있습니다.\n";
  }

  for (var t = 0; t < targets.length; t++) {
    var rec2 = targets[t];
    body += "\n═════════════════════════════\n\n";
    body += "[" + (t + 1) + "] " + shortName(rec2.name) + "님 · " + rec2.phone + " · "
      + Utilities.formatDate(rec2.applied, "Asia/Seoul", "M/d HH:mm") + " 신청 ("
      + rec2.hours + "시간 경과)\n";
    body += "───────── 복사 시작 ─────────\n";
    body += buildInterviewDraft(rec2.name, days) + "\n";
    body += "───────── 복사 끝 ─────────\n";
  }

  if (excluded.length) {
    body += "\n═════════════════════════════\n";
    body += "제외 " + excluded.length + "건 (자동 판별 — 오탐이면 알려주세요)\n";
    for (var x = 0; x < excluded.length; x++) {
      var e2 = excluded[x];
      body += "· " + (e2.name || "(이름 없음)") + " / " + (e2.age || "-") + "세 / "
        + (e2.phone || "-") + " — " + e2.why + "\n";
    }
  }

  body += "\n📄 스프레드시트('" + MAIN_SHEET + "' 탭):\nhttps://docs.google.com/spreadsheets/d/" + SHEET_ID;

  var subject = targets.length
    ? "[레이지데이 북클럽] 인터뷰 일정 미제출 " + targets.length + "건 — 카톡 안내 초안"
    : "[레이지데이 북클럽] 인터뷰 일정 미제출 — 제외 " + excluded.length + "건만";

  MailApp.sendEmail({ to: DIGEST_EMAIL, subject: subject, body: body });

  // 발송에 성공한 뒤에만 플래그 — 제외분도 함께 찍어야 매번 다시 잡히지 않는다
  var stamp = Utilities.formatDate(new Date(nowMs), "Asia/Seoul", "yyyy-MM-dd HH:mm");
  targets.forEach(function (rec3) {
    remindMarkRow(main, phoneIdx, flagIdx, rec3.row, rec3.phone, stamp);
  });
  excluded.forEach(function (rec4) {
    remindMarkRow(main, phoneIdx, flagIdx, rec4.row, rec4.phone, stamp + " 제외(" + rec4.why + ")");
  });

  return { sent: targets.length, excluded: excluded.length };
}

/** 메뉴에서 즉시 1회 실행 (창 게이트 무시) — 배포 직후 확인용 */
function remindPendingNow() {
  var r = remindPendingScan(Date.now());
  SpreadsheetApp.getUi().alert(
    r.error ? "오류: " + r.error
      : (r.sent || r.excluded)
        ? "메일을 보냈습니다.\n대상 " + r.sent + "명 / 제외 " + r.excluded + "건\n수신: " + DIGEST_EMAIL
        : "대상이 없어 메일을 보내지 않았습니다."
  );
}

/** 10분 간격 트리거 등록 (핸들러가 15:30~22:00 창만 처리) */
function enableInterviewReminder() {
  var exists = ScriptApp.getProjectTriggers().some(function (t) {
    return t.getHandlerFunction() === "remindPendingInterviews";
  });
  if (!exists) {
    ScriptApp.newTrigger("remindPendingInterviews").timeBased().everyMinutes(10).create();
  }
  SpreadsheetApp.getUi().alert(exists
    ? "자동 리마인드가 이미 켜져 있습니다 (15:30~22:00, 10분 간격)."
    : "자동 리마인드가 켜졌습니다 (15:30~22:00, 10분 간격).");
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
    .addItem("지금 리마인드 점검 (미예약 24h)", "remindPendingNow")
    .addItem("자동 리마인드 켜기 (15:30~22:00)", "enableInterviewReminder")
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
// pfId 는 **생략 가능**하다 — 안 주면 북클럽 채널(KAKAO_PFID). 레이지클럽처럼 다른
// 채널의 템플릿을 보낼 때만 4번째 인자로 넘긴다 (2026-08-31). 기존 호출부는 무변경.
function sendKakaoAlimtalk(to, templateId, variables, pfId) {
  if (!to || !templateId) return false;
  try {
    var resp = UrlFetchApp.fetch("https://api.solapi.com/messages/v4/send", {
      method: "post",
      headers: { "Authorization": buildSolapiAuth(), "Content-Type": "application/json" },
      payload: JSON.stringify({ message: {
        to: to, from: SENDER_PHONE,
        kakaoOptions: { pfId: pfId || KAKAO_PFID, templateId: templateId, variables: variables }
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
