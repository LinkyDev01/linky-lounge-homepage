import styles from "../ScheduleSection.module.css"
import pstyles from "./preview.module.css"
import { PREVIEW } from "./preview-config"
import { FadeUp } from "@/components/animation/FadeUp"

const sessions = [
  { label: "1회차", wed: "7/15", thu: "7/16", sun: "7/19" },
  { label: "2회차", wed: "7/29", thu: "7/30", sun: "8/2"  },
  { label: "3회차", wed: "8/12", thu: "8/13", sun: "8/16" },
  { label: "4회차", wed: "8/26", thu: "8/27", sun: "8/30" },
]

/**
 * 개선안: 일정 표에 요일별 잔여석 표기 + '참가 안내' 박스
 * (참가비·포함 내역·결제 시점·환불·정원)를 일정 아래에 통합.
 */
export function ScheduleSectionV2() {
  return (
    <section id="schedule" className={styles.section}>
      <FadeUp>
        <div className={styles.titleRow}>
          <h2 className={styles.sectionTitle}>일정·참가 안내</h2>
          <p className={styles.note}>*회차별 수·목·일 중<br />참여 요일 선택 가능</p>
        </div>
      </FadeUp>

      <FadeUp>
        <div className={styles.scheduleBox}>
          <p className={styles.scheduleBoxHeader}>3기 일정</p>
          <table className={styles.scheduleTable}>
            <thead>
              <tr>
                <th className={styles.schThEmpty} />
                <th className={styles.schThDay}>
                  수요일<br />
                  <span className={styles.schThTime}>19:30–22:30</span>
                </th>
                <th className={styles.schThDay}>
                  목요일<br />
                  <span className={styles.schThTime}>19:30–22:30</span>
                </th>
                <th className={styles.schThDay}>
                  일요일<br />
                  <span className={styles.schThTime}>14:30–17:30</span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className={pstyles.seatRow}>
                <td className={styles.schTdLabel}>잔여석</td>
                {PREVIEW.capacity.map((c) => (
                  <td key={c.day} className={styles.schTdDate}>
                    <span className={`${pstyles.seatChip} ${c.left <= 2 ? pstyles.seatChipLow : ""}`}>
                      {c.left}석 남음
                    </span>
                  </td>
                ))}
              </tr>
              {sessions.map((s) => (
                <tr key={s.label}>
                  <td className={styles.schTdLabel}>{s.label}</td>
                  <td className={styles.schTdDate}>{s.wed}</td>
                  <td className={styles.schTdDate}>{s.thu}</td>
                  <td className={styles.schTdDate}>{s.sun}</td>
                </tr>
              ))}
              <tr>
                <td className={styles.schTdLabel}>5회차</td>
                <td colSpan={3} className={styles.schTdFifth}>
                  9/6 (일)<br />
                  <span className={styles.schThTime}>1부 14:30–17:00 · 2부 17:00–</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p className={styles.scheduleNote}>*회차별 수·목·일 중 참여 요일 선택 가능</p>
        </div>
      </FadeUp>

      <FadeUp>
        <div className={pstyles.joinInfoBox}>
          <p className={pstyles.joinInfoTitle}>참가 안내</p>
          <div className={pstyles.joinInfoGrid}>
            <span className={pstyles.joinInfoKey}>참가비</span>
            <span className={pstyles.joinInfoVal}>
              <s>{PREVIEW.priceWas}</s> <strong>{PREVIEW.priceNow}</strong> · 3기 한정
            </span>
            <span className={pstyles.joinInfoKey}>포함</span>
            <span className={pstyles.joinInfoVal}>공간 운영 · 모임 기획과 진행 · 다과 · 커뮤니티 운영</span>
            <span className={pstyles.joinInfoKey}>결제 시점</span>
            <span className={pstyles.joinInfoVal}>신청 시점엔 결제하지 않아요. 인터뷰 후 합류가 확정되면 안내드려요.</span>
            <span className={pstyles.joinInfoKey}>취소·환불</span>
            <span className={pstyles.joinInfoVal}>합류 확정 전 취소는 부담 없이 가능, 확정 후에는 첫 모임 전까지 전액 환불</span>
            <span className={pstyles.joinInfoKey}>정원</span>
            <span className={pstyles.joinInfoVal}>요일별 소수 정원 (한 자리에서 모두가 말할 수 있는 규모)</span>
          </div>
          <p className={pstyles.joinInfoNote}>
            *환불 문구는 프리뷰용 초안입니다 — 실제 운영 정책에 맞게 확정해주세요.
          </p>
        </div>
      </FadeUp>

      <FadeUp>
        <div className={styles.locationRow}>
          <span className={styles.locationLabel}>장소</span>
          <div className={styles.locationInfo}>
            <span className={styles.locationName}>링키라운지</span>
            <span className={styles.locationSub}>사당역 10번 출구 도보 3분</span>
            <span className={styles.locationNote}>*상황에 따라 장소가 변경될 수 있습니다.</span>
          </div>
        </div>
      </FadeUp>
    </section>
  )
}
