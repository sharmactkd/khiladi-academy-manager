import QRCode from "qrcode";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, MapPin, ShieldCheck } from "lucide-react";
import { getFileUrl, getStudentPhotoUrl } from "../../utils/fileUrl.js";
import { normalizeTemplate } from "../../pages/idCards/idCardTemplate.config.js";
import styles from "./IdCardPreview.module.css";

const nameOf = (student) => student?.name || `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || "Student Name";
const valueOf = (key, student, card, academy) => ({ admissionNumber: student.admissionNumber || student.studentCode || "—", martialArt: student.martialArt || student.batch?.martialArt || "Martial Art", beltRank: student.beltRank || "Belt not added", branch: student.branch?.branchName || "Main Branch", batch: student.batch?.batchName || "Batch not assigned", phone: student.phone || "Phone not added", validTill: card.validTill ? new Date(card.validTill).toLocaleDateString("en-GB") : "No expiry", cardNumber: card.cardNumber || "Pending", academyAddress: academy.address || academy.city || "Academy address", emergencyContact: student.emergencyContact?.phone || "Not added", terms: "If found, please return to the issuing academy." }[key] || "");

const IdCardPreview = ({ idCard = {}, template: templateProp, academy: academyProp, side = "front", compact = false }) => {
  const [qr, setQr] = useState("");
  const student = idCard.studentSnapshot || idCard.student || {};
  const template = normalizeTemplate(idCard.templateSnapshot || templateProp || idCard.template || {});
  const academy = idCard.academySnapshot || academyProp || idCard.academy || template.academy || {};
  const design = side === "back" ? template.backDesign : template.frontDesign;
  const fields = design?.fields || [];
  const logo = getFileUrl(template.logo || academy.logo, "");
  const photo = getStudentPhotoUrl(student, "");
  useEffect(() => { let live = true; QRCode.toDataURL(idCard.qrCodeData || "https://khiladi.app/verify/demo", { margin: 0, width: 180 }).then((url) => live && setQr(url)).catch(() => setQr("")); return () => { live = false; }; }, [idCard.qrCodeData]);
  const cssVars = useMemo(() => ({ "--id-primary": template.primaryColor, "--id-secondary": template.secondaryColor, "--id-accent": template.accentColor, "--id-bg": template.backgroundColor, "--id-text": template.textColor, "--id-font": template.fontFamily }), [template]);
  const cls = [styles.card, styles[template.orientation], compact ? styles.compact : "", design?.showSafeArea ? styles.safe : "", design?.showBleed ? styles.bleed : ""].filter(Boolean).join(" ");
  const details = fields.filter((key) => !["studentPhoto", "fullName", "qrCode"].includes(key));
  return <article className={cls} style={cssVars} aria-label={`${side} ID card preview`}>
    <div className={styles.band}/><header>{logo ? <img src={logo} alt="Academy logo"/> : <ShieldCheck/>}<div><span>{design?.label || "STUDENT IDENTITY"}</span><strong>{academy.academyName || academy.name || "KHILADI ACADEMY"}</strong></div><BadgeCheck className={styles.verified}/></header>
    {side === "front" ? <main>{fields.includes("studentPhoto") ? <div className={`${styles.photo} ${styles[template.photoShape]}`}>{photo ? <img src={photo} alt={nameOf(student)}/> : <span>{nameOf(student).split(" ").map((v) => v[0]).slice(0,2).join("")}</span>}</div> : null}<div className={styles.identity}>{fields.includes("fullName") ? <><small>STUDENT</small><h2>{nameOf(student)}</h2></> : null}<div>{details.map((key) => <p key={key}><span>{key.replace(/([A-Z])/g, " $1")}</span><strong>{valueOf(key, student, idCard, academy)}</strong></p>)}</div></div>{fields.includes("qrCode") && qr ? <img className={styles.qr} src={qr} alt="Secure verification QR"/> : null}</main>
      : <main className={styles.back}><div className={styles.backDetails}>{fields.filter((key) => key !== "qrCode").map((key) => <p key={key}><span>{key.replace(/([A-Z])/g, " $1")}</span><strong>{valueOf(key, student, idCard, academy)}</strong></p>)}</div>{fields.includes("qrCode") && qr ? <div className={styles.verify}><img src={qr} alt="Secure verification QR"/><span><ShieldCheck size={14}/>Scan to verify</span></div> : null}</main>}
    <footer><span><MapPin size={11}/>{student.branch?.branchName || "Main Branch"}</span><strong>{idCard.status === "cancelled" ? "REVOKED" : "VERIFIED MEMBER"}</strong></footer>
  </article>;
};
export default IdCardPreview;
