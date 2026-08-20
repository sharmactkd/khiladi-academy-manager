import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Printer, ShieldCheck } from "lucide-react";
import { certificateApi } from "../../api/certificateApi.js";
import CertificatePreview from "../../components/certificates/CertificatePreview.jsx";
import styles from "./CertificateWorkflow.module.css";

const PrintCertificate = () => {
  const { id } = useParams(); const [certificate, setCertificate] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { certificateApi.getById(id).then((response) => setCertificate(response.data?.data?.certificate || null)).catch((requestError) => setError(requestError.response?.data?.message || "Certificate load nahi hua")).finally(() => setLoading(false)); }, [id]);
  if (loading) return <div className={styles.loading}>Preparing certificate for print…</div>; if (error || !certificate) return <div className={styles.loading}>{error || "Certificate not found"}</div>;
  const orientation = certificate.templateSnapshot?.orientation || certificate.template?.orientation || "landscape";
  return <div className={`page ${styles.printPage}`}><style>{`@media print { @page { size: A4 ${orientation}; margin: 0; } }`}</style><header className={`${styles.printHeader} no-print`}><div><ShieldCheck/><span><small>PRINT PRODUCTION</small><h1>A4 Certificate Output</h1><p>Rendered from the immutable issued-certificate snapshot.</p></span></div><div><Link to="/certificates/generate">Back</Link><button type="button" onClick={() => window.print()}><Printer/>Print / Save PDF</button></div></header><div className={styles.printSheet}><CertificatePreview certificate={certificate}/></div></div>;
};

export default PrintCertificate;
