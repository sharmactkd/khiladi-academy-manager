export const INCOME_CATEGORIES = ["Student Fee", "Admission Fee", "Belt Test", "Championship", "Uniform / Equipment", "Sponsorship"];
export const EXPENSE_CATEGORIES = ["Rent", "Salary", "Electricity", "Equipment", "Championship", "Marketing", "Travel", "Maintenance", "Food", "Medical", "Subscription", "Movie", "Parking"];
export const normalizeExpenseCategory = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
export const defaultCategoriesFor = (type) => type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
