import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Award, ShieldCheck } from "lucide-react";
import { getFileUrl } from "../../utils/fileUrl.js";
import { certificateTitleFor, getCertificateSize, normalizeCertificateTemplate } from "../../pages/certificates/certificateTemplate.config.js";
import styles from "./CertificatePreview.module.css";

const formatDate = (value) => value
  ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  : "Not added";

const studentNameOf = (student) => student?.name || [student?.firstName, student?.lastName].filter(Boolean).join(" ") || "Student Name";
const hasData = (value) => value && typeof value === "object" && Object.keys(value).length > 0;

const getAchievement = ({ certificate, source, student }) => {
  if (certificate?.contentSnapshot?.achievement) return certificate.contentSnapshot.achievement;
  if (source?.kind === "belt_test") return [source.promotedToBelt, source.promotedToDanRank].filter(Boolean).join(" · ") || student?.beltRank || "Belt Promotion";
  if (source?.kind === "championship") return [source.result, source.championshipName].filter(Boolean).join(" · ") || "Championship Achievement";
  return certificate?.contentSnapshot?.subtitle || "Outstanding Achievement";
};

const CertificatePreview = ({ certificate = {}, template: templateProp, academy: academyProp, compact = false }) => {
  const [qrUrl, setQrUrl] = useState("");
  const template = normalizeCertificateTemplate(hasData(certificate.templateSnapshot) ? certificate.templateSnapshot : templateProp || certificate.template || {});
  const layout = template.layoutJson;
  const fields = layout.fields || template.fields || [];
  const student = hasData(certificate.studentSnapshot) ? certificate.studentSnapshot : certificate.student || {};
  const academy = hasData(certificate.academySnapshot) ? certificate.academySnapshot : academyProp || certificate.academy || template.academy || {};
  const source = certificate.sourceSnapshot?.kind
    ? certificate.sourceSnapshot
    : certificate.relatedBeltTest
      ? { kind: "belt_test", ...certificate.relatedBeltTest }
      : certificate.relatedChampionshipRecord
        ? { kind: "championship", ...certificate.relatedChampionshipRecord }
        : { kind: "manual" };
  const issueContent = Object.fromEntries(
    Object.entries(certificate.contentSnapshot || {}).filter(([, value]) => value !== "" && value !== null && value !== undefined)
  );
  const content = { ...layout.content, ...issueContent };
  const brand = layout.brand;
  const title = content.title || certificateTitleFor(certificate.certificateType || template.certificateType);
  const academyLogo = getFileUrl(academy.logo, "");
  const background = getFileUrl(template.backgroundImage, "");
  const pageSize = getCertificateSize(template);

  useEffect(() => {
    let active = true;
    if (!fields.includes("qrVerification") || layout.security?.showQr === false) { setQrUrl(""); return undefined; }
    QRCode.toDataURL(certificate.qrCodeData || "https://khiladi.app/verify/certificate/demo", { margin: 0, width: 220 })
      .then((value) => active && setQrUrl(value)).catch(() => active && setQrUrl(""));
    return () => { active = false; };
  }, [certificate.qrCodeData, fields, layout.security?.showQr]);

  const variables = useMemo(() => ({
    "--cert-primary": brand.primaryColor,
    "--cert-secondary": brand.secondaryColor,
    "--cert-accent": brand.accentColor,
    "--cert-background": brand.backgroundColor,
    "--cert-heading-font": brand.headingFont,
    "--cert-body-font": brand.bodyFont,
    "--cert-width-mm": `${pageSize.widthMm}mm`,
    "--cert-height-mm": `${pageSize.heightMm}mm`,
    aspectRatio: `${pageSize.widthMm}/${pageSize.heightMm}`,
    backgroundImage: background ? `url(${background})` : undefined,
  }), [brand, background, pageSize.heightMm, pageSize.widthMm]);

  const className = [styles.certificate, styles[template.orientation], styles[brand.borderStyle], compact ? styles.compact : "", layout.print?.showSafeArea ? styles.safeArea : "", layout.print?.showBleed ? styles.bleed : ""].filter(Boolean).join(" ");
  const achievement = getAchievement({ certificate, source, student });

  return <article className={className} style={variables} aria-label="Certificate preview">
    <div className={styles.cornerOne}/><div className={styles.cornerTwo}/><div className={styles.innerBorder}/>
    {layout.security?.showWatermark ? <ShieldCheck className={styles.watermark} aria-hidden="true"/> : null}
    <header>
      {fields.includes("academyLogo") ? <span className={styles.logo}>{academyLogo ? <img src={academyLogo} alt="Academy logo"/> : <Award/>}</span> : null}
      {fields.includes("academyName") ? <div><strong>{academy.academyName || academy.name || "KHILADI ACADEMY"}</strong><small>DISCIPLINE · FOCUS · EXCELLENCE</small></div> : null}
    </header>
    <main>
      <div className={styles.titleRow}><span/><div>{fields.includes("certificateTitle") ? <h1>{title}</h1> : null}<b>★ ★ ★</b></div><span/></div>
      <p className={styles.eyebrow}>{content.eyebrow}</p>
      {fields.includes("studentName") ? <h2>{studentNameOf(student)}</h2> : null}
      <p className={styles.statement}>{content.statement}</p>
      {fields.includes("achievement") || fields.includes("beltAndDan") || fields.includes("eventName") ? <div className={styles.achievement}><span/>{achievement}<span/></div> : null}
    </main>
    <section className={styles.bottomRow} style={{ gridTemplateColumns: "1.2fr 2.4fr .55fr" }}>
      <div className={styles.meta}>
        {fields.includes("certificateNumber") ? <p><span>CERTIFICATE NO.</span><strong>{certificate.certificateNumber || "Pending"}</strong></p> : null}
        {fields.includes("issueDate") ? <p><span>ISSUE DATE</span><strong>{formatDate(certificate.issueDate)}</strong></p> : null}
        {fields.includes("dateOfBirth") ? <p><span>DATE OF BIRTH</span><strong>{formatDate(student.dateOfBirth || student.dob)}</strong></p> : null}
      </div>
      {fields.includes("signatures") ? <div className={styles.signatures}>{layout.signatures.map((signature, index) => <div key={`${signature.role}-${index}`}>{signature.imageUrl ? <img src={getFileUrl(signature.imageUrl)} alt="Signature"/> : <em>{signature.name}</em>}<span/><strong>{signature.role}</strong></div>)}</div> : null}
      {qrUrl ? <div className={styles.qr}><img src={qrUrl} alt="Certificate verification QR"/><span>SCAN TO VERIFY</span></div> : null}
    </section>
    {certificate.status === "cancelled" ? <div className={styles.revoked}>CANCELLED</div> : null}
  </article>;
};

export default CertificatePreview;
