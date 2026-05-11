// ================================================================
// 레이지데이 북클럽 — linkyincdev@ 통합 Google Apps Script
// ================================================================

const SHEET_ID    = '1yDy7VeJ_XkOYNfv_CXVqXy0S1UOAObgCiL4j22etfko';
const NOTIFY_EMAIL = 'linkylounge@gmail.com';
const CALENDAR_ID  = '8c67d5250aeba2aa08f4c8f8811fc6b965b7c44d57ca968378ae2d90575b8008@group.calendar.google.com';

// ===== Supabase 설정 =====
// Supabase 대시보드 → Settings → API 에서 복사
// ⚠️  service_role key 를 사용해야 RLS를 우회하고 INSERT 가능
const SUPABASE_URL      = 'https://your-project-id.supabase.co'; // 교체 필요
const SUPABASE_SERVICE_KEY = 'your-service-role-key-here';       // 교체 필요

// ===== Solapi 설정 =====
const SOLAPI_API_KEY    = 'NCSEQASUIXASGIJW';
const SOLAPI_API_SECRET = '4H6JALTBSXESIPG4IVTTT2FABGSFCKQN';
const SENDER_PHONE      = '01074445790';
const KAKAO_PFID        = 'KA01PF260214104943015o3o4k9QEnYH';

// 알림톡 템플릿 ID — 솔라피에서 각각 등록 후 교체
const KAKAO_TEMPLATE_APPLY   = 'KA01TP260508044732078Nim5W0a9FgT'; // 신청 완료
const KAKAO_TEMPLATE_PHONE   = 'KA01TP260508044527472ApL7vKEq4ZE';  // 전화 인터뷰 예약 완료 (등록 후 채우기)
const KAKAO_TEMPLATE_WRITTEN = 'KA01TP260508044618959Levf57dcz2q';  // 서면 인터뷰 제출 완료 (등록 후 채우기)

// 관리자 토큰 — Vercel ADMIN_SECRET 환경변수와 동일하게 설정
const ADMIN_TOKEN = 'lazyday-admin-secret-2025'; // Vercel ADMIN_SECRET 환경변수와 동일

// ================================================================
// Supabase REST INSERT 헬퍼
// ================================================================
function insertSupabase(table, payload) {
  try {
    const url = SUPABASE_URL + '/rest/v1/' + table;
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const status = response.getResponseCode();
    if (status !== 201) {
      console.log('Supabase INSERT 실패 [' + table + '] status=' + status + ' body=' + response.getContentText());
    }
    return status === 201;
  } catch (err) {
    console.log('Supabase INSERT 오류 [' + table + ']: ' + err.message);
    return false;
  }
}

// ================================================================
// GET: 캘린더 슬롯 반환 (admin 토큰 시 이벤트 ID 포함)
// ================================================================
function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const isAdmin = params.adminToken === ADMIN_TOKEN;

    const cal = CalendarApp.getCalendarById(CALENDAR_ID);
    const bookedSlots = [];
    if (cal) {
      const now  = new Date();
      const then = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
      cal.getEvents(now, then).forEach(function(ev) {
        const slot = {
          start: ev.getStartTime().toISOString(),
          end:   ev.getEndTime().toISOString(),
        };
        if (isAdmin) {
          slot.id    = ev.getId();
          slot.title = ev.getTitle();
        }
        bookedSlots.push(slot);
      });
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

// ================================================================
// POST: 유형별 분기
// ================================================================
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (data.type === 'phone_interview') return handlePhoneInterviewBooking(data);
    if (data.type === 'written')         return handleWrittenInterview(data);
    if (data.type === 'admin_block')     return handleAdminBlock(data);
    if (data.type === 'admin_delete')    return handleAdminDelete(data);

    // 기본: 신청 폼
    return handleApply(data);

  } catch (error) {
    return ContentService
      .createTextOutput('ERROR: ' + error.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

// ================================================================
// 1) 신청 폼 처리
// ================================================================
function handleApply(data) {
  // 스프레드시트 저장
  const sheet = SpreadsheetApp.openById(SHEET_ID).getSheetByName('신청현황');
  sheet.appendRow([
    new Date(), data.name, data.gender, data.age, data.phone,
    data.job || '', data.instagram || '', data.referral || '', data.marketingConsent || '',
  ]);

  // Supabase DB 저장
  insertSupabase('applications', {
    name:              data.name             || '',
    gender:            data.gender           || '',
    age:               data.age              || '',
    phone:             data.phone            || '',
    job:               data.job              || '',
    instagram:         data.instagram        || '',
    referral:          data.referral         || '',
    marketing_consent: data.marketingConsent || ''
  });

  // 관리자 이메일
  MailApp.sendEmail(NOTIFY_EMAIL, '📩 [독서모임] 새로운 신청이 등록되었습니다', `
새로운 독서모임 신청이 접수되었습니다.

이름: ${data.name || '-'}
성별: ${data.gender || '-'}
나이: ${data.age || '-'}
연락처: ${data.phone || '-'}
인스타그램: ${data.instagram || '-'}
인터뷰 방식: ${data.interviewType || '-'}

📄 스프레드시트:
https://docs.google.com/spreadsheets/d/${SHEET_ID}
  `);

  // 신청자 알림톡 (실패 시 SMS fallback)
  const phone = (data.phone || '').replace(/-/g, '');
  if (phone) {
    const sent = sendKakaoAlimtalk(phone, KAKAO_TEMPLATE_APPLY, {
      '#{이름}': data.name || '',
    });
    if (!sent) sendSMSApply(phone, data.name);
  }

  return ContentService.createTextOutput('OK').setMimeType(ContentService.MimeType.TEXT);
}

// ================================================================
// 2) 전화 인터뷰 예약
// ================================================================
function handlePhoneInterviewBooking(data) {
  const name = data.name, phone = data.phone;
  const start = new Date(data.slotStart), end = new Date(data.slotEnd);
  const dateStr = Utilities.formatDate(start, 'Asia/Seoul', 'M/d (E)');
  const timeStr = Utilities.formatDate(start, 'Asia/Seoul', 'HH:mm');
  const endStr  = Utilities.formatDate(end,   'Asia/Seoul', 'HH:mm');

  // 캘린더 이벤트 생성
  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (cal) {
    cal.createEvent('[인터뷰] ' + name + ' (' + phone + ')', start, end,
      { description: '전화 인터뷰\n이름: ' + name + '\n연락처: ' + phone });
  }

  // 신청현황 시트에 기록
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('신청현황');
  if (sheet) {
    sheet.appendRow([
      new Date(), name, '', '', phone,
      '전화 인터뷰', '', '', '', '',
      dateStr + ' ' + timeStr + ' – ' + endStr  // 비고: 인터뷰 일시
    ]);
  }

  // Supabase DB 저장
  insertSupabase('phone_interviews', {
    name:         name,
    phone:        phone,
    interview_at: dateStr + ' ' + timeStr + ' – ' + endStr
  });

  // 관리자 이메일
  MailApp.sendEmail(NOTIFY_EMAIL,
    '[레이지데이 북클럽] 전화 인터뷰 신청 — ' + name + '님 ' + dateStr + ' ' + timeStr,
    '전화 인터뷰 예약이 접수되었습니다.\n\n이름: ' + name + '\n연락처: ' + phone +
    '\n일시: ' + dateStr + ' ' + timeStr + ' – ' + endStr +
    '\n인터뷰 방식: 전화 인터뷰\n\n구글 캘린더에 자동으로 추가되었습니다.'
  );

  // 신청자 알림톡 (실패 시 SMS fallback)
  const cleanPhone = (phone || '').replace(/-/g, '');
  if (cleanPhone) {
    const sent = sendKakaoAlimtalk(cleanPhone, KAKAO_TEMPLATE_PHONE, {
      '#{이름}': name,
      '#{날짜}': dateStr,
      '#{시간}': timeStr,
    });
    if (!sent) sendSMSPhoneInterview(cleanPhone, name, dateStr, timeStr);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================================================================
// 3) 서면 인터뷰 제출
// ================================================================
function handleWrittenInterview(data) {
  const name = data.name || '', phone = data.phone || '', answers = data.answers || {};

  // 스프레드시트 저장 — "서면 인터뷰" 시트 (없으면 자동 생성)
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName('서면 인터뷰');
  if (!sheet) {
    sheet = ss.insertSheet('서면 인터뷰');
    sheet.appendRow(['제출일시','이름','연락처','Q1','Q2','Q3','Q4','Q5','Q6']);
    sheet.getRange(1,1,1,9).setFontWeight('bold').setBackground('#f5ede4');
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([new Date(), name, phone,
    answers.q1||'', answers.q2||'', answers.q3||'',
    answers.q4||'', answers.q5||'', answers.q6||'']);

  // Supabase DB 저장
  insertSupabase('written_interviews', {
    name:  name,
    phone: phone,
    q1:    answers.q1 || '',
    q2:    answers.q2 || '',
    q3:    answers.q3 || '',
    q4:    answers.q4 || '',
    q5:    answers.q5 || '',
    q6:    answers.q6 || ''
  });

  // 관리자 이메일
  MailApp.sendEmail(NOTIFY_EMAIL, '[레이지데이 북클럽] 서면 인터뷰 — ' + name + '님',
    '서면 인터뷰 답변이 접수되었습니다.\n\n이름: ' + name + '\n연락처: ' + phone + '\n\n' +
    'Q1. ' + (answers.q1||'(미작성)') + '\n\n' +
    'Q2. ' + (answers.q2||'(미작성)') + '\n\n' +
    'Q3. ' + (answers.q3||'(미작성)') + '\n\n' +
    'Q4. ' + (answers.q4||'(미작성)') + '\n\n' +
    'Q5. ' + (answers.q5||'(미작성)') + '\n\n' +
    'Q6. ' + (answers.q6||'(미작성)')
  );

  // 신청자 알림톡 (실패 시 SMS fallback)
  const cleanPhone = (phone || '').replace(/-/g, '');
  if (cleanPhone) {
    const sent = sendKakaoAlimtalk(cleanPhone, KAKAO_TEMPLATE_WRITTEN, {
      '#{이름}': name,
    });
    if (!sent) sendSMSWrittenInterview(cleanPhone, name);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================================================================
// 관리자: 차단 시간 추가
// ================================================================
function handleAdminBlock(data) {
  if (data.adminToken !== ADMIN_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized' })).setMimeType(ContentService.MimeType.JSON);
  }
  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) return ContentService.createTextOutput(JSON.stringify({ success: false, error: '캘린더 없음' })).setMimeType(ContentService.MimeType.JSON);

  const start = new Date(data.start);
  const end   = new Date(data.end);
  const event = cal.createEvent('[BLOCK] ' + (data.title || '차단'), start, end);
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, id: event.getId() }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================================================================
// 관리자: 이벤트 삭제
// ================================================================
function handleAdminDelete(data) {
  if (data.adminToken !== ADMIN_TOKEN) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unauthorized' })).setMimeType(ContentService.MimeType.JSON);
  }
  const cal = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!cal) return ContentService.createTextOutput(JSON.stringify({ success: false, error: '캘린더 없음' })).setMimeType(ContentService.MimeType.JSON);

  const event = cal.getEventById(data.id);
  if (event) event.deleteEvent();
  return ContentService
    .createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ================================================================
// Solapi 공통
// ================================================================
function getSolapiHeaders() {
  const date = new Date().toISOString();
  const salt = Utilities.getUuid();
  const hmac = Utilities.computeHmacSha256Signature(date + salt, SOLAPI_API_SECRET);
  const signature = hmac.map(function(b) {
    return ('0' + (b & 0xFF).toString(16)).slice(-2);
  }).join('');
  return {
    'Authorization': 'HMAC-SHA256 apiKey=' + SOLAPI_API_KEY
      + ', date=' + date + ', salt=' + salt + ', signature=' + signature,
    'Content-Type': 'application/json'
  };
}

// ===== 카카오 알림톡 =====
function sendKakaoAlimtalk(phone, templateId, variables) {
  if (!templateId) return false; // 템플릿 미등록 시 SMS fallback
  try {
    const payload = { message: {
      to: phone, from: SENDER_PHONE,
      kakaoOptions: { pfId: KAKAO_PFID, templateId: templateId, variables: variables }
    }};
    const response = UrlFetchApp.fetch('https://api.solapi.com/messages/v4/send', {
      method: 'post', headers: getSolapiHeaders(),
      payload: JSON.stringify(payload), muteHttpExceptions: true
    });
    const result = JSON.parse(response.getContentText());
    console.log('알림톡 응답: ' + JSON.stringify(result));
    return !result.errorCode;
  } catch (err) {
    console.log('알림톡 발송 실패: ' + err.message);
    return false;
  }
}

// ===== SMS fallback: 신청 완료 =====
function sendSMSApply(phone, name) {
  try {
    UrlFetchApp.fetch('https://api.solapi.com/messages/v4/send', {
      method: 'post', headers: getSolapiHeaders(),
      payload: JSON.stringify({ message: {
        to: phone, from: SENDER_PHONE, type: 'LMS',
        text: name + '님, 안녕하세요! 링키라운지입니다.\n\n신청해주셔서 감사합니다.\n인터뷰 일정 조율을 위해 링키라운지 카카오톡채널을 통해 연락 드릴게요.\n레이지데이 북클럽에서 곧 만나요.'
      }})
    });
  } catch (err) { console.log('SMS(신청) 실패: ' + err.message); }
}

// ===== SMS fallback: 전화 인터뷰 예약 완료 =====
function sendSMSPhoneInterview(phone, name, dateStr, timeStr) {
  try {
    UrlFetchApp.fetch('https://api.solapi.com/messages/v4/send', {
      method: 'post', headers: getSolapiHeaders(),
      payload: JSON.stringify({ message: {
        to: phone, from: SENDER_PHONE, type: 'LMS',
        text: name + '님, 전화 인터뷰 예약이 완료되었습니다.\n\n일시: ' + dateStr + ' ' + timeStr + '\n담당자가 해당 시간에 전화드릴게요.\n\n방식 변경을 원하시면 카카오톡채널로 말씀해주세요.\n레이지데이 북클럽'
      }})
    });
  } catch (err) { console.log('SMS(전화인터뷰) 실패: ' + err.message); }
}

// ===== SMS fallback: 서면 인터뷰 제출 완료 =====
function sendSMSWrittenInterview(phone, name) {
  try {
    UrlFetchApp.fetch('https://api.solapi.com/messages/v4/send', {
      method: 'post', headers: getSolapiHeaders(),
      payload: JSON.stringify({ message: {
        to: phone, from: SENDER_PHONE, type: 'LMS',
        text: name + '님, 서면 인터뷰가 제출되었습니다.\n\n소중한 답변 감사드려요. 검토 후 개별 연락드리겠습니다.\n\n전화 인터뷰로 변경을 원하시면 카카오톡채널로 말씀해주세요.\n레이지데이 북클럽'
      }})
    });
  } catch (err) { console.log('SMS(서면인터뷰) 실패: ' + err.message); }
}

// ================================================================
// 테스트
// ================================================================
function testApply() {
  const testData = { name: '안동민', gender: '남성', age: '31', phone: '010-7444-5790', job: '컨설턴트', instagram: 'im_dm____', interviewType: '전화 인터뷰' };
  doPost({ postData: { contents: JSON.stringify(testData) } });
}

function testPhoneInterview() {
  const start = new Date(); start.setDate(start.getDate() + 1); start.setHours(19, 0, 0, 0);
  const end   = new Date(start.getTime() + 30 * 60 * 1000);
  const testData = { type: 'phone_interview', name: '안동민', phone: '010-7444-5790', slotStart: start.toISOString(), slotEnd: end.toISOString() };
  Logger.log(doPost({ postData: { contents: JSON.stringify(testData) } }).getContent());
}

function testWrittenInterview() {
  const testData = { type: 'written', name: '안동민', phone: '010-7444-5790',
    answers: { q1: '테스트1', q2: '테스트2', q3: '테스트3', q4: '테스트4', q5: '테스트5', q6: '테스트6' }
  };
  Logger.log(doPost({ postData: { contents: JSON.stringify(testData) } }).getContent());
}

function forceAuth() {
  SpreadsheetApp.openById(SHEET_ID);
  CalendarApp.getCalendarById(CALENDAR_ID);
  UrlFetchApp.fetch('https://www.google.com');
  MailApp.getRemainingDailyQuota();
}
