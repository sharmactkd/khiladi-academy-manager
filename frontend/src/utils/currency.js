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
  const { code } = currencyMeta(source);
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency: code, maximumFractionDigits: 2 }).format(Number(value || 0)); }
  catch { return `${currencyMeta(source).symbol}${Number(value || 0).toLocaleString()}`; }
};

export const branchFor = (branches = [], branchId = "") => branches.find((branch) => String(branch?._id) === String(branchId)) || branches.find((branch) => branch?.isMainBranch) || branches[0] || {};
