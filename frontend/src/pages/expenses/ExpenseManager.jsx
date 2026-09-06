import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  Plus,
  RefreshCw,
  Smartphone,
  WalletCards,
} from "lucide-react";
import toast from "react-hot-toast";
import { expenseApi } from "../../api/expenseApi.js";
import IconOptionGrid from "../../components/common/iconOptions/IconOptionGrid.jsx";
import styles from "./ExpenseManager.module.css";
import "./ExpenseManagerPremium.css";

const incomeCategories = [
  "Student Fee",
  "Admission Fee",
  "Belt Test",
  "Championship",
  "Uniform / Equipment",
  "Sponsorship",
];
const expenseCategories = [
  "Rent",
  "Salary",
  "Electricity",
  "Equipment",
  "Championship",
  "Marketing",
  "Travel",
  "Maintenance",
  "Food",
  "Medical",
  "Subscription",
];
const today = () => new Date().toISOString().slice(0, 10);
const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

export default function ExpenseManager() {
  const [data, setData] = useState({
    transactions: [],
    summary: { income: 0, expense: 0 },
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [form, setForm] = useState({
    type: "expense",
    category: "Rent",
    customCategory: "",
    amount: "",
    date: today(),
    account: "cash",
    description: "",
  });
  const load = async () => {
    try {
      setLoading(true);
      const response = await expenseApi.list(
        filter === "all" ? {} : { type: filter },
      );
      setData(
        response.data?.data || {
          transactions: [],
          summary: { income: 0, expense: 0 },
          balance: 0,
        },
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Expense data load nahi hua",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [filter]);
  const categories =
    form.type === "income" ? incomeCategories : expenseCategories;
  const categoryKind =
    form.type === "income" ? "incomeCategory" : "expenseCategory";
  const setType = (type) =>
    setForm((old) => ({
      ...old,
      type,
      category: type === "income" ? incomeCategories[0] : expenseCategories[0],
    }));
  const submit = async (event) => {
    event.preventDefault();
    try {
      const category = form.customCategory.trim() || form.category;
      if (!category) {
        toast.error("Category required");
        return;
      }
      await expenseApi.create({
        ...form,
        category,
        amount: Number(form.amount),
      });
      toast.success(`${form.type === "income" ? "Income" : "Expense"} added`);
      setForm((old) => ({
        ...old,
        amount: "",
        description: "",
        customCategory: "",
      }));
      setShowForm(false);
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Transaction save nahi hua");
    }
  };
  const transactions = useMemo(
    () => data.transactions || [],
    [data.transactions],
  );
  const customCategoryField = (
    <div className="expense-custom-category-row">
      <input
        value={form.customCategory}
        onChange={(e) => setForm({ ...form, customCategory: e.target.value })}
        placeholder="Add custom category"
      />
      {form.customCategory.trim() ? (
        <button
          type="button"
          onClick={() =>
            setForm((old) => ({
              ...old,
              customCategory: old.customCategory.trim(),
            }))
          }
        >
          <Plus size={14} /> Add
        </button>
      ) : null}
    </div>
  );
  return (
    <main className={`${styles.page} expense-manager-premium`}>
      <header className={styles.hero}>
        <span className={styles.heroIcon}>
          <WalletCards size={25} />
        </span>
        <div>
          <small>ACADEMY OPERATIONS</small>
          <h1>Expense Manager</h1>
          <p>
            Academy income, daily expenses and cash flow in one secure
            workspace.
          </p>
        </div>
        <button className={styles.refresh} onClick={load} title="Refresh">
          <RefreshCw size={17} />
        </button>
      </header>
      <section className={styles.metrics}>
        <article>
          <small>Total Income</small>
          <strong className={styles.income}>
            {money(data.summary?.income)}
          </strong>
          <span>Fees and other earnings</span>
        </article>
        <article>
          <small>Total Expenses</small>
          <strong className={styles.expense}>
            {money(data.summary?.expense)}
          </strong>
          <span>Recorded academy costs</span>
        </article>
        <article>
          <small>Net Balance</small>
          <strong>{money(data.balance)}</strong>
          <span>Income minus expenses</span>
        </article>
      </section>
      <section className={styles.toolbar}>
        <div>
          <h2>Transaction ledger</h2>
          <p>Every manual transaction is audit-friendly and reversible.</p>
        </div>
        <div className={styles.toolbarActions}>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">All transactions</option>
            <option value="income">Income only</option>
            <option value="expense">Expenses only</option>
          </select>
          <button className={styles.primary} onClick={() => setShowForm(true)}>
            <Plus size={17} /> Add transaction
          </button>
        </div>
      </section>
      {showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <div>
              <span className={styles.formEyebrow}>NEW TRANSACTION</span>
              <h2>Add transaction</h2>
              <p>
                Capture academy income or an expense with a clear audit trail.
              </p>
            </div>
            <button
              className={styles.closeButton}
              onClick={() => setShowForm(false)}
            >
              Close
            </button>
          </div>
          <form onSubmit={submit}>
            <div className={styles.typeToggle}>
              <button
                type="button"
                className={form.type === "income" ? styles.selectedIncome : ""}
                onClick={() => setType("income")}
              >
                <ArrowDown size={16} /> Income
              </button>
              <button
                type="button"
                className={
                  form.type === "expense" ? styles.selectedExpense : ""
                }
                onClick={() => setType("expense")}
              >
                <ArrowUpRight size={16} /> Expense
              </button>
            </div>
            <div className={`${styles.formGrid} transaction-form-grid`}>
              <label>
                Amount
                <input
                  required
                  min="1"
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="₹ 0"
                />
              </label>
              <label>
                Mode
                <div className={`${styles.modeTiles} transaction-mode-tiles`}>
                  <button
                    type="button"
                    aria-pressed={form.account === "cash"}
                    className={
                      form.account === "cash" ? styles.modeSelected : ""
                    }
                    onClick={() =>
                      setForm((old) => ({ ...old, account: "cash" }))
                    }
                  >
                    <Banknote size={15} />
                    Cash
                  </button>
                  <button
                    type="button"
                    aria-pressed={form.account === "upi"}
                    className={
                      form.account === "upi" ? styles.modeSelected : ""
                    }
                    onClick={() =>
                      setForm((old) => ({ ...old, account: "upi" }))
                    }
                  >
                    <Smartphone size={15} />
                    Online
                  </button>
                </div>
              </label>
              <label className={styles.full}>
                Description *
                <textarea
                  required
                  maxLength="500"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="What was this transaction for?"
                />
              </label>
              
              <label>
                Date
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>
            </div>

            <label className={styles.full}>
                Category
                <div
                  className={`${styles.categoryTiles} transaction-category-tiles`}
                >
                  <IconOptionGrid
                    kind={categoryKind}
                    options={categories}
                    selected={form.category}
                    onToggle={(item) =>
                      setForm((old) => ({ ...old, category: item }))
                    }
                    trailingContent={customCategoryField}
                  />
                </div>
              </label>
              
            <button className={styles.primary} type="submit">
              Save transaction
            </button>
          </form>
        </div>
      )}
      {selectedTransaction && (
        <aside className={styles.detail}>
          <button onClick={() => setSelectedTransaction(null)}>Close</button>
          <h3>{selectedTransaction.category}</h3>
          <p>{selectedTransaction.description || "No description"}</p>
          <strong>{money(selectedTransaction.amount)}</strong>
        </aside>
      )}
      <section className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Description</th>
                <th>Mode</th>
                <th className={styles.amount}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className={styles.empty}>
                    Loading transactions…
                  </td>
                </tr>
              ) : transactions.length ? (
                transactions.map((row) => (
                  <tr
                    key={row._id}
                    className={
                      selectedTransaction?._id === row._id
                        ? styles.activeRow
                        : ""
                    }
                    tabIndex="0"
                    onClick={() => setSelectedTransaction(row)}
                    onKeyDown={(event) =>
                      event.key === "Enter" && setSelectedTransaction(row)
                    }
                  >
                    <td>
                      <CalendarDays size={14} />
                      {new Date(row.date).toLocaleDateString("en-GB")}
                    </td>
                    <td>
                      <span
                        className={
                          row.type === "income"
                            ? styles.incomePill
                            : styles.expensePill
                        }
                      >
                        {row.type === "income" ? "Income" : "Expense"}
                      </span>
                    </td>
                    <td>
                      <strong>{row.category}</strong>
                    </td>
                    <td>{row.description || "—"}</td>
                    <td>{String(row.account || "cash").toUpperCase()}</td>
                    <td className={styles.amount}>
                      <strong
                        className={
                          row.type === "income" ? styles.income : styles.expense
                        }
                      >
                        {row.type === "income" ? "+" : "−"}
                        {money(row.amount)}
                      </strong>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className={styles.empty}>
                    No transactions yet. Add your first income or expense.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
