import { useEffect, useMemo, useRef, useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { Check, ChevronDown, Search, WalletCards } from "lucide-react";
import { currencyMeta, currencyOptions } from "../../utils/currency.js";
import styles from "./CurrencySelector.module.css";

const Flag = ({ countryCode, flag }) => countryCode === "EU" ? <span className={styles.emoji}>{flag || "🇪🇺"}</span> : <ReactCountryFlag countryCode={countryCode} svg className={styles.flag} />;

const CurrencySelector = ({ value = "INR", onChange, disabled = false, label = "Currency", required = false }) => {
  const [open, setOpen] = useState(false); const [search, setSearch] = useState(""); const root = useRef(null);
  const selected = currencyOptions.find((item) => item.code === value) || { ...currencyMeta({ currencyCode: value }), name: value };
  const options = useMemo(() => { const q = search.trim().toLowerCase(); return q ? currencyOptions.filter((item) => [item.code, item.name, item.symbol].some((text) => String(text).toLowerCase().includes(q))) : currencyOptions; }, [search]);
  useEffect(() => { const close = (event) => { if (!root.current?.contains(event.target)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  return <label className={styles.field} ref={root}><span>{label}{required ? <b> *</b> : null}</span><button type="button" className={styles.control} disabled={disabled} onClick={() => setOpen((current) => !current)} aria-expanded={open}><Flag {...selected}/><strong>{selected.code}</strong><small>{selected.symbol} · {selected.name}</small><ChevronDown size={15}/></button>{open ? <div className={styles.menu}><div className={styles.search}><Search size={14}/><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search currency, code or symbol" /></div><div className={styles.options}>{options.map((item) => <button type="button" key={item.code} className={item.code === selected.code ? styles.active : ""} onClick={() => { onChange?.({ currencyCode: item.code, currencySymbol: item.symbol, currencyCountryCode: item.countryCode }); setOpen(false); setSearch(""); }}><Flag {...item}/><span><strong>{item.code} · {item.symbol}</strong><small>{item.name}</small></span>{item.code === selected.code ? <Check size={15}/> : null}</button>)}{!options.length ? <p><WalletCards size={18}/>No currency found</p> : null}</div></div> : null}</label>;
};
export default CurrencySelector;
