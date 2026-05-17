// ================================================================
// 레이지데이 북클럽 — 인터뷰 예약 Google Apps Script
// ================================================================
// 배포 방법:
//   확장 프로그램 → Apps Script → 아래 코드 붙여넣기
//   배포 → 새 배포 → 유형: 웹 앱
//   실행 계정: 나(linkylounge@gmail.com) / 액세스 권한: 모든 사용자
//   배포 후 URL을 Vercel 환경변수 INTERVIEW_GAS_URL 에 설정
// ================================================================

// ── 설정값 (여기만 수정) ──────────────────────────────────────────
var CALENDAR_ID  = "8c67d5250aeba2aa08f4c8f8811fc6b965b7c44d57ca968378ae2d90575b8008@group.calendar.google.com";
var ADMIN_EMAIL  = "linkylounge@gmail.com"; // 관리자 알림 수신 이메일
var SHEET_ID     = "1yDy7VeJ_XkOYNfv_CXVqXy0S1UOAObgCiL4j22etfko";
var SENDER_PHONE = "010-7444-5790";         // 솔라피 발신 번호
var SOLAPI_KEY   = "NCSEQASUIXASGIJW";     // 솔라피 API Key
var SOLAPI_SEC   = "4H6JALTBSXESIPG4IVTTT2FABGSFCKQN"; // 솔라피 API Secret
// ────────────────────────────────────────────────────────────────

// ── 스프레드시트 (없으면 자동 생성) ──────────────────────────────
function getSheet(sheetName, headers) {
  var props   = PropertiesService.getScriptProperties();
  var sheetId = SHEET_ID || props.getProperty("AUTO_SHEET_ID");
  var ss;

  if (sheetId) {
    try { ss = SpreadsheetApp.openById(sheetId); } catch (e) { sheetId = null; }
  }
  if (!sheetId) {
    ss = SpreadsheetApp.create("레이지데이 북클럽 신청 데이터");
    var newId = ss.getId();
    props.setProperty("AUTO_SHEET_ID", newId);
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: "[레이지데이] 스프레드시트 자동 생성됨",
      body: "스프레드시트가 생성되었습니다.\n링크: https://docs.google.com/spreadsheets/d/" + newId + "/edit"
    });
  }

  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
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
// ────────────────────────────────────────────────────────────────

// ── GET: 예약된 슬롯 목록 반환 (캘린더 기반) ─────────────────────
function doGet(e) {
  try {
    var cal = CalendarApp.getCalendarById(CALENDAR_ID);
    var bookedSlots = [];

    if (cal) {
      // 오늘부터 60일 이내 이벤트 조회
      var now  = new Date();
      var then = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      var events = cal.getEvents(now, then);
      for (var i = 0; i < events.length; i++) {
        bookedSlots.push({
          start: events[i].getStartTime().toISOString(),
          end:   events[i].getEndTime().toISOString()
        });
      }
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

    if (data.type === "written") {
      return handleWrittenInterview(data);
    }

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

  var dateStr    = Utilities.formatDate(start, "Asia/Seoul", "M/d (E)");
  var timeStr    = Utilities.formatDate(start, "Asia/Seoul", "HH:mm");
  var endTimeStr = Utilities.formatDate(end,   "Asia/Seoul", "HH:mm");

  // 1. 구글 캘린더에 이벤트 추가
  var cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (cal) {
    cal.createEvent(
      "[인터뷰] " + name + " (" + phone + ")",
      start,
      end,
      { description: "전화 인터뷰\n이름: " + name + "\n연락처: " + phone }
    );
  }

  // 2. 관리자 이메일 알림
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "[레이지데이 북클럽] 전화 인터뷰 신청 — " + name + "님 " + dateStr + " " + timeStr,
    body:
      "전화 인터뷰 예약이 접수되었습니다.\n\n" +
      "이름: " + name + "\n" +
      "연락처: " + phone + "\n" +
      "일시: " + dateStr + " " + timeStr + " – " + endTimeStr + "\n\n" +
      "구글 캘린더에 자동으로 추가되었습니다."
  });

  // 3. 신청자 확인 SMS (Solapi)
  if (SOLAPI_KEY && SOLAPI_SEC) {
    try {
      var authHeader = buildSolapiAuth();
      sendSMS(authHeader, phone.replace(/-/g, ""),
        "[레이지데이 북클럽]\n" +
        name + "님, 전화 인터뷰 예약이 완료되었습니다.\n\n" +
        "일시: " + dateStr + " " + timeStr + "\n" +
        "담당자가 해당 시간에 전화드릴게요."
      );
    } catch (smsErr) {
      Logger.log("SMS 발송 오류: " + smsErr.message);
    }
  }

  return jsonResponse({ success: true });
}

// ── 서면 인터뷰 제출 (0513 버전) ─────────────────────────────────
function handleWrittenInterview(data) {
  var name    = data.name    || "";
  var phone   = data.phone   || "";
  var answers = data.answers || {};

  // 1. 스프레드시트 저장 (0513 시트로 분리 — 기존 시트 데이터 보존)
  var sheet = getSheet("서면 인터뷰 0513", [
    "제출일시", "이름", "연락처",
    "Q1. 레이지데이와 책", "Q2. 오래 붙들어본 주제", "Q3. 흔든 작품",
    "Q4. 다르게 본 개념·통념", "Q5. 매력·이성 마찰", "Q6. 모임에 던지는 질문"
  ]);
  sheet.appendRow([
    new Date(), name, phone,
    answers.q1 || "", answers.q2 || "", answers.q3 || "",
    answers.q4 || "", answers.q5 || "", answers.q6 || ""
  ]);

  // 2. 관리자 이메일 알림 (전체 답변 포함)
  MailApp.sendEmail({
    to: ADMIN_EMAIL,
    subject: "[레이지데이 북클럽] 서면 인터뷰 — " + name + "님",
    body:
      "서면 인터뷰 답변이 접수되었습니다.\n\n" +
      "이름: " + name + "\n" +
      "연락처: " + phone + "\n\n" +
      "─────────────────────────────\n\n" +
      "Q1. 당신에게 '레이지데이(=여유롭고 느긋한 하루)'는 어떤 모습인가요? 그 자리에 책 한 권이 같이 있다면 어떤 책일까요?\n" +
      (answers.q1 || "(미작성)") + "\n\n" +
      "Q2. 한 가지 주제를 오래 붙들어본 적이 있나요? ('개념에 대한 정의'·'일'·'나 자신' 등)\n" +
      (answers.q2 || "(미작성)") + "\n\n" +
      "Q3. 최근 본인을 가장 오래 흔들었던 작품이 있나요? (책·영화·음악·전시·콘텐츠 등)\n" +
      (answers.q3 || "(미작성)") + "\n\n" +
      "Q4. \"다들 이렇게 받아들이는데 나는 좀 다르게 본다\" 싶은 개념이나 통념이 있나요?\n" +
      (answers.q4 || "(미작성)") + "\n\n" +
      "Q5. 본인의 기준·가치관과 어긋났지만 매력적이었던 메시지나 사람이 있었나요? (또는 반대로 마음이 안 따라준 경험)\n" +
      (answers.q5 || "(미작성)") + "\n\n" +
      "Q6. 행복·사랑·관계·성장·예술·철학 중 하나로 모임에 던지고 싶은 질문과 그 이유는?\n" +
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
  var timestamp = new Date().toISOString();
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
  UrlFetchApp.fetch("https://api.solapi.com/messages/v4/send", {
    method: "post",
    headers: {
      "Authorization": authHeader,
      "Content-Type":  "application/json"
    },
    payload: JSON.stringify({
      message: { to: to, from: SENDER_PHONE, text: text }
    }),
    muteHttpExceptions: true
  });
}
