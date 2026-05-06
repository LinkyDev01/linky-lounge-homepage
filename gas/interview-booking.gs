// ================================================================
// 레이지데이 북클럽 — 인터뷰 예약 Google Apps Script
// ================================================================
// 배포 방법:
//   확장 프로그램 → Apps Script → 아래 코드 붙여넣기
//   배포 → 새 배포 → 유형: 웹 앱
//   실행 계정: 나 / 액세스 권한: 모든 사용자
//   배포 후 URL을 Vercel 환경변수 INTERVIEW_GAS_URL 에 설정
//
// 스프레드시트:
//   SHEET_ID를 비워두면 첫 제출 시 자동으로 생성됩니다.
//   생성 후 관리자 이메일로 링크가 발송됩니다.
// ================================================================

// ── 설정값 (여기만 수정) ──────────────────────────────────────────
var CALENDAR_ID        = "8c67d5250aeba2aa08f4c8f8811fc6b965b7c44d57ca968378ae2d90575b8008@group.calendar.google.com";
var ADMIN_EMAIL        = "linkylounge@gmail.com"; // 관리자 알림 수신 이메일
var SHEET_ID           = "";          // 비워두면 첫 실행 시 자동 생성
var SHEET_NAME         = "인터뷰 신청";
var WRITTEN_SHEET_NAME = "서면 인터뷰";
var SENDER_PHONE       = "";          // TODO: 솔라피 발신 번호
var SOLAPI_KEY         = "";          // TODO: 솔라피 API Key
var SOLAPI_SEC         = "";          // TODO: 솔라피 API Secret
// ────────────────────────────────────────────────────────────────

// ── 스프레드시트 가져오기 (없으면 자동 생성) ─────────────────────
function getSheet(sheetName, headers) {
  var props = PropertiesService.getScriptProperties();
  var sheetId = SHEET_ID || props.getProperty("AUTO_SHEET_ID");

  var ss;
  if (sheetId) {
    try {
      ss = SpreadsheetApp.openById(sheetId);
    } catch (e) {
      sheetId = null;
    }
  }

  if (!sheetId) {
    // 스프레드시트 자동 생성
    ss = SpreadsheetApp.create("레이지데이 북클럽 신청 데이터");
    var newId = ss.getId();
    props.setProperty("AUTO_SHEET_ID", newId);

    // 관리자에게 생성 알림 발송
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: "[레이지데이] 스프레드시트 자동 생성됨",
      body:
        "신청 데이터를 저장할 스프레드시트가 자동으로 생성되었습니다.\n\n" +
        "링크: https://docs.google.com/spreadsheets/d/" + newId + "/edit\n\n" +
        "이 링크를 북마크해두세요. 이후 신청 데이터가 모두 이 시트에 저장됩니다."
    });
  }

  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // 헤더 행 추가
    if (headers && headers.length > 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight("bold")
        .setBackground("#f5ede4")
        .setFontColor("#1a1208");
      sheet.setFrozenRows(1);
    }
  }

  return sheet;
}

// ── GET: 예약된 슬롯 목록 반환 (스프레드시트 기반) ───────────────
function doGet(e) {
  try {
    // 스프레드시트에서 예약된 슬롯 읽기 (CalendarApp 불필요)
    var bookedSlots = [];
    try {
      var sheet = getSheet(SHEET_NAME, ["신청일시", "이름", "연락처", "인터뷰 날짜", "인터뷰 시간"]);
      var rows = sheet.getDataRange().getValues();
      for (var i = 1; i < rows.length; i++) {
        var dateStr = rows[i][3]; // yyyy-MM-dd
        var timeStr = rows[i][4]; // HH:mm
        if (dateStr && timeStr) {
          // KST 시간으로 ISO 문자열 구성
          var startIso = dateStr + "T" + timeStr + ":00+09:00";
          // 종료는 시작 + 30분
          var startMs = new Date(startIso).getTime();
          var endIso = new Date(startMs + 30 * 60 * 1000).toISOString();
          bookedSlots.push({ start: startIso, end: endIso });
        }
      }
    } catch (sheetErr) {
      Logger.log("시트 읽기 오류: " + sheetErr.message);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, bookedSlots: bookedSlots }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── POST: 전화 인터뷰 예약 또는 서면 인터뷰 제출 ─────────────────
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // 서면 인터뷰 분기
    if (data.type === "written") {
      return handleWrittenInterview(data);
    }

    // 전화 인터뷰 예약 처리
    return handlePhoneInterviewBooking(data);

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ── 전화 인터뷰 예약 ──────────────────────────────────────────────
function handlePhoneInterviewBooking(data) {
  var name      = data.name;
  var phone     = data.phone;
  var slotStart = data.slotStart;
  var slotEnd   = data.slotEnd;

  if (!name || !phone || !slotStart || !slotEnd) {
    return jsonResponse({ success: false, error: "필수 항목 누락" });
  }

  var start = new Date(slotStart);
  var end   = new Date(slotEnd);

  var dateStr    = Utilities.formatDate(start, "Asia/Seoul", "M/d");
  var timeStr    = Utilities.formatDate(start, "Asia/Seoul", "HH:mm");
  var endTimeStr = Utilities.formatDate(end,   "Asia/Seoul", "HH:mm");

  // 1. 스프레드시트 기록
  var sheet = getSheet(SHEET_NAME, ["신청일시", "이름", "연락처", "인터뷰 날짜", "인터뷰 시간"]);
  sheet.appendRow([
    new Date(),
    name,
    phone,
    Utilities.formatDate(start, "Asia/Seoul", "yyyy-MM-dd"),
    timeStr
  ]);

  // 4. 관리자 Gmail 알림