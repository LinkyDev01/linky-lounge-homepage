// ================================================================
// 레이지데이 북클럽 — 1기 후기 수집 Google Apps Script
// ================================================================
// 배포 방법:
//   Google Apps Script (script.google.com) → 새 프로젝트
//   아래 코드 붙여넣기 → 저장
//   배포 → 새 배포 → 유형: 웹 앱
//   실행 계정: 나(linkylounge@gmail.com) / 액세스 권한: 모든 사용자
//   배포 후 URL을 Vercel 환경변수 REVIEW_GAS_URL 에 설정
// ================================================================

var SHEET_ID   = "1yDy7VeJ_XkOYNfv_CXVqXy0S1UOAObgCiL4j22etfko";
var SHEET_NAME = "1기 후기";
var ADMIN_EMAIL = "linkylounge@gmail.com";

var HEADERS = ["제출시각", "이름", "Q1. 기억에 남는 순간", "Q2. 한 문장 표현", "Q3. 추천 대상", "Q4. 자유 후기"];

function getSheet() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight("bold")
      .setBackground("#f5ede4")
      .setFontColor("#1a1208");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = getSheet();

    var row = [
      new Date(),
      data.name || "익명",
      data.q1   || "",
      data.q2   || "",
      data.q3   || "",
      data.q4   || "",
    ];
    sheet.appendRow(row);

    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: "[레이지데이] 1기 후기 새 응답 — " + (data.name || "익명"),
      body: [
        "이름: " + (data.name || "익명"),
        "",
        "Q1. 기억에 남는 순간:",
        data.q1 || "(미작성)",
        "",
        "Q2. 한 문장 표현:",
        data.q2 || "(미작성)",
        "",
        "Q3. 추천 대상:",
        data.q3 || "(미작성)",
        "",
        "Q4. 자유 후기:",
        data.q4 || "(미작성)",
        "",
        "시트 확인: https://docs.google.com/spreadsheets/d/" + SHEET_ID + "/edit"
      ].join("\n")
    });

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
