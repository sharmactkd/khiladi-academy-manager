export const DEFAULT_EXPENSE_CATEGORIES = {
  income: ["Student Fee", "Admission Fee", "Belt Test", "Championship", "Uniform / Equipment", "Sponsorship"],
  expense: ["Rent", "Salary", "Electricity", "Equipment", "Championship", "Marketing", "Travel", "Maintenance", "Food", "Medical", "Subscription", "Movie", "Parking"],
};
export const normalizeCategoryName = (value) => String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
export const cleanCategoryName = (value) => String(value || "").trim().replace(/\s+/g, " ");
export const isDefaultCategory = (type, value) => (DEFAULT_EXPENSE_CATEGORIES[type] || []).some((name) => normalizeCategoryName(name) === normalizeCategoryName(value));
export const parseExpensePagination = (query = {}) => {
  const page = Number.parseInt(query.page, 10), limit = Number.parseInt(query.limit, 10);
  return { page: Number.isFinite(page) ? Math.max(page, 1) : 1, limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 25 };
};
export const buildExpenseListFilter = (academy, query = {}) => {
  const filter = { academy, reversedAt: null };
  if (["income", "expense"].includes(query.type)) filter.type = query.type;
  if (query.from || query.to) {
    filter.date = {};
    if (query.from) filter.date.$gte = new Date(`${query.from}T00:00:00.000Z`);
    if (query.to) filter.date.$lte = new Date(`${query.to}T23:59:59.999Z`);
  }
  return filter;
};
