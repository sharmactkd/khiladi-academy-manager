import {
  AlertCircle,
  CalendarCheck2,
  CalendarDays,
  Star,
  TrendingUp,
} from "lucide-react";

import styles from "./StudentYearlyAttendanceProfile.module.css";

const STATUS_META = {
  P: { label: "Present", short: "P", tone: "present" },
  A: { label: "Absent", short: "A", tone: "absent" },
  L: { label: "Leave", short: "L", tone: "leave" },
  LT: { label: "Late", short: "LT", tone: "late" },
};

const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);
const toneClass = (prefix, tone) =>
  styles[`${prefix}${tone[0].toUpperCase()}${tone.slice(1)}`];

const getDayInfo = (month, day) =>
  month?.days?.find((item) => Number(item.day) === day) || null;

const getMonthValue = (month, day) => {
  const dayInfo = getDayInfo(month, day);
  return dayInfo ? month?.attendance?.[dayInfo.dateKey] || "" : "";
};

const getFeeTone = (value) => {
  const normalized = String(value || "").toLowerCase();
  if (normalized.includes("paid") && !normalized.includes("unpaid")) return "paid";
  if (normalized.includes("due") || normalized.includes("unpaid")) return "due";
  return "neutral";
};

const createTrendPoints = (months) => {
  const width = 620;
  const height = 132;
  const left = 22;
  const right = 12;
  const top = 12;
  const bottom = 22;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const values = months.map((month) => Number(month.attendancePercentage || 0));

  return {
    width,
    height,
    points: values.map((value, index) => ({
      x: left + (index * chartWidth) / Math.max(values.length - 1, 1),
      y: top + chartHeight - (Math.max(0, Math.min(value, 100)) / 100) * chartHeight,
      value,
      label: months[index]?.label || "",
    })),
  };
};

const AttendanceTrend = ({ months }) => {
  const chart = createTrendPoints(months);
  const polyline = chart.points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <article className={styles.insightCard}>
      <header className={styles.insightHeader}>
        <span><TrendingUp size={18} /></span>
        <div><small>Yearly performance</small><h3>Attendance Trend</h3></div>
      </header>
      <div className={styles.chart} aria-label="Monthly attendance percentage chart">
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img">
          {[25, 50, 75, 100].map((value) => {
            const y = 12 + 98 - (value / 100) * 98;
            return <line key={value} x1="22" x2="608" y1={y} y2={y} className={styles.chartGrid} />;
          })}
          {polyline ? <polyline points={polyline} className={styles.chartLine} /> : null}
          {chart.points.map((point) => (
            <g key={point.label}>
              <circle cx={point.x} cy={point.y} r="3.5" className={styles.chartPoint}>
                <title>{point.label}: {point.value}%</title>
              </circle>
              <text x={point.x} y="127" textAnchor="middle" className={styles.chartLabel}>{point.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </article>
  );
};

const MonthlyInsights = ({ bestMonth, attentionMonth, totals }) => (
  <article className={styles.insightCard}>
    <header className={styles.insightHeader}>
      <span><CalendarCheck2 size={18} /></span>
      <div><small>Actionable overview</small><h3>Monthly Summary</h3></div>
    </header>
    <div className={styles.insightMetrics}>
      <div className={`${styles.insightMetric} ${styles.insightMetricGreen}`}>
        <span><Star size={19} /></span>
        <div><small>Best Month</small><strong>{bestMonth ? `${bestMonth.fullLabel} · ${bestMonth.attendancePercentage}%` : "No data"}</strong></div>
      </div>
      <div className={`${styles.insightMetric} ${styles.insightMetricRed}`}>
        <span><AlertCircle size={19} /></span>
        <div><small>Needs Attention</small><strong>{attentionMonth ? `${attentionMonth.fullLabel} · ${attentionMonth.attendancePercentage}%` : "No data"}</strong></div>
      </div>
      <div className={`${styles.insightMetric} ${styles.insightMetricBlue}`}>
        <span><CalendarDays size={19} /></span>
        <div><small>Total Marked Days</small><strong>{totals.marked}</strong></div>
      </div>
    </div>
    <footer className={styles.summaryFooter}>
      <span><i className={styles.dotPresent} />Present <b>{totals.present}</b></span>
      <span><i className={styles.dotAbsent} />Absent <b>{totals.absent}</b></span>
      <span><i className={styles.dotLeave} />Leave <b>{totals.leave}</b></span>
      <span><i className={styles.dotLate} />Late <b>{totals.late}</b></span>
    </footer>
  </article>
);

const StudentYearlyAttendanceProfile = ({ data, summary }) => {
  const months = Array.isArray(data?.months) ? data.months : [];
  const year = data?.year || new Date().getFullYear();
  const totals = summary || { present: 0, absent: 0, leave: 0, late: 0, marked: 0, rate: 0 };
  const markedMonths = months.filter((month) =>
    Number(month.presentCount || 0) + Number(month.absentCount || 0) +
    Number(month.leaveCount || 0) + Number(month.lateCount || 0) > 0
  );
  const bestMonth = markedMonths.reduce(
    (best, month) => !best || Number(month.attendancePercentage || 0) > Number(best.attendancePercentage || 0) ? month : best,
    null
  );
  const attentionMonth = markedMonths.reduce(
    (lowest, month) => !lowest || Number(month.attendancePercentage || 0) < Number(lowest.attendancePercentage || 0) ? month : lowest,
    null
  );

  if (!months.length) {
    return (
      <section className={styles.emptyState}>
        <CalendarCheck2 size={34} />
        <h2>No attendance data available</h2>
        <p>Attendance records for {year} have not been created yet.</p>
      </section>
    );
  }

  return (
    <>
      <section className={styles.overviewCard} aria-labelledby="yearly-attendance-heading">
        <header className={styles.cardHeader}>
          <div>
            <span className={styles.sectionIcon}><CalendarDays size={20} /></span>
            <div><small>Complete year · {year}</small><h2 id="yearly-attendance-heading">Yearly Attendance Overview</h2><p>Month-by-month training consistency and fee context.</p></div>
          </div>
          <div className={styles.legend} aria-label="Attendance legend">
            {Object.entries(STATUS_META).map(([value, meta]) => (
              <span key={value}><i className={toneClass("cell", meta.tone)}>{meta.short}</i>{meta.label}</span>
            ))}
            <span><i className={styles.cellBlank}>–</i>Not Marked</span>
          </div>
        </header>

        <div className={styles.tableWrap}>
          <table className={styles.yearTable}>
            <colgroup>
              <col className={styles.monthColumn} />
              <col className={styles.feeColumn} />
              {DAYS.map((day) => <col key={day} className={styles.dayColumn} />)}
              <col className={styles.summaryColumn} /><col className={styles.summaryColumn} />
              <col className={styles.summaryColumn} /><col className={styles.summaryColumn} />
              <col className={styles.rateColumn} />
            </colgroup>
            <thead><tr>
              <th className={styles.stickyMonth}>Month</th><th className={styles.stickyFee}>Fee Status</th>
              {DAYS.map((day) => <th key={day}>{String(day).padStart(2, "0")}</th>)}
              <th>Present</th><th>Absent</th><th>Leave</th><th>Late</th><th>%</th>
            </tr></thead>
            <tbody>
              {months.map((month) => {
                const feeStatus = month.importedFeeStatus || "Not added";
                return (
                  <tr key={month.value}>
                    <th className={styles.stickyMonth}>{month.fullLabel}</th>
                    <td className={styles.stickyFee}><span className={`${styles.feeBadge} ${toneClass("fee", getFeeTone(feeStatus))}`}>{feeStatus}</span></td>
                    {DAYS.map((day) => {
                      const dayInfo = getDayInfo(month, day);
                      const value = getMonthValue(month, day);
                      const meta = STATUS_META[value];
                      const classNames = [styles.dayCell, meta ? toneClass("cell", meta.tone) : styles.cellBlank];
                      if (!dayInfo) classNames.push(styles.dayDisabled);
                      else if (dayInfo.isSunday) classNames.push(styles.daySunday);
                      return <td key={day}><span className={classNames.join(" ")} title={dayInfo ? `${dayInfo.dateKey}: ${meta?.label || "Not marked"}` : "Date unavailable"}>{meta?.short || "–"}</span></td>;
                    })}
                    <td className={styles.countPresent}>{month.presentCount || 0}</td>
                    <td className={styles.countAbsent}>{month.absentCount || 0}</td>
                    <td className={styles.countLeave}>{month.leaveCount || 0}</td>
                    <td className={styles.countLate}>{month.lateCount || 0}</td>
                    <td><strong className={styles.rateValue}>{month.attendancePercentage || 0}%</strong></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.insightsGrid}>
        <AttendanceTrend months={months} />
        <MonthlyInsights bestMonth={bestMonth} attentionMonth={attentionMonth} totals={totals} />
      </section>
    </>
  );
};

export default StudentYearlyAttendanceProfile;