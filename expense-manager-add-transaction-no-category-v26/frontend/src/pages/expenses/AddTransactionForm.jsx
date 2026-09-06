import { ArrowDown, ArrowUpRight, Banknote, Smartphone } from "lucide-react";
import styles from "./ExpenseManager.module.css";

export default function AddTransactionForm({
  form,
  setForm,
  onSubmit,
  onClose,
}) {
  const setType = (type) => {
    setForm((old) => ({
      ...old,
      type,
    }));
  };

  return (
    <section className={styles.formCard}>
      <div className={styles.formHeader}>
        <div>
          <span className={styles.formEyebrow}>NEW TRANSACTION</span>
          <h2>Add transaction</h2>
          <p>Capture academy income or an expense with a clear audit trail.</p>
        </div>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <form onSubmit={onSubmit}>
        <div className={styles.typeToggle}>
          <button
            type="button"
            className={
              form.type === "income" ? styles.selectedIncome : ""
            }
            onClick={() => setType("income")}
          >
            <ArrowDown size={16} />
            Income
          </button>
          <button
            type="button"
            className={
              form.type === "expense" ? styles.selectedExpense : ""
            }
            onClick={() => setType("expense")}
          >
            <ArrowUpRight size={16} />
            Expense
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
              onChange={(event) =>
                setForm((old) => ({
                  ...old,
                  amount: event.target.value,
                }))
              }
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
              onChange={(event) =>
                setForm((old) => ({
                  ...old,
                  description: event.target.value,
                }))
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
              onChange={(event) =>
                setForm((old) => ({
                  ...old,
                  date: event.target.value,
                }))
              }
            />
          </label>
        </div>

        <button className={styles.primary} type="submit">
          Save transaction
        </button>
      </form>
    </section>
  );
}
