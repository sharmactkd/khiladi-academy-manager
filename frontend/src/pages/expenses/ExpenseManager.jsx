import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Building2, CalendarDays, ChevronLeft, ChevronRight, CircleDollarSign, Fuel, Gamepad2, GraduationCap, Grid2X2, House, Layers3, Pencil, Plus, ReceiptIndianRupee, RefreshCw, Trash2, UserRound, Utensils, WalletCards, X } from "lucide-react";
import toast from "react-hot-toast";
import { expenseApi } from "../../api/expenseApi.js";
import { localDateKey } from "../../utils/localCalendarDate.js";
import AddTransactionForm from "./AddTransactionForm.jsx";
import styles from "./ExpenseManager.module.css";
import "./ExpenseManagerPremium.css";

const PAGE_SIZE = 25;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const today = new Date();
const emptyData = { transactions: [], summary: { income: 0, expense: 0, incomeTransactions: 0, expenseTransactions: 0 }, categoryBreakdown: [], availablePeriods: [], balance: 0, pagination: { page: 1, limit: PAGE_SIZE, total: 0, pages: 1, hasNextPage: false } };
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const errorMessage = (error, fallback) => error.response?.data?.message || fallback;
const blankForm = () => ({ type: "expense", category: "", customCategory: "", amount: "", date: localDateKey(), account: "cash", description: "", branch: null });
const formFromTransaction = (row) => ({ type: row.type, category: row.category, customCategory: "", amount: String(row.amount), date: String(row.date).slice(0, 10), account: row.account || "cash", description: row.description || "", branch: row.branch?._id || row.branch || null });
const categoryIcon = (category) => {
  const value = String(category || "").trim().toLowerCase();
  if (value.includes("food")) return Utensils;
  if (value.includes("petrol") || value.includes("fuel") || value.includes("travel")) return Fuel;
  if (value.includes("rent")) return Building2;
  if (value.includes("championship") || value.includes("game") || value.includes("pele")) return Gamepad2;
  if (value.includes("school") || value.includes("tagore") || value.includes("education")) return GraduationCap;
  if (value.includes("home") || value.includes("mammy") || value.includes("mummy")) return House;
  if (value.includes("papa") || value.includes("bhaiya") || value.includes("salary")) return UserRound;
  return CircleDollarSign;
};

export default function ExpenseManager() {
  const navigate = useNavigate();
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [deletionReason, setDeletionReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [customCategories, setCustomCategories] = useState({ income: [], expense: [] });
  const [form, setForm] = useState(blankForm);
  const loadMoreRef = useRef(null);

  const loadCategories = async () => {
    try {
      const response = await expenseApi.listCategories();
      const rows = response.data?.data?.categories || [];
      setCustomCategories({ income: rows.filter((row) => row.type === "income"), expense: rows.filter((row) => row.type === "expense") });
    } catch (error) {
      toast.error(errorMessage(error, "Custom categories load nahi hui"));
    }
  };

  const migrateLocalCategories = async () => {
    const key = "expense-manager-custom-categories-v1";
    try {
      const saved = JSON.parse(window.localStorage.getItem(key) || "null");
      const tasks = ["income", "expense"].flatMap((type) => (Array.isArray(saved?.[type]) ? saved[type] : []).map((name) => expenseApi.createCategory({ type, name })));
      if (tasks.length) await Promise.allSettled(tasks);
      window.localStorage.removeItem(key);
    } catch {
      // Invalid legacy browser data must never block the server-backed flow.
    }
  };

  const load = async (nextPage = 1, nextFilter = filter, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const lastDay = new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate();
      const monthKey = String(selectedMonth).padStart(2, "0");
      const params = { page: nextPage, limit: PAGE_SIZE, from: `${selectedYear}-${monthKey}-01`, to: `${selectedYear}-${monthKey}-${lastDay}` };
      if (nextFilter !== "all") params.type = nextFilter;
      const response = await expenseApi.list(params);
      const payload = response.data?.data || emptyData;
      setData((current) => append ? { ...payload, transactions: [...(current.transactions || []), ...(payload.transactions || [])] } : payload);
      setPage(nextPage);
      if (!append) {
        setSelectedTransaction(null);
        setDeletionReason("");
      }
    } catch (error) {
      toast.error(errorMessage(error, "Expense data load nahi hua"));
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
    }
  };

  useEffect(() => { (async () => { await migrateLocalCategories(); await loadCategories(); })(); }, []);
  useEffect(() => { load(1, filter, false); }, [filter, selectedMonth, selectedYear]);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !data.pagination?.hasNextPage) return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && !loading && !loadingMore) load(page + 1, filter, true);
    }, { rootMargin: "240px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [data.pagination?.hasNextPage, filter, loading, loadingMore, page, selectedMonth, selectedYear]);

  const changeFilter = (value) => { setFilter(value); setSelectedTransaction(null); };
  const submit = async (event) => {
    event.preventDefault();
    const category = form.category;
    if (!category) return toast.error("Category required");
    try {
      setSaving(true);
      const payload = { ...form, category, customCategory: undefined, amount: Number(form.amount) };
      if (editingId) await expenseApi.update(editingId, payload);
      else await expenseApi.create(payload);
      toast.success(editingId ? "Transaction updated" : `${form.type === "income" ? "Income" : "Expense"} added`);
      setForm(blankForm());
      setEditingId(null);
      setShowForm(false);
      await load(1, filter, false);
    } catch (error) { toast.error(errorMessage(error, "Transaction save nahi hua")); }
    finally { setSaving(false); }
  };

  const addCustomCategory = async (name) => {
    try {
      const response = await expenseApi.createCategory({ type: form.type, name });
      const category = response.data?.data?.category;
      if (category) setCustomCategories((old) => ({ ...old, [form.type]: [...old[form.type], category] }));
      toast.success("Custom category added");
      return category?.name || name;
    } catch (error) { toast.error(errorMessage(error, "Custom category add nahi hui")); return null; }
  };

  const removeCustomCategory = async (name) => {
    const category = customCategories[form.type].find((row) => row.name === name);
    if (!category) return;
    try {
      await expenseApi.deleteCategory(category._id);
      setCustomCategories((old) => ({ ...old, [form.type]: old[form.type].filter((row) => row._id !== category._id) }));
      toast.success("Custom category removed");
    } catch (error) { toast.error(errorMessage(error, "Custom category remove nahi hui")); }
  };

  const beginEdit = () => {
    if (!selectedTransaction || String(selectedTransaction.sourceType || "manual") !== "manual" || selectedTransaction.sourceId) return;
    setForm(formFromTransaction(selectedTransaction));
    setEditingId(selectedTransaction._id);
    setShowForm(true);
    setSelectedTransaction(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteSelected = async () => {
    const reason = deletionReason.trim();
    if (!window.confirm("Delete this transaction? It will be removed from totals, but kept securely in audit history.")) return;
    try {
      setDeleting(true);
      await expenseApi.delete(selectedTransaction._id, reason);
      toast.success("Transaction deleted");
      setSelectedTransaction(null);
      setDeletionReason("");
      await load(1, filter, false);
    } catch (error) { toast.error(errorMessage(error, "Transaction delete nahi hua")); }
    finally { setDeleting(false); }
  };

  const transactions = useMemo(() => data.transactions || [], [data.transactions]);
  const incomeTransactions = useMemo(() => transactions.filter((row) => row.type === "income"), [transactions]);
  const expenseTransactions = useMemo(() => transactions.filter((row) => row.type === "expense"), [transactions]);
  const pagination = data.pagination || emptyData.pagination;
  const categoryBreakdown = data.categoryBreakdown || [];
  const availablePeriods = data.availablePeriods || [];
  const availableYears = useMemo(() => [...new Set(availablePeriods.map((item) => Number(item.year)))].sort((a, b) => a - b), [availablePeriods]);
  const enabledMonthNumbers = useMemo(() => new Set(availablePeriods.filter((item) => Number(item.year) === selectedYear).map((item) => Number(item.month))), [availablePeriods, selectedYear]);
  const highestCategoryAmount = Math.max(...categoryBreakdown.map((row) => Number(row.amount || 0)), 1);
  const periodLabel = `${MONTHS[selectedMonth - 1]} ${selectedYear}`;

  const selectedYearIndex = availableYears.indexOf(selectedYear);
  const canMoveToPreviousYear = selectedYearIndex > 0;
  const canMoveToNextYear = selectedYearIndex >= 0 && selectedYearIndex < availableYears.length - 1;
  useEffect(() => {
    if (!availablePeriods.length || enabledMonthNumbers.has(selectedMonth)) return;
    const latestAvailable = availablePeriods[availablePeriods.length - 1];
    setSelectedYear(Number(latestAvailable.year));
    setSelectedMonth(Number(latestAvailable.month));
  }, [availablePeriods, enabledMonthNumbers, selectedMonth]);
  const moveYear = (amount) => {
    const nextYear = availableYears[selectedYearIndex + amount];
    if (!nextYear) return;
    const monthsInYear = availablePeriods.filter((item) => Number(item.year) === nextYear).map((item) => Number(item.month));
    setSelectedYear(nextYear);
    setSelectedMonth(amount < 0 ? Math.max(...monthsInYear) : Math.min(...monthsInYear));
  };
  const openReceipt = (row) => {
    if (row.sourceType === "fee_payment" && (row.paymentId || row.sourceId)) navigate(`/fees/receipt/${row.paymentId || row.sourceId}`);
  };

  const renderTransactionTable = (rows, emptyMessage) => (
    <div className={styles.tableWrap}><table><thead><tr><th className={styles.amount}>Amount</th><th>Mode</th><th>Description</th><th>Category</th><th>Date</th></tr></thead><tbody>{loading ? <tr><td colSpan="5" className={styles.empty}>Loading transactions…</td></tr> : rows.length ? rows.map((row) => { const linkedFee = row.sourceType === "fee_payment" && (row.paymentId || row.sourceId); return <tr key={row._id} className={`${selectedTransaction?._id === row._id ? styles.activeRow : ""} ${linkedFee ? styles.receiptRow : ""}`} tabIndex="0" title={linkedFee ? "Double-click to open fee receipt" : ""} onDoubleClick={() => openReceipt(row)} onClick={() => { setSelectedTransaction(row); setDeletionReason(""); }} onKeyDown={(event) => { if (event.key === "Enter") linkedFee ? openReceipt(row) : setSelectedTransaction(row); }}><td className={styles.amount}><strong className={row.type === "income" ? styles.income : styles.expense}>{row.type === "income" ? "+" : "−"}{money(row.amount)}</strong></td><td>{String(row.account || "cash").toUpperCase()}</td><td>{linkedFee ? <span className={styles.studentPayment}><strong>{row.studentName || "Student name unavailable"}</strong><small><ReceiptIndianRupee size={12}/>{row.receiptNumber || "Fee receipt"}</small></span> : row.description || "—"}</td><td><strong>{row.category}</strong></td><td className={styles.dateCell}><CalendarDays size={14}/>{new Date(row.date).toLocaleDateString("en-GB")}</td></tr>; }) : <tr><td colSpan="5" className={styles.empty}>{emptyMessage}</td></tr>}</tbody></table></div>
  );

  return <main className={`${styles.page} expense-manager-premium`}>
    <header className={styles.hero}><span className={styles.heroIcon}><WalletCards size={25}/></span><div><small>ACADEMY OPERATIONS</small><h1>Expense Manager</h1><p>Academy income, daily expenses and cash flow in one secure workspace.</p></div><button type="button" className={styles.refresh} onClick={() => load(1, filter, false)} title="Refresh"><RefreshCw size={17}/></button></header>
    <section className={styles.periodPicker}><header><div><small>REPORTING PERIOD</small><h2>{periodLabel}</h2></div><div className={styles.yearPicker}><button type="button" disabled={!canMoveToPreviousYear} onClick={() => moveYear(-1)} aria-label="Previous available year"><ChevronLeft size={16}/></button><strong>{selectedYear}</strong><button type="button" disabled={!canMoveToNextYear} onClick={() => moveYear(1)} aria-label="Next available year"><ChevronRight size={16}/></button></div></header><div className={styles.monthScroll}><div className={styles.monthTabs}>{MONTHS.map((month, index) => { const monthNumber = index + 1; const enabled = enabledMonthNumbers.has(monthNumber); return <button type="button" key={month} disabled={!enabled} className={selectedMonth === monthNumber ? styles.activeMonth : ""} onClick={() => enabled && setSelectedMonth(monthNumber)}>{month}</button>; })}</div></div></section>
    <section className={styles.metrics}><article><small>Total Income</small><strong className={styles.income}>{money(data.summary?.income)}</strong><span>{periodLabel} · {data.summary?.incomeTransactions || 0} transactions</span></article><article><small>Total Expenses</small><strong className={styles.expense}>{money(data.summary?.expense)}</strong><span>{periodLabel} · {data.summary?.expenseTransactions || 0} transactions</span></article><article><small>Net Balance</small><strong>{money(data.balance)}</strong><span>Selected month income minus expenses</span></article></section>
    <section className={styles.categorySection}>
      <header className={styles.categoryHeader}>
        <span className={styles.categoryHeaderIcon}><Layers3 size={21}/></span>
        <div className={styles.categoryHeading}><small>EXPENSE BREAKDOWN</small><h2>Category-wise spending</h2><p>{periodLabel} mein har category ka total kharcha.</p></div>
        <div className={styles.categorySummary}>
          <span><BarChart3 size={20}/></span><div><small>Total expense</small><strong>{money(data.summary?.expense)}</strong></div>
          <i/>
          <span><Grid2X2 size={19}/></span><div><strong>{categoryBreakdown.length}</strong><small>categories</small></div>
        </div>
      </header>
      {categoryBreakdown.length ? <div className={styles.categoryGrid}>{categoryBreakdown.map((row, index) => {
        const Icon = categoryIcon(row.category);
        const percent = Number(data.summary?.expense || 0) > 0 ? (Number(row.amount || 0) / Number(data.summary.expense)) * 100 : 0;
        return <article key={row.category}>
          <span className={`${styles.categoryIcon} ${styles[`categoryTint${index % 5}`]}`}><Icon size={21}/></span>
          <div className={styles.categoryCopy}><strong>{row.category || "Uncategorised"}</strong><span>{row.transactions} transaction{row.transactions === 1 ? "" : "s"}</span></div>
          <b>{money(row.amount)}</b>
          <i className={styles.categoryProgress}><em style={{ width: `${Math.max((Number(row.amount || 0) / highestCategoryAmount) * 100, 2)}%` }}/></i>
          <span className={styles.categoryPercent}>{percent.toFixed(1)}%</span>
        </article>;
      })}</div> : <div className={styles.categoryEmpty}>Is month mein expense transaction nahi hai.</div>}
    </section>
    <section className={styles.toolbar}><div><h2>Transaction ledger</h2><p>Manual records can be corrected or safely deleted without losing the audit trail.</p></div><div className={styles.toolbarActions}><select value={filter} onChange={(event) => changeFilter(event.target.value)}><option value="all">All transactions</option><option value="income">Income only</option><option value="expense">Expenses only</option></select><button type="button" className={styles.primary} onClick={() => { setForm(blankForm()); setEditingId(null); setShowForm(true); }}><Plus size={17}/> Add transaction</button></div></section>
    {showForm ? <AddTransactionForm form={form} setForm={setForm} customCategories={(customCategories[form.type] || []).map((row) => row.name)} onAddCustomCategory={addCustomCategory} onRemoveCustomCategory={removeCustomCategory} onSubmit={submit} mode={editingId ? "edit" : "create"} saving={saving} onClose={() => { setShowForm(false); setEditingId(null); setForm(blankForm()); }}/> : null}
    {selectedTransaction ? <aside className={`${styles.detail} ${styles.transactionDetail}`} role="dialog" aria-label="Transaction details"><button type="button" className={styles.detailClose} onClick={() => setSelectedTransaction(null)} aria-label="Close transaction details"><X size={17}/></button><small>{selectedTransaction.type.toUpperCase()}</small><h3>{selectedTransaction.category}</h3>{selectedTransaction.sourceType === "fee_payment" ? <div className={styles.detailStudent}><strong>{selectedTransaction.studentName || "Student name unavailable"}</strong><span><ReceiptIndianRupee size={13}/>{selectedTransaction.receiptNumber || "Fee receipt"}</span></div> : <p>{selectedTransaction.description || "No description"}</p>}<strong>{money(selectedTransaction.amount)}</strong>{String(selectedTransaction.sourceType || "manual") === "manual" && !selectedTransaction.sourceId ? <><button type="button" className={styles.editButton} onClick={beginEdit}><Pencil size={15}/>Edit record</button><label>Delete reason <span>(optional)</span><textarea maxLength="300" value={deletionReason} onChange={(event) => setDeletionReason(event.target.value)} placeholder="Example: Duplicate entry"/></label><button type="button" className={styles.reverseButton} disabled={deleting} onClick={deleteSelected}><Trash2 size={15}/>{deleting ? "Deleting…" : "Delete record"}</button><p className={styles.auditHint}>Delete karne par totals update honge, lekin audit history safe rahegi.</p></> : <p className={styles.linkedHint}>Ye fee payment se linked income hai. Isko Payment History se update ya reverse karein.</p>}</aside> : null}
    <section className={styles.transactionColumns}><section className={`${styles.tableCard} ${styles.transactionPanel}`}><header className={styles.transactionPanelHeader}><div><span className={styles.incomePill}>INCOME</span><h2>Income transactions</h2></div><strong className={styles.income}>{data.summary?.incomeTransactions || 0}</strong></header>{renderTransactionTable(incomeTransactions, `No income transactions in ${periodLabel}.`)}</section><section className={`${styles.tableCard} ${styles.transactionPanel}`}><header className={styles.transactionPanelHeader}><div><span className={styles.expensePill}>EXPENSES</span><h2>Expense transactions</h2></div><strong className={styles.expense}>{data.summary?.expenseTransactions || 0}</strong></header>{renderTransactionTable(expenseTransactions, `No expense transactions in ${periodLabel}.`)}</section></section>
    <footer ref={loadMoreRef} className={styles.loadMore}><span>Loaded {transactions.length} of {pagination.total} transactions</span>{pagination.hasNextPage ? <button type="button" disabled={loadingMore} onClick={() => load(page + 1, filter, true)}>{loadingMore ? "Loading more…" : "Load more"}</button> : transactions.length ? <strong>All transactions loaded</strong> : null}</footer>
  </main>;
}
