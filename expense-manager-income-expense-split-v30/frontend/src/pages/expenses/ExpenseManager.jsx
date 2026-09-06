import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Plus, RefreshCw, WalletCards } from "lucide-react";
import toast from "react-hot-toast";
import { expenseApi } from "../../api/expenseApi.js";
import AddTransactionForm from "./AddTransactionForm.jsx";
import styles from "./ExpenseManager.module.css";
import "./ExpenseManagerPremium.css";

const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function ExpenseManager() {
  const [data, setData] = useState({ transactions: [], summary: { income: 0, expense: 0 }, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [form, setForm] = useState({ type: "expense", category: "", customCategory: "", amount: "", date: today(), account: "cash", description: "" });
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = window.localStorage.getItem(
        "expense-manager-custom-categories-v1",
      );
      const parsed = saved ? JSON.parse(saved) : null;
      return {
        income: Array.isArray(parsed?.income) ? parsed.income : [],
        expense: Array.isArray(parsed?.expense) ? parsed.expense : [],
      };
    } catch {
      return { income: [], expense: [] };
    }
  });
  useEffect(() => {
    window.localStorage.setItem(
      "expense-manager-custom-categories-v1",
      JSON.stringify(customCategories),
    );
  }, [customCategories]);
  const load = async () => { try { setLoading(true); const response = await expenseApi.list(filter === "all" ? {} : { type: filter }); setData(response.data?.data || { transactions: [], summary: { income: 0, expense: 0 }, balance: 0 }); } catch (error) { toast.error(error.response?.data?.message || "Expense data load nahi hua"); } finally { setLoading(false); } };
  useEffect(() => { load(); }, [filter]);
  const submit = async (event) => { event.preventDefault(); try { const category = form.customCategory.trim() || form.category; if (!category) { toast.error("Category required"); return; } await expenseApi.create({ ...form, category, amount: Number(form.amount) }); toast.success(`${form.type === "income" ? "Income" : "Expense"} added`); setForm((old) => ({ ...old, amount: "", description: "", customCategory: "", category: "" })); setShowForm(false); load(); } catch (error) { toast.error(error.response?.data?.message || "Transaction save nahi hua"); } };
  const transactions = useMemo(() => data.transactions || [], [data.transactions]);
  const incomeTransactions = useMemo(() => transactions.filter((row) => row.type === "income"), [transactions]);
  const expenseTransactions = useMemo(() => transactions.filter((row) => row.type === "expense"), [transactions]);
  const renderTransactionTable = (rows, emptyMessage) => (
    <div className={styles.tableWrap}><table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Mode</th><th className={styles.amount}>Amount</th></tr></thead><tbody>{loading ? <tr><td colSpan="5" className={styles.empty}>Loading transactions…</td></tr> : rows.length ? rows.map((row) => <tr key={row._id} className={selectedTransaction?._id === row._id ? styles.activeRow : ""} tabIndex="0" onClick={() => setSelectedTransaction(row)} onKeyDown={(event) => event.key === "Enter" && setSelectedTransaction(row)}><td><CalendarDays size={14} />{new Date(row.date).toLocaleDateString("en-GB")}</td><td><strong>{row.category}</strong></td><td>{row.description || "—"}</td><td>{String(row.account || "cash").toUpperCase()}</td><td className={styles.amount}><strong className={row.type === "income" ? styles.income : styles.expense}>{row.type === "income" ? "+" : "−"}{money(row.amount)}</strong></td></tr>) : <tr><td colSpan="5" className={styles.empty}>{emptyMessage}</td></tr>}</tbody></table></div>
  );
  return <main className={`${styles.page} expense-manager-premium`}>
    <header className={styles.hero}><span className={styles.heroIcon}><WalletCards size={25} /></span><div><small>ACADEMY OPERATIONS</small><h1>Expense Manager</h1><p>Academy income, daily expenses and cash flow in one secure workspace.</p></div><button className={styles.refresh} onClick={load} title="Refresh"><RefreshCw size={17} /></button></header>
    <section className={styles.metrics}><article><small>Total Income</small><strong className={styles.income}>{money(data.summary?.income)}</strong><span>Fees and other earnings</span></article><article><small>Total Expenses</small><strong className={styles.expense}>{money(data.summary?.expense)}</strong><span>Recorded academy costs</span></article><article><small>Net Balance</small><strong>{money(data.balance)}</strong><span>Income minus expenses</span></article></section>
    <section className={styles.toolbar}><div><h2>Transaction ledger</h2><p>Every manual transaction is audit-friendly and reversible.</p></div><div className={styles.toolbarActions}><select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All transactions</option><option value="income">Income only</option><option value="expense">Expenses only</option></select><button className={styles.primary} onClick={() => { setForm((old) => ({ ...old, category: "", customCategory: "" })); setShowForm(true); }}><Plus size={17} /> Add transaction</button></div></section>
    {
      showForm && (
        <AddTransactionForm
          form={form}
          setForm={setForm}
          customCategories={customCategories[form.type] || []}
          setCustomCategories={(update) =>
            setCustomCategories((old) => ({
              ...old,
              [form.type]:
                typeof update === "function"
                  ? update(old[form.type] || [])
                  : update,
            }))
          }
          onSubmit={submit}
          onClose={() => setShowForm(false)}
        />
      )
    }
    {selectedTransaction && <aside className={styles.detail}><button onClick={() => setSelectedTransaction(null)}>Close</button><h3>{selectedTransaction.category}</h3><p>{selectedTransaction.description || "No description"}</p><strong>{money(selectedTransaction.amount)}</strong></aside>}
    <section className={styles.transactionColumns}>
      <section className={`${styles.tableCard} ${styles.transactionPanel}`}><header className={styles.transactionPanelHeader}><div><span className={styles.incomePill}>INCOME</span><h2>Income transactions</h2></div><strong className={styles.income}>{incomeTransactions.length}</strong></header>{renderTransactionTable(incomeTransactions, "No income transactions yet.")}</section>
      <section className={`${styles.tableCard} ${styles.transactionPanel}`}><header className={styles.transactionPanelHeader}><div><span className={styles.expensePill}>EXPENSES</span><h2>Expense transactions</h2></div><strong className={styles.expense}>{expenseTransactions.length}</strong></header>{renderTransactionTable(expenseTransactions, "No expense transactions yet.")}</section>
    </section>
  </main>;
}
