import { useMemo, useState } from "react";
import DateInput from "../common/DateInput.jsx";
import { CalendarRange, Filter, RotateCcw, Save, Sparkles, Trash2 } from "lucide-react";
import { DATE_PRESETS, getDateRange } from "../../pages/reports/reportStudio.config.js";
import presetStyles from "./ReportFilters.module.css";

const ReportFilters = ({ batches, branches, filters, onChange, onGenerate, loading, reportType, styles }) => {
  const [savedPresets, setSavedPresets] = useState(() => { try { return JSON.parse(localStorage.getItem("khiladi:report-presets") || "[]"); } catch { return []; } });
  const typePresets = useMemo(() => savedPresets.filter((item) => item.reportType === reportType.id), [reportType.id, savedPresets]);
  const patch = (values) => onChange((current) => ({ ...current, ...values }));
  const preset = (id) => patch({ preset: id, ...getDateRange(id) });
  const reset = () => onChange({ branch: "", batch: "", status: "", fromDate: "", toDate: "", preset: "all" });
  const savePreset = () => {
    const name = window.prompt("Preset name");
    if (!name?.trim()) return;
    const saved = JSON.parse(localStorage.getItem("khiladi:report-presets") || "[]");
    const next = [{ id: Date.now(), name: name.trim(), reportType: reportType.id, filters }, ...saved].slice(0, 10);
    localStorage.setItem("khiladi:report-presets", JSON.stringify(next));
    setSavedPresets(next);
  };
  const removePreset = (id) => { const next = savedPresets.filter((item) => item.id !== id); localStorage.setItem("khiladi:report-presets", JSON.stringify(next)); setSavedPresets(next); };

  return <section className={styles.filterCard}>
    <header><div><span><Filter size={18}/></span><div><small>02 · Report criteria</small><h2>Define report scope</h2><p>Apply branch, batch, period and status filters.</p></div></div><button type="button" onClick={reset}><RotateCcw size={14}/>Reset</button></header>
    {!reportType.noDates ? <div className={styles.presets}>{DATE_PRESETS.map((item) => <button type="button" key={item.id} className={filters.preset === item.id ? styles.activePreset : ""} onClick={() => preset(item.id)}><CalendarRange size={13}/>{item.label}</button>)}</div> : null}
    <div className={styles.filterGrid}>
      <label><span>Branch</span><select value={filters.branch} onChange={(event) => patch({ branch: event.target.value, batch: "" })}><option value="">All branches</option>{branches.map((branch) => <option key={branch._id} value={branch._id}>{branch.branchName || branch.name}</option>)}</select></label>
      {!reportType.noBatch ? <label><span>Batch</span><select value={filters.batch} onChange={(event) => patch({ batch: event.target.value })}><option value="">All batches</option>{batches.map((batch) => <option key={batch._id} value={batch._id}>{batch.batchName || batch.name}</option>)}</select></label> : null}
      {!reportType.noDates ? <><label><span>From date</span><DateInput value={filters.fromDate} max={filters.toDate || undefined} onChange={(event) => patch({ fromDate: event.target.value, preset: "custom" })}/></label><label><span>To date</span><DateInput value={filters.toDate} min={filters.fromDate || undefined} onChange={(event) => patch({ toDate: event.target.value, preset: "custom" })}/></label></> : null}
      {reportType.statuses?.length ? <label><span>Status</span><select value={filters.status} onChange={(event) => patch({ status: event.target.value })}><option value="">All statuses</option>{reportType.statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label> : null}
    </div>
    <footer><div className={presetStyles.presetActions}><button type="button" className={styles.savePreset} onClick={savePreset}><Save size={15}/>Save preset</button>{typePresets.length ? <><select defaultValue="" onChange={(event) => { const selected = typePresets.find((item) => String(item.id) === event.target.value); if (selected) onChange(selected.filters); event.target.value = ""; }}><option value="">Load saved preset</option>{typePresets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" className={presetStyles.deletePreset} title="Delete latest preset" onClick={() => removePreset(typePresets[0].id)}><Trash2 size={14}/></button></> : null}</div><button type="button" className={styles.generate} onClick={onGenerate} disabled={loading}><Sparkles size={16}/>{loading ? "Generating report..." : "Generate Report"}</button></footer>
  </section>;
};

export default ReportFilters;
