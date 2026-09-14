import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, DatabaseZap, RefreshCw } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import api from "../../api/api.js";
import styles from "./Imports.module.css";

const unwrap = response => response?.data?.data ?? response?.data ?? response;
const list = (response, key) => { const value = unwrap(response); return Array.isArray(value) ? value : value?.[key] || []; };
const id = value => String(value?._id || value || "");
const date = value => value ? new Date(value).toLocaleDateString("en-GB") : "—";
const errorText = error => error?.response?.data?.message || error.message || "Operation failed";

export default function ImportedFeeReconciliation() {
  const [params] = useSearchParams();
  const [branches, setBranches] = useState([]), [batches, setBatches] = useState([]);
  const [branch, setBranch] = useState(""), [batch, setBatch] = useState(params.get("batch") || "");
  const [data, setData] = useState({ candidates: [], summary: {} });
  const [selected, setSelected] = useState([]), [loading, setLoading] = useState(false);
  const [error, setError] = useState(""), [result, setResult] = useState(null);
  const batchOptions = useMemo(() => batches.filter(item => !branch || id(item.branch) === branch), [batches, branch]);
  const ready = data.candidates.filter(item => !item.warnings?.length);

  useEffect(() => {
    Promise.all([api.get("/branches"), api.get("/batches")]).then(([a, b]) => {
      setBranches(list(a, "branches")); setBatches(list(b, "batches"));
    }).catch(e => setError(errorText(e)));
  }, []);
  useEffect(() => { if (!branch && branches.length === 1) setBranch(id(branches[0])); }, [branches, branch]);
  useEffect(() => { if (!batch && batchOptions.length === 1) setBatch(id(batchOptions[0])); }, [batchOptions, batch]);

  const preview = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const response = unwrap(await api.get("/attendance/imported-fees/preview", { params: batch ? { batch } : {} }));
      setData(response); setSelected(response.candidates.filter(item => !item.warnings?.length).map(item => item.studentId));
    } catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  };
  const apply = async () => {
    if (!selected.length || !window.confirm(`Apply verified imported fee state to ${selected.length} students? No payment receipt will be created.`)) return;
    setLoading(true); setError("");
    try {
      const response = unwrap(await api.post("/attendance/imported-fees/apply", { batch: batch || undefined, studentIds: selected }));
      setResult(response); await preview();
    } catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  };

  return <div className={styles.page}>
    <header className={styles.heading}><div><span>DATA INTEGRITY</span><h1>Imported Fee Reconciliation</h1><p>Review historical fee labels before they affect live membership status.</p></div><Link to="/imports">Back to Imports</Link></header>
    {error && <p className={styles.error}><AlertTriangle size={17} /> {error}</p>}
    <section className={styles.card}><h2><DatabaseZap size={19} /> Select source</h2><div className={styles.actions}>
      <label>Branch<select value={branch} onChange={e => { setBranch(e.target.value); setBatch(""); }}><option value="">All branches</option>{branches.map(item => <option key={id(item)} value={id(item)}>{item.branchName}</option>)}</select></label>
      <label>Batch<select value={batch} onChange={e => setBatch(e.target.value)}><option value="">All batches</option>{batchOptions.map(item => <option key={id(item)} value={id(item)}>{item.batchName}</option>)}</select></label>
      <button className={styles.primary} disabled={loading} onClick={preview}><RefreshCw size={15} /> {loading ? "Checking…" : "Preview imported fee data"}</button>
    </div><p>Latest imported metadata per linked student is shown. Invalid dates and special waived/complimentary memberships are protected.</p></section>
    {data.candidates.length > 0 && <>
      <section className={styles.card}><h2>Reconciliation summary</h2><div className={styles.stats}><article><small>Found</small><strong>{data.summary.total || 0}</strong></article><article><small>Ready</small><strong>{data.summary.ready || 0}</strong></article><article><small>Needs review</small><strong>{data.summary.warnings || 0}</strong></article><article><small>Selected</small><strong>{selected.length}</strong></article></div><p>{data.policy}</p></section>
      <section className={styles.card}><div className={styles.actions}><button onClick={() => setSelected(ready.map(item => item.studentId))}>Select all verified</button><button onClick={() => setSelected([])}>Clear</button><button className={styles.primary} disabled={loading || !selected.length} onClick={apply}><CheckCircle2 size={16} /> Confirm & apply ({selected.length})</button></div>
      <div className={styles.table}><table><thead><tr><th>Select</th><th>Student</th><th>Imported status</th><th>Due date</th><th>Paid date</th><th>Will become</th><th>Validation</th></tr></thead><tbody>{data.candidates.map(item => { const balance = [item.normalized.unpaidMonths ? `${item.normalized.unpaidMonths}M` : "", item.normalized.unpaidDays ? `${item.normalized.unpaidDays}D` : ""].filter(Boolean).join(", "); return <tr key={item.studentId}><td><input type="checkbox" disabled={Boolean(item.warnings?.length)} checked={selected.includes(item.studentId)} onChange={() => setSelected(values => values.includes(item.studentId) ? values.filter(value => value !== item.studentId) : [...values, item.studentId])} /></td><td><strong>{item.student.name}</strong><small>{item.student.admissionNumber || "No admission number"}</small></td><td>{item.raw.feeStatus || "—"}</td><td>{item.raw.dueDate || "—"}</td><td>{item.raw.paidDate || "—"}</td><td><strong>{balance ? `${balance} ` : ""}{item.normalized.feeStatus.toUpperCase()}</strong><small>Due: {date(item.normalized.dueDate)} · Paid: {date(item.normalized.paidDate)}</small></td><td>{item.warnings?.length ? item.warnings.join(", ") : <span><CheckCircle2 size={15} /> Verified</span>}</td></tr>; })}</tbody></table></div></section>
    </>}
    {!loading && data.candidates.length === 0 && <section className={styles.card}><p>Choose a batch or all batches, then generate a preview. Nothing is changed during preview.</p></section>}
    {result && <section className={styles.card}><h2>Applied successfully</h2><p>{result.applied} updated · {result.skipped} skipped. Repeated source snapshots are safely skipped.</p></section>}
  </div>;
}
