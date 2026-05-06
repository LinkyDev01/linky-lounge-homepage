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
var SENDER_PHONE = "010-7444-5790";         // 솔라피 발신 번호
var SOLAPI_KEY   = "NCSEQASUIXASGIJW";     // 솔라피 API Key
var SOLAPI_SEC   = "4H6JALTBSXESIPG4IVTTT2FABGSFCKQN"; // 솔라피 API Secret
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

// ── 서면 인터뷰 제출 ──────────────────────────────────────────────
function handleWrittenInterview(data) {
  var name    = data.name    || "";
  var phone   = data.phone   || "";
  var answers = data.answers || {};

  // 관리자 이메일 알림 (전체 답변 포함)
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
      