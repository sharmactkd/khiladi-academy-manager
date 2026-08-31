import { useEffect, useMemo, useState } from "react";
import DateInput from "../common/DateInput.jsx";
import toast from "react-hot-toast";
import {
  CalendarClock,
  History,
  PauseCircle,
  RefreshCcw,
  Save,
  X,
} from "lucide-react";

import { membershipApi } from "../../api/membershipApi.js";
import MembershipBadge from "./MembershipBadge.jsx";
import "../../pages/attendance/Attendance.module.css";

const ACTIONS = [
  { value: "extend_days", label: "Add training days" },
  { value: "reduce_days", label: "Remove training days" },
  { value: "set_due_date", label: "Set custom due date" },
  { value: "set_remaining_days", label: "Set remaining days" },
  { value: "change_unpaid_months", label: "Adjust unpaid months" },
  { value: "pause", label: "Pause membership" },
  { value: "resume", label: "Resume membership" },
  { value: "set_fee_status", label: "Set fee status" },
  { value: "set_note", label: "Update internal note" },
];

const initialForm = {
  type: "extend_days",
  days: 5,
  dueDate: "",
  remainingTrainingDays: 0,
  months: 1,
  resumeDate: new Date().toISOString().slice(0, 10),
  feeStatus: "due",
  reason: "",
  note: "",
  internalNote: "",
};

const unwrap = (response) => response?.data?.data || response?.data || {};

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-GB").replaceAll("/", "-");
};

const formatAction = (item) => {
  const labels = {
    extend_days: `Added ${item.days} days`,
    reduce_days: `Removed ${item.days} days`,
    set_due_date: "Custom due date set",
    set_remaining_days: "Remaining days updated",
    change_unpaid_months: `${item.months > 0 ? "+" : ""}${item.months} unpaid month(s)`,
    pause: "Membership paused",
    resume: "Membership resumed",
    set_fee_status: "Fee status updated",
    set_note: "Internal note updated",
    reversal: "Adjustment reversed",
  };
  return labels[item.type] || item.type;
};

const MembershipAdjustmentDrawer = ({ open, student, onClose, onUpdated }) => {
  const [membership, setMembership] = useState(null);
  const [adjustments, setAdjustments] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const studentName = student?.name || student?.importedName || "Student";
  const latestReversibleId = useMemo(
    () => adjustments.find((item) => item.type !== "reversal" && !item.reversedAt)?._id,
    [adjustments]
  );

  useEffect(() => {
    if (!open || !student?.studentId) return;
    let mounted = true;
    setLoading(true);
    membershipApi
      .getStudentMembership(student.studentId)
      .then((response) => {
        if (!mounted) return;
        const data = unwrap(response);
        setMembership(data.membership || null);
        setAdjustments(Array.isArray(data.adjustments) ? data.adjustments : []);
        setForm({
          ...initialForm,
          internalNote: data.membership?.internalNote || "",
          feeStatus: data.membership?.feeStatus || "due",
          remainingTrainingDays: data.membership?.remainingTrainingDays || 0,
        });
      })
      .catch((error) => toast.error(error?.response?.data?.message || "Membership load nahi hui"))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [open, student?.studentId]);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !saving) onClose?.();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open, saving, onClose]);

  if (!open || !student) return null;

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const buildPayload = () => {
    const payload = {
      type: form.type,
      reason: form.reason,
      note: form.note,
      internalNote: form.internalNote,
      expectedVersion: membership?.version,
    };
    if (["extend_days", "reduce_days"].includes(form.type)) payload.days = Number(form.days);
    if (form.type === "set_due_date") payload.dueDate = form.dueDate;
    if (form.type === "set_remaining_days") payload.remainingTrainingDays = Number(form.remainingTrainingDays);
    if (form.type === "change_unpaid_months") payload.months = Number(form.months);
    if (form.type === "resume") payload.resumeDate = form.resumeDate;
    if (form.type === "set_fee_status") payload.feeStatus = form.feeStatus;
    return payload;
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.reason.trim()) return toast.error("Adjustment reason likhein");
    try {
      setSaving(true);
      const response = await membershipApi.createAdjustment(student.studentId, buildPayload());
      const data = unwrap(response);
      const nextMembership = data.membership;
      setMembership(nextMembership);
      setAdjustments((current) => [data.adjustment, ...current]);
      setForm((current) => ({ ...current, reason: "", note: "", internalNote: nextMembership?.internalNote || "" }));
      onUpdated?.(student.studentId, nextMembership);
      toast.success("Membership adjustment saved");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Adjustment save nahi hua");
    } finally {
      setSaving(false);
    }
  };

  const reverse = async (adjustmentId) => {
    const reason = window.prompt("Reversal reason likhein");
    if (!reason?.trim()) return;
    try {
      setSaving(true);
      const response = await membershipApi.reverseAdjustment(adjustmentId, reason);
      const nextMembership = unwrap(response).membership;
      setMembership(nextMembership);
      onUpdated?.(student.studentId, nextMembership);
      const refreshed = unwrap(await membershipApi.getStudentMembership(student.studentId));
      setAdjustments(refreshed.adjustments || []);
      toast.success("Latest adjustment reversed");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Adjustment reverse nahi hua");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="membership-drawer-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose?.()}>
      <aside className="membership-drawer" role="dialog" aria-modal="true" aria-label={`Membership adjustments for ${studentName}`}>
        <header className="membership-drawer__header">
          <span><CalendarClock /></span>
          <div><small>Membership Control</small><h2>{studentName}</h2><p>Manual adjustments with permanent audit history.</p></div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close membership drawer"><X /></button>
        </header>

        {loading ? <div className="membership-drawer__loading">Loading membership…</div> : (
          <>
            <section className="membership-overview">
              <div><small>Current State</small><MembershipBadge membership={membership} disabled /></div>
              <div><small>Effective Due Date</small><strong>{formatDate(membership?.effectiveDueDate)}</strong></div>
              <div><small>Days Remaining</small><strong>{membership?.remainingTrainingDays || 0}</strong></div>
              <div><small>Unpaid Months</small><strong>{membership?.unpaidMonths || 0}</strong></div>
            </section>

            <form className="membership-form" onSubmit={submit}>
              <div className="membership-form__heading"><span><PauseCircle /></span><div><h3>Apply Manual Adjustment</h3><p>You remain in full control of dates, balances and fee status.</p></div></div>
              <label className="membership-field membership-field--wide"><span>Adjustment Type</span><select value={form.type} onChange={(event) => updateForm("type", event.target.value)}>{ACTIONS.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>

              {["extend_days", "reduce_days"].includes(form.type) && <label className="membership-field"><span>Number of Days</span><input type="number" min="1" max="3650" value={form.days} onChange={(event) => updateForm("days", event.target.value)} required /></label>}
              {form.type === "set_due_date" && <label className="membership-field"><span>Custom Due Date</span><DateInput value={form.dueDate} onChange={(event) => updateForm("dueDate", event.target.value)} required /></label>}
              {form.type === "set_remaining_days" && <label className="membership-field"><span>Remaining Training Days</span><input type="number" min="0" max="3650" value={form.remainingTrainingDays} onChange={(event) => updateForm("remainingTrainingDays", event.target.value)} required /></label>}
              {form.type === "change_unpaid_months" && <label className="membership-field"><span>Month Adjustment</span><input type="number" min="-120" max="120" value={form.months} onChange={(event) => updateForm("months", event.target.value)} required /><small>Use positive to add and negative to reduce.</small></label>}
              {form.type === "resume" && <label className="membership-field"><span>Resume Date</span><DateInput value={form.resumeDate} onChange={(event) => updateForm("resumeDate", event.target.value)} /></label>}
              {form.type === "set_fee_status" && <label className="membership-field"><span>Fee Status</span><select value={form.feeStatus} onChange={(event) => updateForm("feeStatus", event.target.value)}><option value="paid">Paid</option><option value="due">Due</option><option value="partial">Partial</option><option value="overdue">Overdue</option><option value="waived">Waived</option><option value="complimentary">Complimentary</option></select></label>}

              <label className="membership-field membership-field--wide"><span>Reason *</span><input value={form.reason} onChange={(event) => updateForm("reason", event.target.value)} maxLength="300" placeholder="Example: Approved holiday adjustment" required /></label>
              <label className="membership-field membership-field--wide"><span>Internal Note</span><textarea value={form.internalNote} onChange={(event) => updateForm("internalNote", event.target.value)} maxLength="1000" placeholder="Example: 15 days protected; apply when training resumes" /></label>
              <label className="membership-field membership-field--wide"><span>Additional Audit Note</span><input value={form.note} onChange={(event) => updateForm("note", event.target.value)} maxLength="1000" placeholder="Optional details for this adjustment" /></label>
              <button type="submit" className="membership-save" disabled={saving}><Save />{saving ? "Saving…" : "Apply Adjustment"}</button>
            </form>

            <section className="membership-history">
              <div className="membership-history__heading"><span><History /></span><div><h3>Adjustment History</h3><p>Newest activity appears first. Records cannot be deleted.</p></div></div>
              {!adjustments.length ? <p className="membership-history__empty">No manual adjustment added yet.</p> : adjustments.map((item) => (
                <article key={item._id} className={item.reversedAt ? "is-reversed" : ""}>
                  <span><RefreshCcw /></span>
                  <div><strong>{formatAction(item)}</strong><p>{item.reason}</p>{item.note ? <small>{item.note}</small> : null}<time>{new Date(item.createdAt).toLocaleString("en-IN")} · {item.createdBy?.name || "Academy user"}</time></div>
                  {item._id === latestReversibleId && !item.reversedAt ? <button type="button" onClick={() => reverse(item._id)} disabled={saving}>Reverse</button> : null}
                </article>
              ))}
            </section>
          </>
        )}
      </aside>
    </div>
  );
};

export default MembershipAdjustmentDrawer;
