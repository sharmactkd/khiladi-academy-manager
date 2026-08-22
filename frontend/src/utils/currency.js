import { Country } from "country-state-city";

const PREFERRED_COUNTRY = { EUR: "EU", USD: "US", GBP: "GB", INR: "IN", AED: "AE", SAR: "SA", CAD: "CA", AUD: "AU", JPY: "JP", CNY: "CN" };

export const currencySymbol = (code = "INR") => {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: code, currencyDisplay: "narrowSymbol" })
      .formatToParts(0).find((part) => part.type === "currency")?.value || code;
  } catch { return code; }
};

export const currencyName = (code = "INR") => {
  try { return new Intl.DisplayNames(["en"], { type: "currency" }).of(code) || code; }
  catch { return code; }
};

export const currencyOptions = (() => {
  const map = new Map();
  Country.getAllCountries().forEach((country) => {
    const code = String(country.currency || "").toUpperCase();
    if (!code) return;
    const preferred = PREFERRED_COUNTRY[code];
    if (!map.has(code) || preferred === country.isoCode) {
      map.set(code, { value: code, code, symbol: currencySymbol(code), name: currencyName(code), countryCode: preferred || country.isoCode, flag: preferred === "EU" ? "🇪🇺" : country.flag });
    }
  });
  return [...map.values()].sort((a, b) => a.code.localeCompare(b.code));
})();

export const currencyMeta = (source = {}) => {
  let remembered = {};
  try {
    remembered = typeof localStorage === "undefined" ? {} : JSON.parse(localStorage.getItem("khiladi-default-currency") || "{}");
  } catch {
    remembered = {};
  }
  const hasExplicitCurrency = Boolean(source?.currencyCode || source?.currency);
  const code = String(source?.currencyCode || source?.currency || remembered.currencyCode || "INR").toUpperCase();
  const option = currencyOptions.find((item) => item.code === code);
  return {
    code,
    symbol: source?.currencySymbol || (!hasExplicitCurrency ? remembered.currencySymbol : "") || option?.symbol || currencySymbol(code),
    countryCode: source?.currencyCountryCode || (!hasExplicitCurrency ? remembered.currencyCountryCode : "") || option?.countryCode || "IN",
    flag: option?.flag || "",
  };
};

export const rememberDefaultCurrency = (source = {}) => {
  if (typeof localStorage === "undefined" || !source?.currencyCode) return;
  const meta = currencyMeta(source);
  localStorage.setItem("khiladi-default-currency", JSON.stringify({ currencyCode: meta.code, currencySymbol: meta.symbol, currencyCountryCode: meta.countryCode }));
};

export const formatMoney = (value, source = {}) => {
  const { symbol } = currencyMeta(source);
  const amount = Number(value || 0);

  try {
    const formattedAmount = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);

    return `${symbol}${formattedAmount}`;
  } catch {
    return `${symbol}${Number.isFinite(amount) ? amount : 0}`;
  }
};

const referenceId = (reference) =>
  String(reference?._id || reference?.id || reference || "").trim();

export const branchFor = (branches = [], branchReference = "") => {
  const branchId = referenceId(branchReference);
  const matchedBranch = branchId
    ? branches.find((branch) => referenceId(branch) === branchId)
    : null;

  if (matchedBranch) return matchedBranch;

  // A populated student.branch already contains the saved currency fields.
  if (
    branchReference &&
    typeof branchReference === "object" &&
    (branchReference.currencyCode || branchReference.currencySymbol)
  ) {
    return branchReference;
  }

  return branches.find((branch) => branch?.isMainBranch) || branches[0] || {};
};

export const paymentCurrencySource = (payment = {}, fallback = {}) => {
  const candidates = [payment?.branch, payment?.student?.branch, fallback, payment];
  return candidates.find(
    (candidate) => candidate?.currencyCode || candidate?.currencySymbol || candidate?.currency
  ) || {};
};

export const scopeCurrencySource = (branches = [], branchId = "") => {
  if (branchId) return branchFor(branches, branchId);
  const active = branches.filter((branch) => branch?.isActive !== false);
  const codes = new Set(active.map((branch) => branch?.currencyCode).filter(Boolean));
  return codes.size <= 1
    ? active.find((branch) => branch?.isMainBranch) || active[0] || {}
    : null;
};
