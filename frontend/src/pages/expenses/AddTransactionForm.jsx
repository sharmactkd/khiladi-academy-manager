import { useState } from "react";
import { ArrowDown, ArrowUpRight, Banknote, Plus, Smartphone } from "lucide-react";
import IconOptionGrid from "../../components/common/iconOptions/IconOptionGrid.jsx";
import styles from "./ExpenseManager.module.css";
import { defaultCategoriesFor, normalizeExpenseCategory } from "./expenseCategories.js";

export default function AddTransactionForm({
  form,
  setForm,
  customCategories,
  onAddCustomCategory,
  onRemoveCustomCategory,
  onSubmit,
  onClose,
}) {
  const [addingCustom, setAddingCustom] = useState(false);
  const defaults = defaultCategoriesFor(form.type);
  const categories = [
    ...defaults,
    ...customCategories,
  ];
  const categoryKind =
    form.type === "income" ? "incomeCategory" : "expenseCategory";

  const setType = (type) => {
    setForm((old) => ({
      ...old,
      type,
      category: "",
      customCategory: "",
    }));
  };

  const addCustomCategory = async (event) => {
    event?.preventDefault();
    event?.stopPropagation();

    const value = form.customCategory.trim();
    if (!value || addingCustom) return;
    const existing = categories.find((item) => normalizeExpenseCategory(item) === normalizeExpenseCategory(value));
    if (existing) {
      setForm((old) => ({ ...old, category: existing, customCategory: "" }));
      return;
    }
    try {
      setAddingCustom(true);
      const savedName = await onAddCustomCategory(value);
      if (savedName) setForm((old) => ({ ...old, category: savedName, customCategory: "" }));
    } finally {
      setAddingCustom(false);
    }
  };

  const removeCustomCategory = (item) => {
    onRemoveCustomCategory(item);
    setForm((old) => old.category === item ? { ...old, category: "" } : old);
  };

  const customCategoryField = (
    <div className="expense-custom-category-row">
      <input
        value={form.customCategory}
        onChange={(event) =>
          setForm((old) => ({
            ...old,
            customCategory: event.target.value,
          }))
        }
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            addCustomCategory(event);
          }
        }}
        placeholder="Add custom category"
      />
      {form.customCategory.trim() ? (
        <button
          type="button"
          className="expense-custom-category-add"
          aria-label={`Add custom category ${form.customCategory.trim()}`}
          disabled={addingCustom}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={addCustomCategory}
        >
          <Plus size={14} />
          {addingCustom ? "Adding…" : "Add"}
        </button>
      ) : null}
    </div>
  );

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

          <div className={styles.formField}>
            <span className={styles.fieldLabel}>Mode</span>
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
          </div>

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

          <div className={`${styles.formField} ${styles.full}`}>
            <span className={styles.fieldLabel}>Category</span>
            <div
              className={`${styles.categoryTiles} transaction-category-tiles`}
            >
              <IconOptionGrid
                kind={categoryKind}
                options={categories}
                selected={form.category}
                customOptions={customCategories}
                onToggle={(item) =>
                  setForm((old) => ({
                    ...old,
                    category: old.category === item ? "" : item,
                  }))
                }
                onRemoveCustom={removeCustomCategory}
                trailingContent={customCategoryField}
              />
            </div>
          </div>

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
