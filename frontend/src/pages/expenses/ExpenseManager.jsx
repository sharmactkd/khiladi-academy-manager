import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, RefreshCw, RotateCcw, WalletCards, X } from "lucide-react";
import toast from "react-hot-toast";
import { expenseApi } from "../../api/expenseApi.js";
import { localDateKey } from "../../utils/localCalendarDate.js";
import AddTransactionForm from "./AddTransactionForm.jsx";
import styles from "./ExpenseManager.module.css";
import "./ExpenseManagerPremium.css";

const PAGE_SIZE = 25;
const emptyData = { transactions: [], summary: { income: 0, expense: 0 }, balance: 0, pagination: { page: 1, limit: PAGE_SIZE, total: 0, pages: 1 } };
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

export default function ExpenseManager() {
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [reversalReason, setReversalReason] = useState("");
  const [reversing, setReversing] = useState(false);
  const [customCategories, setCustomCategories] = useState({ income: [], expense: [] });
  const [form, setForm] = useState({ type: "expense", category: "", customCategory: "", amount: "", date: localDateKey(), account: "cash", description: "" });

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

  const load = async (nextPage = page, nextFilter = filter) => {
    try {
      setLoading(true);
      const params = { page: nextPage, limit: PAGE_SIZE };
      if (nextFilter !== "all") params.type = nextFilter;
      const response = await expenseApi.list(params);
      const payload = response.data?.data || emptyData;
      if (nextPage > (payload.pagination?.pages || 1)) {
        setPage(payload.pagination?.pages || 1);
        return;
      }
      setData(payload);
      setSelectedTransaction(null);
      setReversalReason("");
    } catch (error) {
      toast.error(errorMessage(error, "Expense data load nahi hua"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { (async () => { await migrateLocalCategories(); await loadCategories(); })(); }, []);
  useEffect(() => { load(page, filter); }, [page, filter]);

  const changeFilter = (value) => { setFilter(value); setPage(1); setSelectedTransaction(null); };
  const submit = async (event) => {
    event.preventDefault();
    const category = form.category;
    if (!category) return toast.error("Category required");
    try {
      await expenseApi.create({ ...form, category, customCategory: undefined, amount: Number(form.amount) });
      toast.success(`${form.type === "income" ? "Income" : "Expense"} added`);
      setForm((old) => ({ ...old, amount: "", description: "", customCategory: "", category: "", date: localDateKey() }));
      setShowForm(false);
      setPage(1);
      await load(1, filter);
    } catch (error) { toast.error(errorMessage(error, "Transaction save nahi hua")); }
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

  const reverseSelected = async () => {
    const reason = reversalReason.trim();
    if (reason.length < 3) return toast.error("Reversal reason kam se kam 3 characters ka hona chahiye");
    if (!window.confirm("Reverse this transaction? It will stop affecting totals but remain in the audit history.")) return;
    try {
      setReversing(true);
      await expenseApi.reverse(selectedTransaction._id, reason);
      toast.success("Transaction reversed");
      setSelectedTransaction(null);
      setReversalReason("");
      await load(page, filter);
    } catch (error) { toast.error(errorMessage(error, "Transaction reverse nahi hua")); }
    finally { setReversing(false); }
  };

  const transactions = useMemo(() => data.transactions || [], [data.transactions]);
  const incomeTransactions = useMemo(() => transactions.filter((row) => row.type === "income"), [transactions]);
  const expenseTransactions = useMemo(() => transactions.filter((row) => row.type === "expense"), [transactions]);
  const pagination = data.pagination || emptyData.pagination;

  const renderTransactionTable = (rows, emptyMessage) => (
    <div className={styles.tableWrap}><table><thead><tr><th className={styles.amount}>Amount</th><th>Mode</th><th>Description</th><th>Category</th><th>Date</th></tr></thead><tbody>{loading ? <tr><td colSpan="5" className={styles.empty}>Loading transactions…</td></tr> : rows.length ? rows.map((row) => <tr key={row._id} className={selectedTransaction?._id === row._id ? styles.activeRow : ""} tabIndex="0" onClick={() => { setSelectedTransaction(row); setReversalReason(""); }} onKeyDown={(event) => event.key === "Enter" && setSelectedTransaction(row)}><td className={styles.amount}><strong className={row.type === "income" ? styles.income : styles.expense}>{row.type === "income" ? "+" : "−"}{money(row.amount)}</strong></td><td>{String(row.account || "cash").toUpperCase()}</td><td>{row.description || "—"}</td><td><strong>{row.category}</strong></td><td className={styles.dateCell}><CalendarDays size={14}/>{new Date(row.date).toLocaleDateString("en-GB")}</td></tr>) : <tr><td colSpan="5" className={styles.empty}>{emptyMessage}</td></tr>}</tbody></table></div>
  );

  return <main className={`${styles.page} expense-manager-premium`}>
    <header className={styles.hero}><span className={styles.heroIcon}><WalletCards size={25}/></span><div><small>ACADEMY OPERATIONS</small><h1>Expense Manager</h1><p>Academy income, daily expenses and cash flow in one secure workspace.</p></div><button type="button" className={styles.refresh} onClick={() => load(page, filter)} title="Refresh"><RefreshCw size={17}/></button></header>
    <section className={styles.metrics}><article><small>Total Income</small><strong className={styles.income}>{money(data.summary?.income)}</strong><span>All active earnings</span></article><article><small>Total Expenses</small><strong className={styles.expense}>{money(data.summary?.expense)}</strong><span>All active academy costs</span></article><article><small>Net Balance</small><strong>{money(data.balance)}</strong><span>All income minus expenses</span></article></section>
    <section className={styles.toolbar}><div><h2>Transaction ledger</h2><p>Every manual transaction is audit-friendly and reversible.</p></div><div className={styles.toolbarActions}><select value={filter} onChange={(event) => changeFilter(event.target.value)}><option value="all">All transactions</option><option value="income">Income only</option><option value="expense">Expenses only</option></select><button type="button" className={styles.primary} onClick={() => { setForm((old) => ({ ...old, category: "", customCategory: "" })); setShowForm(true); }}><Plus size={17}/> Add transaction</button></div></section>
    {showForm ? <AddTransactionForm form={form} setForm={setForm} customCategories={(customCategories[form.type] || []).map((row) => row.name)} onAddCustomCategory={addCustomCategory} onRemoveCustomCategory={removeCustomCategory} onSubmit={submit} onClose={() => setShowForm(false)}/> : null}
    {selectedTransaction ? <aside className={`${styles.detail} ${styles.transactionDetail}`} role="dialog" aria-label="Transaction details"><button type="button" className={styles.detailClose} onClick={() => setSelectedTransaction(null)} aria-label="Close transaction details"><X size={17}/></button><small>{selectedTransaction.type.toUpperCase()}</small><h3>{selectedTransaction.category}</h3><p>{selectedTransaction.description || "No description"}</p><strong>{money(selectedTransaction.amount)}</strong><label>Reversal reason<textarea maxLength="300" value={reversalReason} onChange={(event) => setReversalReason(event.target.value)} placeholder="Example: Duplicate transaction"/></label><button type="button" className={styles.reverseButton} disabled={reversing || reversalReason.trim().length < 3} onClick={reverseSelected}><RotateCcw size={15}/>{reversing ? "Reversing…" : "Reverse transaction"}</button></aside> : null}
    <section className={styles.transactionColumns}><section className={`${styles.tableCard} ${styles.transactionPanel}`}><header className={styles.transactionPanelHeader}><div><span className={styles.incomePill}>INCOME</span><h2>Income transactions</h2></div><strong className={styles.income}>{incomeTransactions.length}</strong></header>{renderTransactionTable(incomeTransactions, "No income transactions on this page.")}</section><section className={`${styles.tableCard} ${styles.transactionPanel}`}><header className={styles.transactionPanelHeader}><div><span className={styles.expensePill}>EXPENSES</span><h2>Expense transactions</h2></div><strong className={styles.expense}>{expenseTransactions.length}</strong></header>{renderTransactionTable(expenseTransactions, "No expense transactions on this page.")}</section></section>
    {pagination.pages > 1 ? <footer className={styles.pagination}><span>Showing {(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</span><div><button type="button" disabled={pagination.page <= 1 || loading} onClick={() => setPage((value) => value - 1)}>Previous</button><strong>Page {pagination.page} of {pagination.pages}</strong><button type="button" disabled={pagination.page >= pagination.pages || loading} onClick={() => setPage((value) => value + 1)}>Next</button></div></footer> : null}
  </main>;
}
