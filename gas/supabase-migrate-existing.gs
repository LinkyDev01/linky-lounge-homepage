// ================================================================
// 기존 시트 데이터 → Supabase 일괄 이동 스크립트
// 1) SUPABASE_URL, SUPABASE_SERVICE_KEY 를 채운 뒤
// 2) Apps Script 편집기에서 migrateToSupabase() 실행
// ================================================================

var SB_URL = 'https://your-project-id.supabase.co'; // ← 교체
var SB_KEY = 'your-service-role-key-here';           // ← 교체

function sbInsert(table, payload) {
  var url = SB_URL + '/rest/v1/' + table;
  var res = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: {
      'apikey': SB_KEY,
      'Authorization': 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  return res.getResponseCode();
}

function migrateToSupabase() {
  var ss = SpreadsheetApp.openById('1yDy7VeJ_XkOYNfv_CXVqXy0S1UOAObgCiL4j22etfko');

  // ── 신청현황 시트 ──────────────────────────────────────────────
  var applySheet = ss.getSheetByName('신청현황');
  // 헤더: A=제출일시 B=이름 C=성별 D=나이 E=전화번호 F=인터뷰방식 G=한줄인사
  //       H=인스타그램 I=추천인 J=마케팅동의 K=인터뷰일시 L,M=빈칸 N=문자발송 O=인터뷰확인 P=결제
  var applyData = applySheet.getDataRange().getValues();
  var applyOk = 0, applyFail = 0;

  for (var i = 1; i < applyData.length; i++) {
    var row = applyData[i];
    if (!row[1]) continue; // 이름 없으면 빈행 스킵

    var interviewAt = row[10] ? String(row[10]) : '';
    var table = (row[5] === '전화 인터뷰' && interviewAt) ? 'phone_interviews' : 'applications';

    var status;
    if (table === 'phone_interviews') {
      status = sbInsert('phone_interviews', {
        name: String(row[1] || ''),
        phone: String(row[4] || ''),
        interview_at: interviewAt
      });
    } else {
      status = sbInsert('applications', {
        name:              String(row[1] || ''),
        gender:            String(row[2] || ''),
        age:               String(row[3] || ''),
        phone:             String(row[4] || ''),
        job:               String(row[5] || ''),
        instagram:         String(row[7] || ''),
        referral:          String(row[8] || ''),
        marketing_consent: String(row[9] || '')
      });
    }

    if (status === 201) { applyOk++; } else { applyFail++; Logger.log('Row ' + (i+1) + ' 실패 status=' + status); }
    Utilities.sleep(200); // API rate limit 방지
  }

  // ── 서면 인터뷰 시트 ───────────────────────────────────────────
  var writtenSheet = ss.getSheetByName('서면 인터뷰');
  var writtenOk = 0, writtenFail = 0;

  if (writtenSheet) {
    var writtenData = writtenSheet.getDataRange().getValues();
    for (var j = 1; j < writtenData.length; j++) {
      var wr = writtenData[j];
      if (!wr[1]) continue;

      var ws = sbInsert('written_interviews', {
        name:  String(wr[1] || ''),
        phone: String(wr[2] || ''),
        q1:    String(wr[3] || ''),
        q2:    String(wr[4] || ''),
        q3:    String(wr[5] || ''),
        q4:    String(wr[6] || ''),
        q5:    String(wr[7] || ''),
        q6:    String(wr[8] || '')
      });

      if (ws === 201) { writtenOk++; } else { writtenFail++; Logger.log('Written row ' + (j+1) + ' 실패 status=' + ws); }
      Utilities.sleep(200);
    }
  }

  Logger.log('=== 마이그레이션 완료 ===');
  Logger.log('신청현황: ' + applyOk + ' 성공, ' + applyFail + ' 실패');
  Logger.log('서면인터뷰: ' + writtenOk + ' 성공, ' + writtenFail + ' 실패');
}
