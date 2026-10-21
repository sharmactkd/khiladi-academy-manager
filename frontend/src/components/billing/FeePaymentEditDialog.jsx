import { useState } from "react";
import { Save, X } from "lucide-react";
import toast from "react-hot-toast";
import DateInput from "../common/DateInput.jsx";
import { feePaymentApi } from "../../api/feeApi.js";
import { PAYMENT_MODE_OPTIONS } from "../../utils/feePaymentModes.js";
import styles from "../../pages/fees/PaymentHistory.module.css";

const dateOnly = value => value ? new Date(value).toISOString().slice(0, 10) : "";

export default function FeePaymentEditDialog({ payment, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(() => ({
    amount: payment.amount || 0, discount: payment.discount || 0,
    amountPaid: payment.amountPaid || 0,
    paymentMode: ["cash", "online", "cash_online"].includes(payment.paymentMode) ? payment.paymentMode : "online",
    cashAmount: payment.cashAmount || 0, onlineAmount: payment.onlineAmount || 0,
    paymentDate: dateOnly(payment.paymentDate), dueDate: dateOnly(payment.dueDate),
    notes: payment.notes || payment.note || "",
  }));
  const change = (field, value) => setForm(current => ({ ...current, [field]: value }));
  const split = form.paymentMode === "cash_online";
  const paid = split ? Number(form.cashAmount) + Number(form.onlineAmount) : Number(form.amountPaid);
  const payable = Math.max(0, Number(form.amount) - Number(form.discount));
  const submit = async event => {
    event.preventDefault();
    if (saving) return;
    if (Number(form.discount) > Number(form.amount)) return toast.error("Discount cannot exceed the fee amount");
    if (split && (!Number(form.cashAmount) || !Number(form.onlineAmount))) return toast.error("Enter both cash and online amounts");
    setSaving(true);
    try {
      await feePaymentApi.update(payment._id, {
        ...form, amount: Number(form.amount), discount: Number(form.discount), amountPaid: paid,
        cashAmount: split ? Number(form.cashAmount) : form.paymentMode === "cash" ? paid : 0,
        onlineAmount: split ? Number(form.onlineAmount) : form.paymentMode === "online" ? paid : 0,
        expectedUpdatedAt: payment.updatedAt,
      });
      toast.success("Fee payment corrected");
      onSaved();
    } catch (error) {
      toast.error(error.response?.data?.message || "Fee correction failed");
    } finally { setSaving(false); }
  };
  return <div className={styles.modalBackdrop} onMouseDown={event => event.target === event.currentTarget && !saving && onClose()}>
    <form className={`${styles.dateModal} ${styles.feeEditModal}`} onSubmit={submit} role="dialog" aria-modal="true" aria-label="Edit fee payment">
      <header><div><small>Payment correction</small><h2>Edit Fee Payment</h2><p>{payment.student?.firstName} {payment.student?.lastName} · {payment.receiptNumber}</p><p>Month: {payment.feeMonth}/{payment.feeYear}. Edit totals for this month only.</p></div><button type="button" disabled={saving} onClick={onClose} aria-label="Close"><X size={18}/></button></header>
      <div className={styles.feeEditGrid}>
        {[["amount", "Fee Amount"], ["discount", "Discount"]].map(([field, label]) => <label key={field}><span>{label}</span><input type="number" step="0.01" min="0" required value={form[field]} onChange={event => change(field, event.target.value)}/></label>)}
        <label><span>Payment Mode</span><select value={form.paymentMode} onChange={event => change("paymentMode", event.target.value)}>{PAYMENT_MODE_OPTIONS.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
        {!split ? <label><span>Total Paid for This Month</span><input type="number" step="0.01" min="0" required value={form.amountPaid} onChange={event => change("amountPaid", event.target.value)}/></label> : [["cashAmount", "Cash Amount"], ["onlineAmount", "Online Amount"]].map(([field, label]) => <label key={field}><span>{label}</span><input type="number" step="0.01" min="0.01" required value={form[field]} onChange={event => change(field, event.target.value)}/></label>)}
        <label><span>Payment Date</span><DateInput value={form.paymentDate} onChange={event => change("paymentDate", event.target.value)} required/></label>
        <label><span>Due Date</span><DateInput value={form.dueDate} onChange={event => change("dueDate", event.target.value)}/></label>
      </div>
      <label><span>Notes / Correction Reason (optional)</span><textarea rows="2" maxLength="1000" value={form.notes} onChange={event => change("notes", event.target.value)}/></label>
      <p>Payable: {payable.toFixed(2)} · Paid: {paid.toFixed(2)} · Balance: {Math.max(0, payable - paid).toFixed(2)}</p>
      <p>Previous values are retained in correction history. Income and membership update with this payment.</p>
      <footer><button type="button" disabled={saving} onClick={onClose}>Cancel</button><button type="submit" disabled={saving}><Save size={16}/>{saving ? "Saving…" : "Save Changes"}</button></footer>
    </form>
  </div>;
}
