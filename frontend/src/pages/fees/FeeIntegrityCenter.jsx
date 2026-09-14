import { useState } from "react";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldCheck, Wrench } from "lucide-react";

import api from "../../api/api.js";
import styles from "../imports/Imports.module.css";

const unwrap = response => response?.data?.data ?? response?.data ?? response;
const errorText = error => error?.response?.data?.message || error.message || "Operation failed";
const typeLabel = value => ({ payment_totals: "Payment ledger", missing_income: "Missing income", income_mismatch: "Income mismatch", cancelled_income: "Cancelled income", membership_status: "Membership status" })[value] || value;

export default function FeeIntegrityCenter() {
  const [report, setReport] = useState(null), [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [result, setResult] = useState(null);
  const scan = async () => {
    setBusy(true); setError(""); setResult(null);
    try { const data = unwrap(await api.get("/fees/integrity/scan")); setReport(data); setSelected(data.issues.filter(item => item.repairable).map(item => item.id)); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  const repair = async () => {
    if (!selected.length || !window.confirm(`Repair ${selected.length} selected fee integrity issues? A fresh server-side scan will run before any change.`)) return;
    setBusy(true); setError("");
    try { const data = unwrap(await api.post("/fees/integrity/repair", { issueIds: selected })); await scan(); setResult(data); }
    catch (e) { setError(errorText(e)); } finally { setBusy(false); }
  };
  const issues = report?.issues || [];

  return <div className={styles.page}>
    <header className={styles.heading}><div><span>FINANCIAL CONTROL</span><h1>Fee Integrity Center</h1><p>Detect and safely repair inconsistencies across fee payments, memberships and income records.</p></div><button className={styles.primary} disabled={busy} onClick={scan}><RefreshCw size={16} />{busy ? "Scanning…" : "Run integrity scan"}</button></header>
    {error && <p className={styles.error}><AlertTriangle size={17} /> {error}</p>}
    <section className={styles.card}><h2><ShieldCheck size={20} /> Safe repair policy</h2><p>This tool does not guess missing historical fees, create receipts, or change attendance. Every repair is recalculated from current database records and selected explicitly.</p></section>
    {report && <>
      <section className={styles.card}><h2>Scan summary</h2><div className={styles.stats}><article><small>Total issues</small><strong>{report.summary.total}</strong></article><article><small>High priority</small><strong>{report.summary.high}</strong></article><article><small>Medium priority</small><strong>{report.summary.medium}</strong></article><article><small>Selected</small><strong>{selected.length}</strong></article></div><p>Scanned: {new Date(report.scannedAt).toLocaleString()}</p></section>
      <section className={styles.card}><div className={styles.actions}><button onClick={() => setSelected(issues.filter(item => item.repairable).map(item => item.id))}>Select all safe repairs</button><button onClick={() => setSelected([])}>Clear</button><button className={styles.primary} disabled={busy || !selected.length} onClick={repair}><Wrench size={16} /> Repair selected ({selected.length})</button></div>
      {!issues.length ? <p><CheckCircle2 size={18} /> No fee integrity mismatch found.</p> : <div className={styles.table}><table><thead><tr><th>Select</th><th>Priority</th><th>Area</th><th>Issue</th><th>Current → Expected</th></tr></thead><tbody>{issues.map(item => <tr key={item.id}><td><input type="checkbox" disabled={!item.repairable} checked={selected.includes(item.id)} onChange={() => setSelected(values => values.includes(item.id) ? values.filter(value => value !== item.id) : [...values, item.id])} /></td><td><strong>{item.severity.toUpperCase()}</strong></td><td>{typeLabel(item.type)}</td><td><strong>{item.title}</strong><small>{item.details.receiptNumber || ""}</small></td><td><code>{JSON.stringify(item.details.current ?? item.details.currentAmount ?? "Missing")}</code> → <code>{JSON.stringify(item.details.expected ?? item.details.expectedAmount ?? "Reversed")}</code></td></tr>)}</tbody></table></div>}</section>
    </>}
    {!report && <section className={styles.card}><p>Run a dry scan first. No database value changes during scanning.</p></section>}
    {result && <section className={styles.card}><h2>Repair completed</h2><p>{result.repaired} repaired · {result.skipped} skipped because data changed or was no longer applicable.</p></section>}
  </div>;
}
