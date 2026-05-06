// ================================================================
// 레이지데이 북클럽 — 인터뷰 예약 Google Apps Script
// ================================================================
// 배포 방법:
//   확장 프로그램 → Apps Script → 아래 코드 붙여넣기
//   배포 → 새 배포 → 유형: 웹 앱
//   실행 계정: 나 / 액세스 권한: 모든 사용자
//   배포 후 URL을 Vercel 환경변수 INTERVIEW_GAS_URL 에 설정
// ================================================================

// ── 설정값 (여기만 수정) ──────────────────────────────────────────
var CALENDAR_ID  = "8c67d5250aeba2aa08f4c8f8811fc6b965b7c44d57ca968378ae2d90575b8008@group.calendar.google.com";
var SHEET_ID     = "";          // TODO: 스프레드시트 ID
var SHEET_NAME   = "인터뷰 신청";
var ADMIN_PHONE  = "";          // TODO: 관리자 수신 번호 (예: "01012345678")
var SENDER_PHONE = "";          // TODO: 솔라피 발신 번호
var SOLAPI_KEY   = "";          // TODO: 솔라피 API Key
var SOLAPI_SEC   = "";          // TODO: 솔라피 API Secret
// ────────────────────────────────────────────────────────────────

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

// ── POST: 슬롯 예약 ───────────────────────────────────────────────
function doPost(e) {
  try {
    var data     = JSON.parse(e.postData.contents);
    var name     = data.name;
    var phone    = data.phone;
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
    var dateStr = Utilities.formatDate(start, "Asia/Seoul", "M/d");
    var timeStr = Utilities.formatDate(start, "Asia/Seoul", "HH:mm");
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
    if (SHEET_ID) {
      var ss    = SpreadsheetApp.openById(SHEET_ID);
      var sheet = ss.getSheetByName(SHEET_NAME);
      if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow([
        new Date(),
        name,
        phone,
        Utilities.formatDate(start, "Asia/Seoul", "yyyy-MM-dd"),
        Utilities.formatDate(start, "Asia/Seoul", "HH:mm")
      ]);
    }

    // 4. Solapi SMS
    if (SOLAPI_KEY && SOLAPI_SEC) {
      var timestamp = new Date().getTime().toString();
      var salt      = Utilities.getUuid().replace(/-/g, "").substring(0, 20);
      var raw       = Utilities.computeHmacSha256Signature(
        timestamp + salt, SOLAPI_SEC
      );
      var signature = raw.map(function(b) {
        return ("0" + (b & 0xff).toString(16)).slice(-2);
      }).join("");
      var authHeader = [
        "HMAC-SHA256 apiKey=" + SOLAPI_KEY,
        "date=" + timestamp,
        "salt=" + salt,
        "signature=" + signature
      ].join(", ");

      // 관리자 알림
      if (ADMIN_PHONE) {
        sendSMS(authHeader, ADMIN_PHONE,
          "[레이지데이 북클럽] 인터뷰 신청\n" +
          "이름: " + name + "\n" +
          "연락처: " + phone + "\n" +
          "일시: " + dateStr + " " + timeStr
        );
      }

      // 신청자 확인 문자
      sendSMS(authHeader, phone.replace(/-/g, ""),
        "[레이지데이 북클럽]\n" +
        name + "님, 인터뷰 예약이 완료되었습니다.\n" +
        "일시: " + dateStr + " " + timeStr + "\n" +
        "장소: 링키라운지 (사당)"
      );
    }

    return jsonResponse({ success: true });

  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

// ── 헬퍼 ─────────────────────────────────────────────────────────
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
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
