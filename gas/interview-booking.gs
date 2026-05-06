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
    var cal   = CalendarApp.getCalendarById(CALENDAR_ID);
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
  var existing = cal.getEvents(start, end);
  if (existing.length > 0) {
    return jsonResponse({ success: false, error: "이미 예약된 시간입니다. 다른 시간을 선택해주세요." });
  }

  // 2. 캘린더 이벤트 생성
  var dateStr    = Utilities.formatDate(start, "Asia/Seoul", "M/d");
  var timeStr    = Utilities.formatDate(start, "Asia/Seoul", "HH:mm");
  var endTimeStr = Utilities.formatDate(end,   "Asia/Seoul", "HH:mm");
  cal.createEvent(
    "[인터뷰] " + name + "님",
    start,
    end,
    {
      description:
        "이름: " + name + "\n" +
        "전화번호: " + phone + "\n"
    }
  );

  // 3. 스프레드시트 기록
  var sheet = getSheet(SHEET_NAME, ["신청일시", "이름", "연락처", "인터뷰 날짜", "인터뷰 시간"]);
  sheet.appendRow([
    new Date(),
    name,
    phone,
    Utilities.formatDate(start, "Asia/Seoul", "yyyy-MM-dd"),
    timeStr
  ]);

  // 4. 관리자 Gmail 알림
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "[레이지데이 북클럽] 전화 인터뷰 신청 — " + name + "님 " + dateStr + " " + timeStr,
    body:
      "전화 인터뷰 예약이 접수되었습니다.\n\n" +
      "이름: " + name + "\n" +
      "연락처: " + phone + "\n" +
      "일시: " + dateStr + " " + timeStr + " – " + endTimeStr + "\n\n" +
      "Google Calendar에서 확인하세요."
  });

  // 5. 신청자 확인 SMS (Solapi)
  if (SOLAPI_KEY && SOLAPI_SEC) {
    var authHeader = buildSolapiAuth();
    sendSMS(authHeader, phone.replace(/-/g, ""),
      "[레이지데이 북클럽]\n" +
      name + "님, 전화 인터뷰 예약이 완료되었습니다.\n\n" +
      "일시: " + dateStr + " " + timeStr + "\n" +
      "담당자가 해당 시간에 전화드릴게요."
    );
  }

  return jsonResponse({ success: true });
}

// ── 서면 인터뷰 제출 ──────────────────────────────────────────────
function handleWrittenInterview(data) {
  var name    = data.name    || "";
  var phone   = data.phone   || "";
  var answers = data.answers || {};

  // 1. 스프레드시트 기록
  var sheet = getSheet(WRITTEN_SHEET_NAME, [
    "제출일시", "이름", "연락처",
    "Q1. 레이지데이와 책",
    "Q2. 서점 코너",
    "Q3. 좋아하는 단어/문장",
    "Q4. 책 읽을 때 필요한 것",
    "Q5. 다른 가치관과 대화",
    "Q6. 함께 읽고 싶은 책"
  ]);
  sheet.appendRow([
    new Date(),
    name,
    phone,
    answers.q1 || "",
    answers.q2 || "",
    answers.q3 || "",
    answers.q4 || "",
    answers.q5 || "",
    answers.q6 || ""
  ]);

  // 2. 관리자 Gmail 알림 (전체 답변 포함)
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "[레이지데이 북클럽] 서면 인터뷰 — " + name + "님",
    body:
      "서면 인터뷰 답변이 접수되었습니다.\n\n" +
      "이름: " + name + "\n" +
      "연락처: " + phone + "\n\n" +
      "─────────────────────────────\n\n" +
      "Q1. 당신에게 '레이지데이'는 어떤 모습인가요? 그 자리에 책 한 권이 있다면?\n" +
      (answers.q1 || "(미작성)") + "\n\n" +
      "Q2. 서점에 가면 어떤 코너에 먼저 들르시나요?\n" +
      (answers.q2 || "(미작성)") + "\n\n" +
      "Q3. 좋아하는 단어나 문장이 있으신가요?\n" +
      (answers.q3 || "(미작성)") + "\n\n" +
      "Q4. 책 읽을 때 꼭 필요한 물건이나 환경이 있으신가요?\n" +
      (answers.q4 || "(미작성)") + "\n\n" +
      "Q5. 가치관이 다른 사람과 대화할 때 어떤 태도를 취하시나요?\n" +
      (answers.q5 || "(미작성)") + "\n\n" +
      "Q6. 모임에서 함께 다뤄보고 싶은 책이 있으신가요?\n" +
      (answers.q6 || "(미작성)")
  });

  return jsonResponse({ success: true });
}

// ── 헬퍼 ─────────────────────────────────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function buildSolapiAuth() {
  var timestamp = new Date().getTime().toString();
  var salt      = Utilities.getUuid().replace(/-/g, "").substring(0, 20);
  var raw       = Utilities.computeHmacSha256Signature(
    timestamp + salt, SOLAPI_SEC
  );
  var signature = raw.map(function(b) {
    return ("0" + (b & 0xff).toString(16)).slice(-2);
  }).join("");
  return [
    "HMAC-SHA256 apiKey=" + SOLAPI_KEY,
    "date=" + timestamp,
    "salt=" + salt,
    "signature=" + signature
  ].join(", ");
}

function sendSMS(authHeader, to, text) {
  try {
    UrlFetchApp.fetch("https://api.solapi.com/messages/v4/send", {
      method: "post",
      headers: {
        "Authorization":  authHeader,
        "Content-Type":   "application/json"
      },
      payload: JSON.stringify({
        message: { to: to, from: SENDER_PHONE, text: text }
      }),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log("SMS 발송 오류: " + err.message);
  }
}
