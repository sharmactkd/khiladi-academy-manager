import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, ArrowRight, Banknote, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CircleDollarSign, Download, FileText, FilterX, GraduationCap, Plus, ReceiptText, ReceiptText as ReceiptIndianRupee, RefreshCw, Search, Smartphone, WalletCards } from "lucide-react";
import { academyApi } from "../../api/academyApi.js";
import { getBranches } from "../../api/branchApi.js";
import { feePaymentApi } from "../../api/feeApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import useAuth from "../../hooks/useAuth.js";
import { formatPaymentMode, PAYMENT_MODE_OPTIONS } from "../../utils/feePaymentModes.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import { formatMoney, paymentCurrencySource, scopeCurrencySource } from "../../utils/currency.js";
import styles from "./PaymentHistory.module.css";

const MONTHS = Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: new Date(2000, index, 1).toLocaleString("en-US", { month: "long" }) }));
const PAGE_SIZE = 12;
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const studentName = (student) => [student?.firstName, student?.lastName].filter(Boolean).join(" ").trim() || (student ? "Student name unavailable" : "Student record not linked");
const joinAddress = (source) => [source?.address, source?.city, source?.state, source?.country].map((item) => String(item || "").trim()).filter(Boolean).join(", ");
const normalizeAcademy = (response) => response?.data?.data?.academy || response?.data?.academy || null;
const normalizeBranches = (response) => { const list = response?.data?.data || response?.data || []; return Array.isArray(list) ? list.filter((item) => item?.isActive !== false) : []; };
const defaultFilters = { month: "", year: "", paymentMode: "", status: "" };

const PaymentHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [search, setSearch] = useState("");
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [summary, setSummary] = useState({ collected: 0, balance: 0, paid: 0, split: 0 });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => String(value || "").trim()));
      const [paymentResult, academyResult, branchResult] = await Promise.allSettled([feePaymentApi.getPayments({ ...cleanFilters, search: search.trim() || undefined, page, limit: PAGE_SIZE, paginated: true }), academyApi.getMyAcademy(), getBranches({ status: "active" })]);
      if (paymentResult.status !== "fulfilled") throw paymentResult.reason;
      const paymentPayload = paymentResult.value.data?.data || {};
      setPayments(Array.isArray(paymentPayload.payments) ? paymentPayload.payments : []);
      setPagination(paymentPayload.pagination || { page, total: 0, pages: 1 });
      setSummary(paymentPayload.summary || { collected: 0, balance: 0, paid: 0, split: 0 });
      if (academyResult.status === "fulfilled") setAcademy(normalizeAcademy(academyResult.value));
      if (branchResult.status === "fulfilled") setBranches(normalizeBranches(branchResult.value));
    } catch (error) { toast.error(error.response?.data?.message || "Payments load nahi hue"); }
    finally { setLoading(false); }
  };
  useEffect(() => {
    const timer = window.setTimeout(fetchPayments, search.trim() ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [filters.month, filters.year, filters.paymentMode, filters.status, search, page]);
  useEffect(() => { setPage(1); }, [filters.month, filters.year, filters.paymentMode, filters.status, search]);

  const filteredPayments = payments;
  const pageCount = Math.max(Number(pagination.pages) || 1, 1);
  const visiblePayments = payments;
  const mainBranch = branches.find((item) => item?.isMainBranch) || branches[0];
  const summaryCurrency = scopeCurrencySource(branches) || { currencyCode: "MIX", currencySymbol: "MIX " };
  const currency = (value, source = summaryCurrency) => formatMoney(value, source);
  const hasFilters = Boolean(search.trim() || Object.values(filters).some(Boolean));

  const clearFilters = () => { setFilters(defaultFilters); setSearch(""); setPage(1); };
  const exportPayments = () => {
    const rows = [["Receipt", "Student", "Admission Number", "Fee Period", "Payable", "Paid", "Pending", "Mode", "Cash Amount", "Online Amount", "Payment Date", "Status"], ...filteredPayments.map((payment) => [payment.receiptNumber || "", studentName(payment.student), payment.student?.admissionNumber || "", `${MONTHS[Number(payment.feeMonth) - 1]?.label || payment.feeMonth} ${payment.feeYear}`, payment.finalAmount || 0, payment.amountPaid || 0, payment.pendingAmount || 0, formatPaymentMode(payment.paymentMode), payment.cashAmount || 0, payment.onlineAmount || 0, formatDate(payment.paymentDate), payment.status || ""])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "payment-history.csv"; anchor.click(); URL.revokeObjectURL(url);
  };

  return (
    <div className={`page ${styles.page}`}>
      <AcademyHeroHeader headingId="payment-history-academy" academyName={academy?.academyName || "KHILADI Academy"} ownerName={academy?.ownerName || user?.name || "Academy Owner"} logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""} eyebrow="Payment records" addressLabel={mainBranch?.branchName || "Main Branch"} address={joinAddress(mainBranch) || joinAddress(academy) || "Complete main branch address not available"} summaryItems={[{ key: "branches", type: "branches", value: branches.length, label: `Active ${branches.length === 1 ? "Branch" : "Branches"}` }, { key: "records", icon: ReceiptText, value: pagination.total, label: "Payment Records" }]} />
      <nav className={styles.breadcrumb}><Link to="/dashboard">Dashboard</Link><span>/</span><Link to="/fees">Fees</Link><span>/</span><strong>Payment History</strong></nav>
      <header className={styles.heading}><div><span><ReceiptText size={25} /></span><div><small>Financial ledger</small><h1>Payment History</h1><p>Search, review and export every recorded fee transaction.</p></div></div><div className={styles.headerActions}><Link to="/fees"><ArrowLeft size={16}/>Fee Dashboard</Link><button type="button" onClick={exportPayments} disabled={!filteredPayments.length}><Download size={16}/>Export CSV</button><Link className={styles.primaryAction} to="/fees/collect"><Plus size={16}/>Collect Fee</Link></div></header>

      <section className={styles.summaryGrid}>
        <article><span className={styles.greenIcon}><CircleDollarSign size={20}/></span><div><small>Filtered Collection</small><strong>{currency(summary.collected)}</strong><p>Across {pagination.total} transactions</p></div></article>
        <article><span className={styles.redIcon}><FileText size={20}/></span><div><small>Outstanding Balance</small><strong>{currency(summary.balance)}</strong><p>In current result set</p></div></article>
        <article><span className={styles.blueIcon}><CheckCircle2 size={20}/></span><div><small>Paid Transactions</small><strong>{summary.paid}</strong><p>Completed fee records</p></div></article>
        <article><span className={styles.purpleIcon}><WalletCards size={20}/></span><div><small>Split Payments</small><strong>{summary.split}</strong><p>Cash + Online records</p></div></article>
      </section>

      <section className={styles.filterCard}>
        <header><div><Search size={17}/><span><strong>Find a payment</strong><small>Filter by student, receipt, period, payment mode or status.</small></span></div>{hasFilters ? <button type="button" onClick={clearFilters}><FilterX size={15}/>Clear Filters</button> : null}</header>
        <div className={styles.filters}>
          <label className={styles.searchField}><span>Search</span><div><Search size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Student, admission no. or receipt..."/></div></label>
          <label><span>Month</span><select value={filters.month} onChange={(event) => setFilters((prev) => ({ ...prev, month: event.target.value }))}><option value="">All Months</option>{MONTHS.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}</select></label>
          <label><span>Year</span><input type="number" min="2020" max="2100" value={filters.year} onChange={(event) => setFilters((prev) => ({ ...prev, year: event.target.value }))} placeholder="All Years"/></label>
          <label><span>Payment Mode</span><select value={filters.paymentMode} onChange={(event) => setFilters((prev) => ({ ...prev, paymentMode: event.target.value }))}><option value="">All Modes</option>{PAYMENT_MODE_OPTIONS.map((mode) => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></label>
          <label><span>Status</span><select value={filters.status} onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}><option value="">All Statuses</option><option value="paid">Paid</option><option value="partial">Partial</option><option value="due">Due</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option></select></label>
        </div>
      </section>

      <section className={styles.tableCard}>
        <header><div><h2>Transaction Ledger</h2><p>{pagination.total} payment {pagination.total === 1 ? "record" : "records"} found</p></div><span><CalendarDays size={15}/>Newest first</span></header>
        {loading ? <div className={styles.state}><RefreshCw className={styles.spinner} size={24}/><strong>Loading payments...</strong></div> : !filteredPayments.length ? <div className={styles.state}><ReceiptIndianRupee size={28}/><strong>No payments found</strong><p>Try changing or clearing your current filters.</p>{hasFilters ? <button onClick={clearFilters}>Clear Filters</button> : null}</div> : <div className={styles.tableWrap}><table><thead><tr><th>Student</th><th>Fee Period</th><th>Payment</th><th>Payable</th><th>Paid</th><th>Balance</th><th>Date</th><th>Status</th><th aria-label="Actions"/></tr></thead><tbody>{visiblePayments.map((payment) => { const name = studentName(payment.student); const statusKey = String(payment.status || "due"); const rowCurrency = paymentCurrencySource(payment, mainBranch); return <tr key={payment._id} tabIndex={0} aria-label={`View payment receipt for ${name}`} onClick={(event) => { if (!event.target.closest("a, button")) navigate(`/fees/receipt/${payment._id}`); }} onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === "Enter" || event.key === " ") { event.preventDefault(); navigate(`/fees/receipt/${payment._id}`); } }}><td>{payment.student?._id ? <Link className={styles.studentLink} to={`/students/${payment.student._id}`} title="View student profile"><strong>{name}</strong></Link> : <strong title="The original student record is missing. Restore or verify its link to recover the name.">{name}</strong>}</td><td><strong>{MONTHS[Number(payment.feeMonth) - 1]?.label || payment.feeMonth} {payment.feeYear}</strong></td><td><span className={styles.modeIcon}>{payment.paymentMode === "cash" ? <Banknote size={15}/> : payment.paymentMode === "online" ? <Smartphone size={15}/> : <WalletCards size={15}/>}</span><div><strong>{formatPaymentMode(payment.paymentMode)}</strong>{payment.paymentMode === "cash_online" ? <small>Cash {currency(payment.cashAmount, rowCurrency)} + Online {currency(payment.onlineAmount, rowCurrency)}</small> : null}</div></td><td>{currency(payment.finalAmount, rowCurrency)}</td><td><strong className={styles.paidAmount}>{currency(payment.amountPaid, rowCurrency)}</strong></td><td><strong className={Number(payment.pendingAmount || 0) > 0 ? styles.pendingAmount : ""}>{currency(payment.pendingAmount, rowCurrency)}</strong></td><td>{formatDate(payment.paymentDate)}</td><td><span className={`${styles.status} ${styles[`status${statusKey.charAt(0).toUpperCase()}${statusKey.slice(1)}`]}`}>{statusKey}</span></td><td><Link className={styles.receiptAction} to={`/fees/receipt/${payment._id}`} title="View receipt"><ReceiptIndianRupee size={16}/><ArrowRight size={13}/></Link></td></tr>; })}</tbody></table></div>}
        {!loading && filteredPayments.length ? <footer><span>Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, pagination.total)} of {pagination.total}</span><div><button type="button" onClick={() => setPage((value) => Math.max(value - 1, 1))} disabled={page === 1}><ChevronLeft size={15}/>Previous</button><strong>{page} <span>of {pageCount}</span></strong><button type="button" onClick={() => setPage((value) => Math.min(value + 1, pageCount))} disabled={page === pageCount}>Next<ChevronRight size={15}/></button></div></footer> : null}
      </section>
    </div>
  );
};

export default PaymentHistory;
