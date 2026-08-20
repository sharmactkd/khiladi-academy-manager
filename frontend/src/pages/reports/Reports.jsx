import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, ChevronRight, FileChartColumn, FileSearch, LoaderCircle, Maximize2, Sparkles } from "lucide-react";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import ExportButtons from "../../components/reports/ExportButtons.jsx";
import ReportDocument from "../../components/reports/ReportDocument.jsx";
import ReportFilters from "../../components/reports/ReportFilters.jsx";
import ReportHistoryPanel from "../../components/reports/ReportHistoryPanel.jsx";
import ReportTypeCatalog from "../../components/reports/ReportTypeCatalog.jsx";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import useReportStudio from "./hooks/useReportStudio.js";
import styles from "./ReportStudio.module.css";

const joinAddress = (source) => [source?.address, source?.city, source?.state, source?.country].map((item) => String(item || "").trim()).filter(Boolean).join(", ");

const Reports = () => {
  const navigate = useNavigate();
  const state = useReportStudio();
  const [search, setSearch] = useState("");
  const [visibleKeys, setVisibleKeys] = useState([]);
  const reportType = state.availableTypes.find((item) => item.id === state.reportType) || state.availableTypes[0];
  const mainBranch = state.branches.find((branch) => branch?.isMainBranch) || state.branches[0];
  useEffect(() => { setVisibleKeys((state.report?.columns || []).map((column) => column.key)); setSearch(""); }, [state.report]);
  const selectedColumns = useMemo(() => (state.report?.columns || []).filter((column) => visibleKeys.includes(column.key)), [state.report, visibleKeys]);
  const openPreview = () => navigate("/reports/preview", { state: { report: state.report, visibleKeys } });

  if (state.booting) return <div className={`page ${styles.page}`}><div className={styles.booting}><LoaderCircle size={30}/><strong>Preparing Report Studio...</strong></div></div>;

  return <div className={`page ${styles.page}`}>
    <AcademyHeroHeader headingId="reports-academy" academyName={state.academy?.academyName || "KHILADI Academy"} ownerName={state.academy?.ownerName || state.user?.name || "Academy Owner"} logoUrl={state.academy?.logo ? getAcademyLogoUrl(state.academy) : ""} eyebrow="Records & compliance" addressLabel={mainBranch?.branchName || "Main Branch"} address={joinAddress(mainBranch) || joinAddress(state.academy) || "Complete main branch address not available"} summaryItems={[{ key: "branches", type: "branches", value: state.branches.length, label: `Active ${state.branches.length === 1 ? "Branch" : "Branches"}` }, { key: "reports", icon: FileChartColumn, value: state.availableTypes.length, label: "Report Types" }]}/>
    <nav className={styles.breadcrumb}><Link to="/dashboard">Dashboard</Link><ChevronRight size={13}/><strong>Report Studio</strong></nav>
    <header className={styles.pageHeading}><div><span><FileChartColumn size={25}/></span><div><small>Records & compliance</small><h1>Report Studio</h1><p>Build accurate, branded and export-ready academy records.</p></div></div>{state.report ? <div className={styles.headingActions}><ExportButtons report={state.report} columns={selectedColumns}/><button type="button" onClick={openPreview}><Maximize2 size={15}/>Full Preview</button></div> : null}</header>
    <ReportTypeCatalog types={state.availableTypes} value={state.reportType} onChange={state.setReportType} styles={styles}/>
    <div className={styles.builderGrid}><ReportFilters branches={state.branches} batches={state.batches} filters={state.filters} onChange={state.setFilters} onGenerate={state.generate} loading={state.loading} reportType={reportType} styles={styles}/><ReportHistoryPanel history={state.history} styles={styles}/></div>
    {state.error ? <div className={styles.error}><AlertTriangle size={18}/><div><strong>Report could not be generated</strong><span>{state.error}</span></div><button type="button" onClick={state.generate}>Retry</button></div> : null}
    {state.loading ? <section className={styles.generating}><LoaderCircle size={28}/><strong>Generating {reportType?.label}...</strong><span>Validating filters and preparing official records.</span></section> : state.report ? <section className={styles.previewSection}><header><div><small>03 · Generated document</small><h2>Report Preview</h2><p>Search records, choose columns and export the final document.</p></div><div className={styles.previewActions}><ExportButtons report={state.report} columns={selectedColumns}/><button type="button" onClick={openPreview}><Maximize2 size={15}/>Full Preview</button></div></header><ReportDocument report={state.report} search={search} onSearch={setSearch} visibleKeys={visibleKeys} onVisibleKeys={setVisibleKeys} styles={styles} compact/></section> : <section className={styles.welcome}><span><FileSearch size={31}/></span><div><small>Ready to build</small><h2>Your official report will appear here</h2><p>Select a report, define its scope and click Generate Report. You can then search, customise columns, print or export it.</p></div><button type="button" onClick={state.generate}><Sparkles size={16}/>Generate {reportType?.shortLabel}</button></section>}
  </div>;
};

export default Reports;
