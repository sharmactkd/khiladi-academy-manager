import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight, Banknote, CalendarDays, CheckCircle2, CircleDollarSign, Download, GraduationCap, Plus, ReceiptText, RefreshCw, TrendingDown, TrendingUp, Users, WalletCards } from "lucide-react";
import { academyApi } from "../../api/academyApi.js";
import { getBranches } from "../../api/branchApi.js";
import { feePaymentApi } from "../../api/feeApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import useAuth from "../../hooks/useAuth.js";
import { formatPaymentMode } from "../../utils/feePaymentModes.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import { formatMoney } from "../../utils/currency.js";
import styles from "./FeesDashboard.module.css";

const MONTHS = Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: new Date(2000, index, 1).toLocaleString("en-US", { month: "long" }) }));
const MIX_META = { cash: { label: "Cash", color: "#e50914" }, online: { label: "Online", color: "#2774d4" }, cash_online: { label: "Cash + Online", color: "#7255c5" } };
const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const joinAddress = (source) => [source?.address, source?.city, source?.state, source?.country].map((item) => String(item || "").trim()).filter(Boolean).join(", ");
const normalizeAcademy = (response) => response?.data?.data?.academy || response?.data?.academy || null;
const normalizeBranches = (response) => { const list = response?.data?.data || response?.data || []; return Array.isArray(list) ? list.filter((item) => item?.isActive !== false) : []; };
const initialData = { totalCollection: 0, thisMonthCollection: 0, previousMonthCollection: 0, collectionChangePercent: 0, collectionRate: 0, activeStudents: 0, totalTransactions: 0, pendingAmount: 0, overdueStudents: 0, summary: { paid: 0, due: 0, partial: 0, overdue: 0 }, monthlyTrend: [], paymentMix: { cash: { amount: 0, transactions: 0 }, online: { amount: 0, transactions: 0 }, cash_online: { amount: 0, transactions: 0 } }, recentPayments: [] };

const FeesDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const now = new Date();
  const [filters, setFilters] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [data, setData] = useState(initialData);
  const [feeStatusList, setFeeStatusList] = useState([]);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [attentionTab, setAttentionTab] = useState("overdue");
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const [dashboardResult, statusResult, academyResult, branchResult] = await Promise.allSettled([feePaymentApi.getDashboard(filters), feePaymentApi.getStudentsStatus(filters), academyApi.getMyAcademy(), getBranches({ status: "active" })]);
      if (dashboardResult.status !== "fulfilled") throw dashboardResult.reason;
      setData({ ...initialData, ...(dashboardResult.value.data?.data || {}) });
      if (statusResult.status === "fulfilled") setFeeStatusList(statusResult.value.data?.data?.students || []);
      if (academyResult.status === "fulfilled") setAcademy(normalizeAcademy(academyResult.value));
      if (branchResult.status === "fulfilled") setBranches(normalizeBranches(branchResult.value));
    } catch (error) { toast.error(error.response?.data?.message || "Fees dashboard load nahi hua"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchDashboard(); }, [filters.month, filters.year]);

  const mainBranch = branches.find((item) => item?.isMainBranch) || branches[0];
  const currency = (value) => formatMoney(value, mainBranch);
  const selectedMonth = MONTHS.find((item) => item.value === Number(filters.month))?.label || "Month";
  const paymentMix = useMemo(() => Object.entries(data.paymentMix || {}).map(([key, item]) => ({ key, name: MIX_META[key]?.label || formatPaymentMode(key), value: Number(item?.amount || 0), transactions: Number(item?.transactions || 0), color: MIX_META[key]?.color || "#8290a3" })), [data.paymentMix]);
  const totalMix = paymentMix.reduce((sum, item) => sum + item.value, 0);
  const attentionStudents = useMemo(() => {
    const nowDate = new Date();
    return feeStatusList.filter((item) => attentionTab === "overdue" ? item.status === "overdue" : ["due", "partial"].includes(item.status)).sort((a, b) => Number(b.pendingAmount || 0) - Number(a.pendingAmount || 0)).slice(0, 5).map((item) => ({ ...item, days: item.dueDate ? Math.max(Math.ceil((nowDate - new Date(item.dueDate)) / 86400000), 0) : 0 }));
  }, [feeStatusList, attentionTab]);

  const exportReport = () => {
    const rows = [["Student", "Admission Number", "Batch", "Payable", "Paid", "Pending", "Due Date", "Status"], ...feeStatusList.map((item) => [item.student?.name || "", item.student?.admissionNumber || "", item.student?.batch?.batchName || "", item.payableAmount || 0, item.paidAmount || 0, item.pendingAmount || 0, formatDate(item.dueDate), item.status || ""])];
    const csv = rows.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `fee-report-${filters.year}-${String(filters.month).padStart(2, "0")}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  const change = Number(data.collectionChangePercent || 0);
  const ChangeIcon = change >= 0 ? TrendingUp : TrendingDown;
  return (
    <div className={`page ${styles.page}`}>
      <AcademyHeroHeader headingId="fees-dashboard-academy" academyName={academy?.academyName || "KHILADI Academy"} ownerName={academy?.ownerName || user?.name || "Academy Owner"} logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""} eyebrow="Financial operations" addressLabel={mainBranch?.branchName || "Main Branch"} address={joinAddress(mainBranch) || joinAddress(academy) || "Complete main branch address not available"} summaryItems={[{ key: "branches", type: "branches", value: branches.length, label: `Active ${branches.length === 1 ? "Branch" : "Branches"}` }, { key: "students", icon: GraduationCap, value: data.activeStudents || 0, label: "Fee Accounts" }]} />
      <nav className={styles.breadcrumb}><Link to="/dashboard">Dashboard</Link><span>/</span><strong>Fees</strong></nav>
      <header className={styles.heading}>
        <div className={styles.title}><span><ReceiptText size={25} /></span><div><small>Financial operations</small><h1>Fee Dashboard</h1><p>Track collections, outstanding dues and payment activity.</p></div></div>
        <div className={styles.actions}><label><CalendarDays size={15} /><select value={`${filters.year}-${filters.month}`} onChange={(event) => { const [year, month] = event.target.value.split("-").map(Number); setFilters({ year, month }); }}>{Array.from({ length: 24 }, (_, index) => { const date = new Date(now.getFullYear(), now.getMonth() - index, 1); const value = `${date.getFullYear()}-${date.getMonth() + 1}`; return <option key={value} value={value}>{MONTHS[date.getMonth()].label} {date.getFullYear()}</option>; })}</select></label><button type="button" onClick={exportReport}><Download size={15} />Export Report</button><Link to="/fees/collect"><Plus size={16} />Collect Fee</Link></div>
      </header>

      {loading ? <div className={styles.loading}><RefreshCw size={25} /><strong>Loading financial overview...</strong></div> : <>
        <section className={styles.kpis}>
          <article><span className={styles.greenIcon}><Banknote size={21} /></span><div><small>Collected This Month</small><strong>{currency(data.thisMonthCollection)}</strong><p className={change >= 0 ? styles.positive : styles.negative}><ChangeIcon size={13} />{Math.abs(change)}% <span>vs previous month</span></p></div></article>
          <article><span className={styles.amberIcon}><Users size={21} /></span><div><small>Outstanding Dues</small><strong>{currency(data.pendingAmount)}</strong><p>{data.summary?.due + data.summary?.partial + data.summary?.overdue || 0} students require attention</p></div></article>
          <article><span className={styles.blueIcon}><CircleDollarSign size={21} /></span><div><small>Collection Rate</small><strong>{Number(data.collectionRate || 0).toFixed(1)}%</strong><div className={styles.progress}><i style={{ width: `${Math.min(Number(data.collectionRate || 0), 100)}%` }} /></div><p>Target: 85%</p></div></article>
          <article><span className={styles.purpleIcon}><WalletCards size={21} /></span><div><small>Total Transactions</small><strong>{data.totalTransactions || 0}</strong><div className={styles.modeCounts}>{paymentMix.map((item) => <span key={item.key}><b>{item.name === "Cash + Online" ? "Split" : item.name}</b><em>{item.transactions}</em></span>)}</div></div></article>
        </section>

        <section className={styles.analyticsGrid}>
          <article className={styles.chartCard}><header><div><h2>Collection Overview</h2><p>Last six fee periods ending {selectedMonth} {filters.year}</p></div><Link to="/analytics?tab=fees">Detailed Analytics<ArrowRight size={14} /></Link></header><div className={styles.chart}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.monthlyTrend || []} margin={{ top: 18, right: 16, left: 6, bottom: 2 }}><defs><linearGradient id="feesArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e50914" stopOpacity={0.2}/><stop offset="100%" stopColor="#e50914" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#e8edf3" strokeDasharray="3 4" vertical={false}/><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#5f7087", fontSize: 12 }}/><YAxis axisLine={false} tickLine={false} tick={{ fill: "#5f7087", fontSize: 11 }} tickFormatter={(value) => value >= 100000 ? `${(value / 100000).toFixed(1)}L` : value >= 1000 ? `${Math.round(value / 1000)}k` : value}/><Tooltip formatter={(value) => [currency(value), "Collection"]} contentStyle={{ borderRadius: 9, border: "1px solid #dce4ed", fontSize: 12 }}/><Area type="monotone" dataKey="amount" stroke="#e50914" strokeWidth={2.5} fill="url(#feesArea)" dot={{ r: 4, fill: "#e50914", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6 }}/></AreaChart></ResponsiveContainer></div></article>
          <article className={styles.mixCard}><header><div><h2>Payment Mix</h2><p>{selectedMonth} collections by mode</p></div></header><div className={styles.mixBody}><div className={styles.donut}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={paymentMix} dataKey="value" nameKey="name" innerRadius={52} outerRadius={76} paddingAngle={2} stroke="none">{paymentMix.map((item) => <Cell key={item.key} fill={item.color}/>)}</Pie><Tooltip formatter={(value) => currency(value)} contentStyle={{ borderRadius: 9, border: "1px solid #dce4ed", fontSize: 12 }}/></PieChart></ResponsiveContainer><div><strong>{currency(totalMix)}</strong><span>Total</span></div></div><ul>{paymentMix.map((item) => <li key={item.key}><i style={{ background: item.color }}/><span><b>{item.name}</b><small>{currency(item.value)} · {totalMix ? Math.round((item.value / totalMix) * 100) : 0}%</small></span></li>)}</ul></div></article>
        </section>

        <section className={styles.activityGrid}>
          <article className={styles.tableCard}><header><div><h2>Recent Payments</h2><p>Latest recorded fee transactions</p></div><Link to="/fees/payments">View all<ArrowRight size={13}/></Link></header>{!data.recentPayments?.length ? <div className={styles.empty}>No payments found for this academy.</div> : <div className={styles.tableWrap}><table><thead><tr><th>Student</th><th>Receipt</th><th>Payment Mode</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>{data.recentPayments.slice(0, 6).map((payment) => <tr key={payment._id} onDoubleClick={() => payment._id && navigate(`/fees/receipt/${payment._id}`)}><td><span className={styles.avatar}>{String(payment.studentName || "S").charAt(0)}</span><div><strong>{payment.studentName || "—"}</strong><small>{payment.admissionNumber || "No admission number"}</small></div></td><td>{payment.receiptNumber || "—"}</td><td><strong>{formatPaymentMode(payment.paymentMode)}</strong>{payment.paymentMode === "cash_online" ? <small>Cash {formatMoney(payment.cashAmount, payment)} + Online {formatMoney(payment.onlineAmount, payment)}</small> : null}</td><td><strong>{formatMoney(payment.amountPaid, payment)}</strong></td><td><span className={`${styles.status} ${styles[`status${String(payment.status || "due")[0].toUpperCase()}${String(payment.status || "due").slice(1)}`]}`}>{payment.status || "due"}</span></td><td>{formatDate(payment.paymentDate)}</td></tr>)}</tbody></table></div>}</article>
          <article className={styles.attentionCard}><header><div><h2>Fee Attention</h2><p>Students requiring follow-up</p></div><div><button className={attentionTab === "overdue" ? styles.activeTab : ""} onClick={() => setAttentionTab("overdue")}>Overdue</button><button className={attentionTab === "due" ? styles.activeTab : ""} onClick={() => setAttentionTab("due")}>Due Soon</button></div></header><div className={styles.attentionList}>{!attentionStudents.length ? <div className={styles.empty}><CheckCircle2 size={20}/>No students in this category.</div> : attentionStudents.map((item) => <div key={item.student?._id}><span className={styles.avatar}>{String(item.student?.name || "S").charAt(0)}</span><p><strong>{item.student?.name || "Student"}</strong><small>{item.student?.batch?.batchName || "No batch"}</small></p><b>{currency(item.pendingAmount)}</b><em>{attentionTab === "overdue" ? `${item.days} days` : String(item.status || "due")}</em><Link to={`/fees/collect?student=${item.student?._id}&month=${filters.month}&year=${filters.year}`}>Collect</Link></div>)}</div><Link className={styles.viewOutstanding} to="/fees/pending"><AlertTriangle size={14}/>View all outstanding fees<ArrowRight size={14}/></Link></article>
        </section>
      </>}
    </div>
  );
};

export default FeesDashboard;
