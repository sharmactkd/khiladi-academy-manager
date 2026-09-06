import { Link } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  Dumbbell,
  Pencil,
  Power,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";

import {
  formatBatchLabel,
  formatBatchTime,
  formatGenderGroup,
  normalizeList,
} from "../batch.utils.js";
import "./BatchCard.module.css";

const DAY_LABELS = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const firstValue = (...values) => {
  for (const value of values) {
    const list = normalizeList(value);
    if (list.length) return list[0];
    if (value !== null && value !== undefined && String(value).trim()) {
      return String(value).trim();
    }
  }
  return "-";
};

const getScheduleDays = (schedule = []) => {
  const values = Array.isArray(schedule) ? schedule : [];
  return [...new Set(values.map((item) => String(item?.day || "").toLowerCase()).filter(Boolean))];
};

const BatchCard = ({ batch, onOpen, onToggleStatus, onDelete }) => {
  const isActive = batch?.isActive !== false;
  const type = formatBatchLabel(firstValue(batch?.batchType, batch?.batchTypes));
  const level = formatBatchLabel(firstValue(batch?.skillLevel, batch?.skillLevels));
  const martialArt = firstValue(batch?.martialArt, batch?.martialArts);
  const schedule = Array.isArray(batch?.schedule) ? batch.schedule : [];
  const scheduleDays = getScheduleDays(schedule);
  const firstSchedule = schedule[0] || {};
  const studentCount = Array.isArray(batch?.students) ? batch.students.length : Number(batch?.studentCount || 0);
  const capacity = Number(batch?.capacity || batch?.maxStudents || 0);
  const coach = batch?.headCoachName || batch?.coach?.name || "Not assigned";

  const openCard = () => onOpen?.(batch);
  const handleKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openCard();
    }
  };

  return (
    <article
      className="batch-list-card"
      tabIndex={0}
      role="link"
      aria-label={`View ${batch?.batchName || "batch"} details`}
      onClick={openCard}
      onKeyDown={handleKeyDown}
    >
      <header className="batch-list-card__header">
        <span className="batch-list-card__icon" aria-hidden="true"><Dumbbell size={27} /></span>
        <div className="batch-list-card__identity">
          <small>Training batch</small>
          <h2>{batch?.batchName || "Unnamed Batch"}</h2>
          <p>{type} training batch <i /> {martialArt}</p>
        </div>
        <div className="batch-list-card__badges" aria-label="Batch identity and status">
          <code>{batch?.batchCode || "No code"}</code>
          {batch?.isCompetitionBatch ? <b>Competition</b> : null}
          <span className={isActive ? "is-active" : "is-inactive"}>{isActive ? "Active" : "Inactive"}</span>
        </div>
      </header>

      <div className="batch-list-card__body">
        <section className="batch-list-card__section batch-list-card__profile">
          <small className="batch-list-card__eyebrow">Training profile</small>
          <dl>
            <div><dt>Type</dt><dd>{type}</dd></div>
            <div><dt>Level</dt><dd>{level}</dd></div>
            <div><dt>Martial Art</dt><dd>{martialArt}</dd></div>
            <div><dt>Gender</dt><dd>{formatGenderGroup(batch?.genderGroup)}</dd></div>
          </dl>
        </section>

        <section className="batch-list-card__section batch-list-card__schedule">
          <small className="batch-list-card__eyebrow"><CalendarDays size={15} /> Schedule</small>
          <div className="batch-list-card__days">
            {scheduleDays.length ? scheduleDays.map((day) => <span key={day}>{DAY_LABELS[day] || formatBatchLabel(day)}</span>) : <em>No days set</em>}
          </div>
          <strong className="batch-list-card__time"><Clock3 size={17} />{formatBatchTime(firstSchedule.startTime)} – {formatBatchTime(firstSchedule.endTime)}</strong>
        </section>

        <section className="batch-list-card__section batch-list-card__capacity">
          <small className="batch-list-card__eyebrow">Capacity &amp; coach</small>
          <div><span><UsersRound size={16} /></span><p><small>Students</small><strong>{studentCount} / {capacity}</strong></p></div>
          <div><span><UserRound size={16} /></span><p><small>Coach</small><strong>{coach}</strong></p></div>
        </section>

        <div className="batch-list-card__actions" onClick={(event) => event.stopPropagation()}>
          <Link className="batch-list-card__action batch-list-card__action--edit" to={`/batches/${batch._id}/edit`}><Pencil size={15} /> Edit</Link>
          <button type="button" className={`batch-list-card__action batch-list-card__action--status ${isActive ? "is-active" : "is-inactive"}`} onClick={() => onToggleStatus?.(batch)}><Power size={15} />{isActive ? "Deactivate" : "Activate"}</button>
          <button type="button" className="batch-list-card__delete" onClick={() => onDelete?.(batch)} aria-label={`Delete ${batch?.batchName || "batch"}`} title="Delete Batch"><Trash2 size={17} /></button>
        </div>
      </div>
    </article>
  );
};

export default BatchCard;