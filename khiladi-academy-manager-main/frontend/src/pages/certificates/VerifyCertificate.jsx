import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Award, BadgeCheck, CalendarDays, FileBadge2, ShieldAlert, ShieldCheck } from "lucide-react";
import { certificateApi } from "../../api/certificateApi.js";
import { getFileUrl } from "../../utils/fileUrl.js";
import styles from "./VerifyCertificate.module.css";

const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Not added";
const typeLabel = (value) => String(value || "Certificate").replaceAll("_", " ");
const VerifyCertificate = () => {
  const { verificationId } = useParams(); const [params] = useSearchParams(); const token = params.get("token") || ""; const [result, setResult] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { certificateApi.verify(verificationId, token).then((response) => setResult(response.data?.data || null)).catch((requestError) => setError(requestError.response?.data?.message || "This certificate could not be verified.")).finally(() => setLoading(false)); }, [verificationId, token]);
  return <main className={styles.page}><section className={styles.shell}>{loading ? <div className={styles.state}><span className={styles.spinner}/><h1>Verifying certificate…</h1><p>Checking the secure document signature.</p></div> : error ? <div className={`${styles.state} ${styles.invalid}`}><ShieldAlert/><h1>Verification failed</h1><p>{error}</p></div> : <><header><div>{result?.academy?.logo ? <img src={getFileUrl(result.academy.logo)} alt="Academy logo"/> : <Award/>}<span><small>OFFICIAL CERTIFICATE VERIFICATION</small><strong>{result?.academy?.name || "KHILADI Academy"}</strong></span></div><BadgeCheck/></header><div className={result?.status === "issued" ? styles.valid : styles.cancelled}><ShieldCheck/><span><strong>{result?.status === "issued" ? "Authentic certificate" : "Certificate cancelled"}</strong><small>{result?.status === "issued" ? "Secure record signature matched" : "This document is no longer valid"}</small></span></div><div className={styles.profile}><FileBadge2/><span><small>{typeLabel(result?.certificateType)}</small><h1>{result?.student?.name || "Student"}</h1><p>{result?.student?.admissionNumber || "No admission number"}</p></span></div><dl><div><dt><FileBadge2/>Certificate Number</dt><dd>{result?.certificateNumber}</dd></div><div><dt><CalendarDays/>Issued</dt><dd>{formatDate(result?.issueDate)}</dd></div><div><dt><Award/>Recognition</dt><dd>{result?.title || result?.source?.promotedToBelt || result?.source?.result || typeLabel(result?.certificateType)}</dd></div><div><dt><ShieldCheck/>Status</dt><dd className={result?.status === "issued" ? styles.active : styles.revoked}>{result?.status}</dd></div></dl><footer>Verification ID · {verificationId}</footer></>}</section></main>;
};

export default VerifyCertificate;
