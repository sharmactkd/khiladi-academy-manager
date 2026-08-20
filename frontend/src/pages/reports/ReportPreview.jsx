import { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, FileChartColumn } from "lucide-react";
import ExportButtons from "../../components/reports/ExportButtons.jsx";
import ReportDocument from "../../components/reports/ReportDocument.jsx";
import styles from "./ReportStudio.module.css";

const ReportPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const cached = useMemo(() => { try { return JSON.parse(sessionStorage.getItem("khiladi:last-report") || "null"); } catch { return null; } }, []);
  const report = location.state?.report || cached;
  const visibleKeys = location.state?.visibleKeys?.length ? location.state.visibleKeys : (report?.columns || []).map((column) => column.key);
  const columns = (report?.columns || []).filter((column) => visibleKeys.includes(column.key));

  if (!report) return <div className={`page ${styles.page}`}><section className={styles.noReport}><FileChartColumn size={34}/><h1>No report selected</h1><p>Generate a report before opening the full preview.</p><Link to="/reports">Open Report Studio</Link></section></div>;

  return <div className={`page ${styles.page} ${styles.previewPage}`}>
    <nav className={styles.breadcrumb}><Link to="/dashboard">Dashboard</Link><ChevronRight size={13}/><Link to="/reports">Reports</Link><ChevronRight size={13}/><strong>Preview</strong></nav>
    <header className={styles.previewHeading}><div><button type="button" onClick={() => navigate(-1)}><ArrowLeft size={17}/></button><div><small>Print-ready document</small><h1>{report.title}</h1><p>{report.totalRows || 0} records · Generated {new Date(report.generatedAt).toLocaleString("en-IN")}</p></div></div><ExportButtons report={report} columns={columns}/></header>
    <ReportDocument report={report} visibleKeys={visibleKeys} styles={styles}/>
  </div>;
};

export default ReportPreview;
