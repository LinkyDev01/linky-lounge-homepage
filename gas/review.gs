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

var SHEET_ID    = "1C_dx4uklaAAmvxu9owFshSZZoW6GyPyIXE4SCanU-qU";
var SHEET_NAME  = "1기 후기";
var ADMIN_EMAIL = "linkylounge@gmail.com";

var HEADERS = [
  "제출시각",
  "이름",
  "Q1. 한 문장 표현",
  "Q2. 추천 대상",
  "Q3. 좋았던 점",
  "Q4. 아쉬웠던 점",
  "Q5. 기억에 남는 순간",
  "Q6. 자유 후기",
  "마케팅 동의"
];

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
      data.name     || "익명",
      data.q1       || "",
      data.q2       || "",
      data.q3_good  || "",
      data.q3_bad   || "",
      data.q4       || "",
      data.q5       || "",
      data.marketing || "미동의",
    ];
    sheet.appendRow(row);

    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: "[레이지데이] 1기 후기 새 응답 — " + (data.name || "익명"),
      body: [
        "이름: " + (data.name || "익명"),
        "",
        "Q1. 한 문장 표현:",
        data.q1 || "(미작성)",
        "",
        "Q2. 추천 대상:",
        data.q2 || "(미작성)",
        "",
        "Q3. 좋았던 점:",
        data.q3_good || "(미작성)",
        "",
        "Q4. 아쉬웠던 점:",
        data.q3_bad || "(미작성)",
        "",
        "Q5. 기억에 남는 순간:",
        data.q4 || "(미작성)",
        "",
        "Q6. 자유 후기:",
        data.q5 || "(미작성)",
        "",
        "마케팅 동의: " + (data.marketing || "미동의"),
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

// ── 로컬 테스트용 (GAS 에디터에서 직접 실행) ──────────────────────
function testDoPost() {
  var fakeEvent = {
    postData: {
      contents: JSON.stringify({
        name:      "테스트",
        q1:        "사유가 깊어지는 곳",
        q2:        "혼자 읽기 좋아하는 사람",
        q3_good:   "대화의 밀도가 좋았어요",
        q3_bad:    "시간이 조금 짧았어요",
        q4:        "어떤 문장 하나가 오래 남았어요",
        q5:        "정말 좋았습니다",
        marketing: "동의",
      })
    }
  };
  var result = doPost(fakeEvent);
  Logger.log(result.getContent());
}
