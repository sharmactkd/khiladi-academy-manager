import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { BadgeCheck, CalendarDays, CreditCard, ShieldAlert, ShieldCheck } from "lucide-react";
import { idCardApi } from "../../api/idCardApi.js";
import { getFileUrl } from "../../utils/fileUrl.js";
import styles from "./VerifyIdCard.module.css";

const formatDate = (value) => value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "No expiry";
const VerifyIdCard = () => {
  const { verificationId } = useParams(); const [params] = useSearchParams(); const [result, setResult] = useState(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { idCardApi.verify(verificationId, params.get("token") || "").then((response) => setResult(response.data?.data || null)).catch((err) => setError(err.response?.data?.message || "This card could not be verified.")).finally(() => setLoading(false)); }, [verificationId, params]);
  return <main className={styles.page}><section className={styles.shell}>{loading ? <div className={styles.state}><span className={styles.spinner}/><h1>Verifying identity…</h1><p>Checking the secure card signature.</p></div> : error ? <div className={`${styles.state} ${styles.invalid}`}><ShieldAlert/><h1>Verification failed</h1><p>{error}</p></div> : <><header><div>{result?.academy?.logo ? <img src={getFileUrl(result.academy.logo)} alt="Academy logo"/> : <ShieldCheck/>}<span><small>OFFICIAL ID VERIFICATION</small><strong>{result?.academy?.name || "KHILADI Academy"}</strong></span></div><BadgeCheck/></header><div className={styles.valid}><ShieldCheck/><span><strong>Authentic card</strong><small>Secure record signature matched</small></span></div><div className={styles.profile}><div>{result?.student?.photo ? <img src={getFileUrl(result.student.photo)} alt="Student"/> : result?.student?.name?.slice(0,1)}</div><span><small>STUDENT</small><h1>{result?.student?.name || "Student"}</h1><p>{result?.student?.admissionNumber || "No admission number"}</p></span></div><dl><div><dt><CreditCard/>Card Number</dt><dd>{result?.cardNumber}</dd></div><div><dt><CalendarDays/>Issued</dt><dd>{formatDate(result?.issuedDate)}</dd></div><div><dt><CalendarDays/>Valid Till</dt><dd>{formatDate(result?.validTill)}</dd></div><div><dt><ShieldCheck/>Status</dt><dd className={result?.status === "active" ? styles.active : styles.revoked}>{result?.status}</dd></div></dl><footer>Verification ID · {verificationId}</footer></>}</section></main>;
};
export default VerifyIdCard;
