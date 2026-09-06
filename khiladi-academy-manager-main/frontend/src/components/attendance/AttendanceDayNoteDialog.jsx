import { useEffect, useState } from "react";

export const DAY_NOTE_OPTIONS = [
  { type: "sick-leave", label: "Sick Leave", hint: "Health or sickness related closure", color: "#e9d5ff" },
  { type: "rainy-day", label: "Rainy Day", hint: "Classes affected by rain or weather", color: "#bae6fd" },
  { type: "championship", label: "Championship", hint: "Academy closed for a championship", color: "#fed7aa" },
  { type: "festival", label: "Festival", hint: "Festival or public celebration", color: "#fef3c7" },
  { type: "other", label: "Other", hint: "Any other holiday or note", color: "#e2e8f0" },
];

const AttendanceDayNoteDialog = ({ dateKey, existingNote, initialType = "other", onSave, onClose }) => {
  const initial = DAY_NOTE_OPTIONS.find((item) => item.type === (existingNote?.type || initialType)) || DAY_NOTE_OPTIONS.at(-1);
  const [type, setType] = useState(initial.type);
  const [title, setTitle] = useState(existingNote?.title || initial.label);
  const [description, setDescription] = useState(existingNote?.description || "");
  const [color, setColor] = useState(existingNote?.color || initial.color);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const option = DAY_NOTE_OPTIONS.find((item) => item.type === type);
    if (!existingNote) {
      setTitle(option?.label || "Other");
      setColor(option?.color || "#e2e8f0");
    }
  }, [type, existingNote]);

  const submit = async (event) => {
    event.preventDefault();
    if (!title.trim()) return;
    try {
      setSaving(true);
      await onSave({ date: dateKey, type, title: title.trim(), description: description.trim(), color });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="attendance-note-modal" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="attendance-note-dialog" onSubmit={submit} role="dialog" aria-modal="true" aria-label="Attendance day note">
        <h3>Mark date / holiday</h3>
        <p className="muted">{dateKey}. Attendance can still be marked on this date.</p>
        <label>Reason<select value={type} onChange={(e) => setType(e.target.value)}>{DAY_NOTE_OPTIONS.map((item) => <option key={item.type} value={item.type}>{item.label} — {item.hint}</option>)}</select></label>
        <label>Title<input value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} required /></label>
        <label>Description<textarea value={description} maxLength={500} rows={4} onChange={(e) => setDescription(e.target.value)} placeholder="Optional details shown on hover" /></label>
        <label>Column colour<div className="attendance-note-color"><input type="color" value={color} onChange={(e) => setColor(e.target.value)} /><input value={color} pattern="#[0-9A-Fa-f]{6}" onChange={(e) => setColor(e.target.value)} /></div></label>
        <div className="attendance-note-dialog__actions"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={saving}>{saving ? "Saving..." : "Save note"}</button></div>
      </form>
    </div>
  );
};

export default AttendanceDayNoteDialog;
