import { CalendarDays, RefreshCcw, Search, X } from "lucide-react";
import MartialArtIcon from "../common/iconOptions/MartialArtIcon.jsx";
import styles from "./AttendanceControls.module.css";

export default function AttendanceControls({
  batches, batch, onBatchChange, year, yearOptions, onYearChange,
  month, months, onMonthChange, disabled, repeatDisabled, onRepeat,
  searchQuery = "", onSearchChange,
}) {
  return (
    <section className={styles.panel} aria-label="Attendance batch and period">
      <div className={styles.top}>
        <div className={styles.batches}>
          <span className={styles.label}>Select Batch</span>
          <div className={styles.batchList}>
            {batches.map((item) => (
              <button key={item._id} type="button" aria-pressed={batch === item._id}
                className={`${styles.batch} ${batches.length === 1 ? styles.single : ""} ${batch === item._id ? styles.selected : ""}`}
                onClick={() => onBatchChange(item._id)} disabled={disabled}>
                <span className={styles.sportIcon} aria-hidden="true"><MartialArtIcon sport={item.martialArt} /></span>
                <span className={styles.batchCopy}><strong>{item.batchName}</strong><small>{item.martialArt || "Martial Art"}</small></span>
              </button>
            ))}
          </div>
          {!batches.length && <p className={styles.empty}>No active batches available.</p>}
        </div>
        {onSearchChange && <div className={styles.search}>
          <Search size={18} aria-hidden="true" />
          <input type="search" aria-label="Search attendance students"
            placeholder="Search name, phone or admission…" value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)} />
          {searchQuery && <button type="button" aria-label="Clear student search" onClick={() => onSearchChange("")}><X size={16} /></button>}
        </div>}
        <label className={styles.year}>
          <CalendarDays size={20} aria-hidden="true" />
          <select aria-label="Year" value={year} onChange={(event) => onYearChange(Number(event.target.value))} disabled={disabled}>
            {yearOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <button type="button" className={styles.repeat} onClick={onRepeat} disabled={repeatDisabled}>
          <RefreshCcw size={25} aria-hidden="true" />
          <span><strong>Repeat Previous Day</strong><small>Copy the latest marked attendance</small></span>
        </button>
      </div>
      <div className={styles.monthScroll}>
        <div className={styles.months} style={{ gridTemplateColumns: `repeat(${Math.max(1, months.length)}, minmax(60px, 1fr))` }} aria-label="Select month">
          {months.map((item) => <button key={item.value} type="button" aria-pressed={month === item.value}
            aria-label={`${item.fullLabel || item.label} ${year}`} className={month === item.value ? styles.activeMonth : ""}
            onClick={() => onMonthChange(item.value)} disabled={disabled}>{item.label}</button>)}
        </div>
      </div>
    </section>
  );
}
