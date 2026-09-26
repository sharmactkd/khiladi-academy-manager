import { useEffect, useMemo, useState } from "react";
import DateInput from "../common/DateInput.jsx";
import toast from "react-hot-toast";
import {
  CalendarClock,
  CalendarDays,
  Check,
  CircleDollarSign,
  Gauge,
  History,
  PauseCircle,
  ReceiptIndianRupee,
  RefreshCcw,
  Save,
  SlidersHorizontal,
  StickyNote,
  TimerReset,
  Trash2,
  X,
} from "lucide-react";

import { membershipApi } from "../../api/membershipApi.js";
import MembershipBadge from "./MembershipBadge.jsx";
import { formatRemainingTrainingTime } from "./remainingDaysDisplay.js";
import "../../pages/attendance/Attendance.css";

const ACTIONS = [
  { value: "extend_days", label: "Add training days", help: "Move the effective due date forward." },
  { value: "reduce_days", label: "Remove training days", help: "Reduce protected or remaining training time." },
  { value: "set_due_date", label: "Set custom due date", help: "Replace the current effective due date." },
  { value: "clear_due_date", label: "Clear due date", help: "Remove the due date without changing fee history." },
  { value: "set_remaining_days", label: "Set remaining days", help: "Set the exact training-day balance." },
  { value: "change_unpaid_months", label: "Set unpaid months & days", help: "Set the exact outstanding fee duration." },
  { value: "pause", label: "Pause membership", help: "Temporarily stop membership progression." },
  { value: "resume", label: "Resume membership", help: "Restart membership from a chosen date." },
  { value: "set_fee_status", label: "Set fee status", help: "Manually assign the current fee state." },
  { value: "clear_fee_status", label: "Clear fee status", help: "Remove Due, Paid or other fee state." },
  { value: "set_note", label: "Update internal note", help: "Save an operational note without changing balance." },
];

const ACTION_GROUPS = [
  { key: "due", label: "Due Date", help: "Set or clear membership due date.", icon: CalendarDays, actions: ["set_due_date", "clear_due_date"] },
  { key: "fee", label: "Fee Status", help: "Set or clear the current fee state.", icon: ReceiptIndianRupee, actions: ["set_fee_status", "clear_fee_status"] },
  { key: "days", label: "Training Days", help: "Add, remove or set days precisely.", icon: TimerReset, actions: ["extend_days", "reduce_days", "set_remaining_days"] },
  { key: "balance", label: "Unpaid Balance", help: "Adjust pending months and days.", icon: CircleDollarSign, actions: ["change_unpaid_months"] },
  { key: "access", label: "Pause / Resume", help: "Temporarily pause or restart access.", icon: PauseCircle, actions: ["pause", "resume"] },
  { key: "note", label: "Internal Note", help: "Update an operational note only.", icon: StickyNote, actions: ["set_note"] },
];

const initialForm = {
  type: "set_due_date",
  days: 5,
  dueDate: "",
  remainingMonths: 0,
  remainingDays: 0,
  months: 0,
  unpaidDays: 0,
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
    clear_due_date: "Due date cleared",
    set_remaining_days: "Remaining days updated",
    change_unpaid_months: `Set ${item.months || 0} month(s), ${item.days || 0} day(s) due`,
    pause: "Membership paused",
    resume: "Membership resumed",
    set_fee_status: "Fee status updated",
    clear_fee_status: "Fee status cleared",
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

  const studentName = student?.name || student?.importedName || [student?.firstName, student?.lastName].filter(Boolean).join(" ") || "Student";
  const selectedAction = ACTIONS.find((action) => action.value === form.type) || ACTIONS[0];
  const selectedGroup = ACTION_GROUPS.find((group) => group.actions.includes(form.type)) || ACTION_GROUPS[0];
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
          remainingMonths: Math.floor(Number(data.membership?.remainingTrainingDays || 0) / 30),
          remainingDays: Number(data.membership?.remainingTrainingDays || 0) % 30,
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
  const selectGroup = (group) => updateForm("type", group.actions[0]);

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
    if (form.type === "set_remaining_days") payload.remainingTrainingDays = (Number(form.remainingMonths) * 30) + Number(form.remainingDays);
    if (form.type === "change_unpaid_months") {
      payload.months = Number(form.months);
      payload.days = Number(form.unpaidDays);
    }
    if (form.type === "resume") payload.resumeDate = form.resumeDate;
    if (form.type === "set_fee_status") payload.feeStatus = form.feeStatus;
    return payload;
  };

  const submit = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      const response = await membershipApi.createAdjustment(student.studentId, buildPayload());
      const data = unwrap(response);
      const nextMembership = data.membership;
      setMembership(nextMembership);
      setAdjustments((current) => [data.adjustment, ...current]);
      setForm((current) => ({ ...current, reason: "", note: "", internalNote: nextMembership?.internalNote || "" }));
      onUpdated?.(student.studentId, nextMembership, form.type);
      toast.success("Membership adjustment saved");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Adjustment save nahi hua");
    } finally {
      setSaving(false);
    }
  };

  const quickClear = async (type) => {
    try {
      setSaving(true);
      const response = await membershipApi.createAdjustment(student.studentId, {
        type,
        reason: type === "clear_due_date" ? "Quick clear due date" : "Quick clear fee status",
        expectedVersion: membership?.version,
      });
      const data = unwrap(response);
      setMembership(data.membership);
      setAdjustments((current) => [data.adjustment, ...current]);
      onUpdated?.(student.studentId, data.membership, type);
      toast.success(type === "clear_due_date" ? "Due date cleared" : "Fee status cleared");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Quick action complete nahi hua");
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
      onUpdated?.(student.studentId, nextMembership, "reversal");
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
              <div className="membership-overview__state"><span><Gauge /></span><div><small>Current State</small><MembershipBadge membership={membership} disabled /></div></div>
              <div><span><CalendarDays /></span><div><small>Effective Due Date</small><strong>{formatDate(membership?.effectiveDueDate)}</strong></div></div>
              <div><span><CalendarClock /></span><div><small>Time Remaining</small><strong>{formatRemainingTrainingTime(membership?.remainingTrainingDays || 0)}<em> left</em></strong></div></div>
              <div><span><CircleDollarSign /></span><div><small>Unpaid Balance</small><strong>{[Number(membership?.unpaidMonths || 0) > 0 ? `${membership.unpaidMonths}M` : "", Number(membership?.unpaidDays || 0) > 0 ? `${membership.unpaidDays}D` : ""].filter(Boolean).join(" ") || "Clear"}</strong></div></div>
            </section>
            <section className="membership-quick-actions" aria-label="Quick membership actions">
              <div><strong>Quick actions</strong><small>Clear a value immediately with one click.</small></div>
              <button type="button" onClick={() => quickClear("clear_fee_status")} disabled={saving || membership?.feeStatusCleared}><Trash2 />Clear Fee Status</button>
              <button type="button" onClick={() => quickClear("clear_due_date")} disabled={saving || membership?.dueDateCleared}><Trash2 />Clear Due Date</button>
            </section>

            <form className="membership-form" onSubmit={submit}>
              <div className="membership-form__heading"><span><SlidersHorizontal /></span><div><h3>What would you like to update?</h3><p>Choose a category, then select the exact adjustment.</p></div><b>{selectedAction.label}</b></div>
              <div className="membership-action-grid" role="tablist" aria-label="Membership adjustment categories">
                {ACTION_GROUPS.map((group) => {
                  const Icon = group.icon;
                  const active = group.key === selectedGroup.key;
                  return <button key={group.key} type="button" role="tab" aria-selected={active} className={active ? "is-active" : ""} onClick={() => selectGroup(group)}><span><Icon /></span><div><strong>{group.label}</strong><small>{group.help}</small></div>{active ? <i><Check /></i> : null}</button>;
                })}
              </div>
              <div className="membership-subactions" aria-label={`${selectedGroup.label} actions`}>
                {selectedGroup.actions.map((value) => {
                  const action = ACTIONS.find((item) => item.value === value);
                  return <button key={value} type="button" className={form.type === value ? "is-active" : ""} onClick={() => updateForm("type", value)}>{action?.label}</button>;
                })}
              </div>
              <div className="membership-action-help"><PauseCircle /><span><strong>{selectedAction.label}</strong><small>{selectedAction.help}</small></span></div>

              {["extend_days", "reduce_days"].includes(form.type) && <label className="membership-field"><span>Number of Days</span><input type="number" min="1" max="3650" value={form.days} onChange={(event) => updateForm("days", event.target.value)} required /></label>}
              {form.type === "set_due_date" && <label className="membership-field"><span>Custom Due Date</span><DateInput value={form.dueDate} onChange={(event) => updateForm("dueDate", event.target.value)} required /></label>}
              {form.type === "set_remaining_days" && <><label className="membership-field"><span>Remaining Months</span><input type="number" min="0" max="120" value={form.remainingMonths} onChange={(event) => updateForm("remainingMonths", event.target.value)} required /><small>1 month is treated as 30 training days.</small></label><label className="membership-field"><span>Remaining Days</span><input type="number" min="0" max="29" value={form.remainingDays} onChange={(event) => updateForm("remainingDays", event.target.value)} required /><small>Total: {formatRemainingTrainingTime((Number(form.remainingMonths) * 30) + Number(form.remainingDays))}</small></label></>}
              {form.type === "change_unpaid_months" && <><label className="membership-field"><span>Unpaid Months</span><input type="number" min="0" max="120" value={form.months} onChange={(event) => updateForm("months", event.target.value)} required /><small>Exact unpaid month balance.</small></label><label className="membership-field"><span>Unpaid Days</span><input type="number" min="0" max="29" value={form.unpaidDays} onChange={(event) => updateForm("unpaidDays", event.target.value)} required /><small>For 10 days due, enter 0 months and 10 days.</small></label></>}
              {form.type === "resume" && <label className="membership-field"><span>Resume Date</span><DateInput value={form.resumeDate} onChange={(event) => updateForm("resumeDate", event.target.value)} /></label>}
              {form.type === "set_fee_status" && <label className="membership-field"><span>Fee Status</span><select value={form.feeStatus === "overdue" ? "due" : form.feeStatus} onChange={(event) => updateForm("feeStatus", event.target.value)}><option value="paid">Paid</option><option value="due">Due</option><option value="partial">Partial</option><option value="waived">Waived</option><option value="complimentary">Complimentary</option></select></label>}

              <label className="membership-field membership-field--wide"><span>Reason (optional)</span><input value={form.reason} onChange={(event) => updateForm("reason", event.target.value)} maxLength="300" placeholder="Example: Approved holiday adjustment" /></label>
              <label className="membership-field membership-field--wide"><span>Internal Note</span><textarea value={form.internalNote} onChange={(event) => updateForm("internalNote", event.target.value)} maxLength="1000" placeholder="Example: 15 days protected; apply when training resumes" /></label>
              <label className="membership-field membership-field--wide"><span>Additional Audit Note</span><input value={form.note} onChange={(event) => updateForm("note", event.target.value)} maxLength="1000" placeholder="Optional details for this adjustment" /></label>
              <button type="submit" className="membership-save" disabled={saving}><Save />{saving ? "Saving…" : "Apply Adjustment"}</button>
            </form>

            <section className="membership-history">
              <div className="membership-history__heading"><span><History /></span><div><h3>Adjustment History</h3><p>Newest activity appears first. Records cannot be deleted.</p></div><b>{adjustments.length} records</b></div>
              {!adjustments.length ? <p className="membership-history__empty">No manual adjustment added yet.</p> : adjustments.map((item) => (
                <article key={item._id} className={item.reversedAt ? "is-reversed" : ""}>
                  <span><RefreshCcw /></span>
                  <div><strong>{formatAction(item)}</strong>{item.reversedAt ? <em>Reversed</em> : null}<p>{item.reason}</p>{item.note ? <small>{item.note}</small> : null}<time>{new Date(item.createdAt).toLocaleString("en-IN")} · {item.createdBy?.name || "Academy user"}</time></div>
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
