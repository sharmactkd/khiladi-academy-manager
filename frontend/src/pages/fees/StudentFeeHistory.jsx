import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, Banknote, CalendarDays, CheckCircle2, CircleDollarSign, Download, Pencil, Plus, ReceiptText, RefreshCw, Search, Wallet } from "lucide-react";
import { feePaymentApi } from "../../api/feeApi.js";
import { formatPaymentMode } from "../../utils/feePaymentModes.js";
import { getStudentPhotoUrl } from "../../utils/fileUrl.js";
import { formatMoney, paymentCurrencySource } from "../../utils/currency.js";
import FeePaymentEditDialog from "../../components/billing/FeePaymentEditDialog.jsx";
import styles from "./StudentFeeHistory.module.css";

const date = value => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("en-GB").replaceAll("/", "-");
};
const period = payment => new Date(Number(payment.feeYear), Number(payment.feeMonth) - 1, 1).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
const money = (value, source) => formatMoney(Number(value || 0), source);
const PAGE_SIZE = 15;

export default function StudentFeeHistory() {
  const { studentId } = useParams();
  const request = useRef(0);
  const [data, setData] = useState({ student: null, currentStatus: null, payments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const fetchHistory = useCallback(async () => {
    const id = ++request.current;
    setLoading(true); setError("");
    try {
      const result = await feePaymentApi.getStudentHistory(studentId);
      if (id !== request.current) return;
      const payload = result.data?.data;
      if (!payload?.student) throw new Error("Student fee history is unavailable");
      setData(payload);
    } catch (failure) {
      if (id === request.current) setError(failure.response?.data?.message || failure.message || "Fee history could not load");
    } finally { if (id === request.current) setLoading(false); }
  }, [studentId]);
  useEffect(() => {
    setData({ student: null, currentStatus: null, payments: [] });
    setQuery(""); setYear(""); setStatus(""); setPage(1); setPhotoFailed(false); setEditing(null);
    fetchHistory();
    return () => { request.current += 1; };
  }, [fetchHistory]);
  useEffect(() => { setPage(1); }, [query, year, status]);
  const student = data.student;
  const name = [student?.firstName, student?.lastName].filter(Boolean).join(" ") || "Student";
  const source = student?.branch || {};
  const payments = Array.isArray(data.payments) ? data.payments : [];
  const active = payments.filter(payment => payment.status !== "cancelled");
  const totalPaid = active.reduce((sum, payment) => sum + Number(payment.amountPaid || 0), 0);
  const current = data.currentStatus || {};
  const years = [...new Set(payments.map(payment => String(payment.feeYear)))].sort().reverse();
  const filtered = useMemo(() => payments.filter(payment => {
    const text = [payment.receiptNumber, period(payment), formatPaymentMode(payment.paymentMode)].join(" ").toLowerCase();
    return (!query.trim() || text.includes(query.trim().toLowerCase())) && (!year || String(payment.feeYear) === year) && (!status || payment.status === status);
  }), [payments, query, year, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const exportCSV = () => {
    const rows = [["Receipt", "Fee period", "Fee amount", "Discount", "Payable", "Paid", "Pending", "Mode", "Date", "Status"],
      ...filtered.map(payment => [payment.receiptNumber, period(payment), payment.amount, payment.discount, payment.finalAmount, payment.amountPaid, payment.pendingAmount, formatPaymentMode(payment.paymentMode), date(payment.paymentDate), payment.status])];
    const csv = rows.map(row => row.map(value => {
      const text = String(value ?? "");
      return '"' + (/^[=+@\-\t\r]/.test(text) ? "'" : "") + text.replaceAll('"', '""') + '"';
    }).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "student-fee-history.csv"; anchor.click(); URL.revokeObjectURL(url);
  };
  return <div className={styles.page}>
    <nav className={styles.breadcrumb}><Link to="/fees"><ArrowLeft size={15}/>Fees</Link><span>/</span><span>Student fee history</span></nav>
    <section className={styles.hero}>
      <div className={styles.identity}>
        {!photoFailed && student ? <img src={getStudentPhotoUrl(student)} alt={name} onError={() => setPhotoFailed(true)}/> : <span className={styles.avatar}>{name.split(" ").slice(0, 2).map(word => word[0]).join("")}</span>}
        <div><small>STUDENT FINANCE</small><h1>{loading && !student ? "Loading student…" : name}</h1><p>{student?.admissionNumber || "Admission number unavailable"}<span>·</span>{student?.batch?.batchName || "Batch not assigned"}</p></div>
      </div>
      <div className={styles.actions}><Link to={`/students/${studentId}`}>Student Profile<ArrowUpRight size={15}/></Link><Link className={styles.primary} to={`/fees/collect?student=${studentId}`}><Plus size={16}/>Collect Fee</Link></div>
      <div className={styles.heroMeta}><span><CalendarDays size={15}/>Payment history & receipts</span><span>{student?.phone || "Phone not added"}</span><span>{student?.branch?.branchName || "Academy account"}</span></div>
    </section>
    {error ? <section className={styles.empty} role="alert"><h2>Could not load fee history</h2><p>{error}</p><button onClick={fetchHistory}>Try again</button></section> : <>
      <div className={styles.metrics}>
        {[[Wallet, "Total collected", money(totalPaid, source), "All recorded periods"], [CircleDollarSign, "Current month payable", money(current.payableAmount, source), "After discounts"], [Banknote, "Current month paid", money(current.paidAmount, source), "Recorded payments"], [CheckCircle2, "Current month balance", money(current.pendingAmount, source), current.status || "Not available"]].map(([Icon, label, value, hint]) =>
          <article key={label}><span className={styles.metricIcon}><Icon size={19}/></span><small>{label}</small><strong>{loading ? "…" : value}</strong><p>{hint}</p></article>)}
      </div>
      <section className={styles.ledger}>
        <header><div><small>FINANCIAL RECORDS</small><h2>Payment History <span>{payments.length}</span></h2><p>Monthly fees, discounts, payments and receipts in one place.</p></div><div className={styles.actions}><button onClick={fetchHistory} disabled={loading} aria-label="Refresh fee history"><RefreshCw size={16}/></button><button onClick={exportCSV} disabled={!filtered.length || loading}><Download size={15}/>Export</button></div></header>
        <div className={styles.filters}><label className={styles.search}><Search size={16}/><input aria-label="Search fee payments" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search receipt, period or payment mode"/></label><select aria-label="Fee year" value={year} onChange={event => setYear(event.target.value)}><option value="">All years</option>{years.map(item => <option key={item}>{item}</option>)}</select><select aria-label="Payment status" value={status} onChange={event => setStatus(event.target.value)}><option value="">All statuses</option><option value="paid">Paid</option><option value="partial">Partial</option><option value="due">Due</option></select></div>
        {loading ? <div className={styles.empty} role="status"><RefreshCw size={24}/><p>Loading fee records…</p></div> : !filtered.length ? <div className={styles.empty}><ReceiptText size={30}/><h3>{payments.length ? "No matching payments" : "No payments recorded yet"}</h3><p>{payments.length ? "Try a different search or filter." : "Collect the first fee to start this student's payment history."}</p></div> :
          <div className={styles.tableWrap}><table><thead><tr><th>Period / Receipt</th><th>Fee / Discount</th><th>Paid</th><th>Balance</th><th>Mode / Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>{visible.map(payment => {
            const currency = paymentCurrencySource(payment, source);
            return <tr key={payment._id}><td data-label="Period"><strong>{period(payment)}</strong><small>{payment.receiptNumber || "No receipt number"}</small></td><td data-label="Fee / Discount"><strong>{money(payment.amount, currency)}</strong><small>Discount {money(payment.discount, currency)}</small></td><td data-label="Paid"><strong className={styles.paid}>{money(payment.amountPaid, currency)}</strong><small>Payable {money(payment.finalAmount, currency)}</small></td><td data-label="Balance"><strong className={Number(payment.pendingAmount) > 0 ? styles.due : ""}>{money(payment.pendingAmount, currency)}</strong></td><td data-label="Mode / Date"><strong>{formatPaymentMode(payment.paymentMode)}</strong><small>{date(payment.paymentDate)}</small></td><td data-label="Status"><span className={`${styles.badge} ${payment.status === "paid" ? styles.badgePaid : styles.badgeDue}`}>{payment.status || "due"}</span></td><td data-label="Actions"><div className={styles.actions}>{payment.status !== "cancelled" && <button onClick={() => setEditing(payment)} aria-label={`Edit ${period(payment)} payment`}><Pencil size={15}/></button>}<Link to={`/fees/receipt/${payment._id}`}>Receipt<ArrowUpRight size={14}/></Link></div></td></tr>;
          })}</tbody></table></div>}
        {!loading && filtered.length > 0 && <footer><span>{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} records</span><div className={styles.actions}><button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>Previous</button><span>{safePage} / {pages}</span><button disabled={safePage >= pages} onClick={() => setPage(safePage + 1)}>Next</button></div></footer>}
      </section>
    </>}
    {editing && <FeePaymentEditDialog payment={{ ...editing, student }} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); fetchHistory(); }}/>}
  </div>;
}
