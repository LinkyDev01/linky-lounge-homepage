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

// ── GET: 예약된 슬롯 목록 반환 ────────────────────────────────────
function doGet(e) {
  try {
    var cal = CalendarApp.getCalendarById(CALENDAR_ID);
    if (!cal) {
      // 캘린더를 찾지 못한 경우: 빈 슬롯 목록 반환 (프론트엔드는 정상 동작)
      Logger.log("캘린더를 찾을 수 없습니다. CALENDAR_ID를 확인하세요: " + CALENDAR_ID);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, bookedSlots: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var now   = new Date();
    var limit = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000); // 4주
    var events = cal.getEvents(now, limit);

    var bookedSlots = events.map(function(ev) {
      return {
        start: ev.getStartTime().toISOString(),
        end:   ev.getEndTime().toISOString()
      };
    });

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

  // 1. 이미 예약된 시간인지 확인
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) {
    Logger.log("캘린더를 찾을 수 없습니다. CALENDAR_ID를 확인하세요: " + CALENDAR_ID);
    // 캘린더 없어도 예약 자체는 시트+메일로 처리 (아래 계속)
  }
  var existing = cal ? cal.getEvents(start, end) : [];
  if (existing.length > 0) {
    return jsonResponse({ success: false, error: "이미 예약된 시간입니다. 다른 시간을 선택해주세요." });
  }

  // 2. 캘린더 이벤트 생성
  var dateStr    = Utilities.formatDate(start, "Asia/Seoul", "M/d");
  var timeStr   