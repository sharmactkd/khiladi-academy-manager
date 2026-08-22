import { CheckCircle2, Columns3, FileSearch, Search } from "lucide-react";
import { humanizeKey } from "../../pages/reports/reportStudio.config.js";
import { formatMoney } from "../../utils/currency.js";
import documentStyles from "./ReportDocument.module.css";

const formatValue = (value, key = "") => {
  if (value === null || value === undefined || value === "") return "—";
  if (/date|generatedAt/i.test(key)) { const date = new Date(value); if (!Number.isNaN(date.getTime())) return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }); }
  if (/amount|paid|pending/i.test(key) && !Number.isNaN(Number(value))) return formatMoney(value);
  return String(value).replaceAll("_", " ");
};

const ReportDocument = ({ report, search = "", onSearch, visibleKeys, onVisibleKeys, styles, compact = false }) => {
  const columns = (report?.columns || []).filter((column) => !visibleKeys || visibleKeys.includes(column.key));
  const query = search.trim().toLowerCase();
  const rows = (report?.rows || []).filter((row) => !query || Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(query)));
  const previewLimit = 12;
  const toggleColumn = (key) => onVisibleKeys?.((current) => current.includes(key) && current.length > 1 ? current.filter((item) => item !== key) : current.includes(key) ? current : [...current, key]);

  return <section id="report-preview" className={styles.document}>
    <div className={styles.documentAccent}/>
    <header className={styles.documentHeader}><div><small>Official academy report</small><h2>{report.title}</h2><p>Generated {new Date(report.generatedAt).toLocaleString("en-IN")} · {report.totalRows || 0} records</p></div><div className={styles.documentBrand}><strong>{report.academy?.name || "KHILADI Academy"}</strong><span>Academy Management System</span></div></header>
    {report.summary && Object.keys(report.summary).length ? <div className={styles.summary}>{Object.entries(report.summary).map(([key, value], index) => <article key={key}><span className={styles[`summaryTone${index % 4}`]}><CheckCircle2 size={15}/></span><div><small>{humanizeKey(key)}</small><strong>{/amount|paid|pending/i.test(key) ? formatMoney(value) : value}</strong></div></article>)}</div> : null}
    {!compact || onSearch ? <div className={styles.tableTools}>{onSearch ? <label><Search size={15}/><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search generated report..."/><span>{rows.length} matches</span></label> : <span/>}{onVisibleKeys ? <details><summary><Columns3 size={15}/>Columns</summary><div>{(report.columns || []).map((column) => <label key={column.key}><input type="checkbox" checked={visibleKeys.includes(column.key)} onChange={() => toggleColumn(column.key)}/>{column.label}</label>)}</div></details> : null}</div> : null}
    <div className={styles.tableWrap}><table><thead><tr><th>No.</th>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead><tbody>{rows.length ? rows.map((row, index) => <tr key={`${index}-${row._id || "row"}`} className={compact && index >= previewLimit ? documentStyles.compactHidden : ""}><td>{index + 1}</td>{columns.map((column) => <td key={column.key} className={/status|result|medal/i.test(column.key) ? styles.statusCell : ""}>{formatValue(row[column.key], column.key)}</td>)}</tr>) : <tr><td colSpan={columns.length + 1}><div className={styles.emptyRows}><FileSearch size={23}/><strong>No matching records</strong><span>Change the filters or search term.</span></div></td></tr>}</tbody></table></div>
    {compact && rows.length > previewLimit ? <footer className={styles.documentFooter}><span>Showing first {previewLimit} of {rows.length} records</span><strong>Open full preview to view every row</strong></footer> : null}
  </section>;
};

export default ReportDocument;
