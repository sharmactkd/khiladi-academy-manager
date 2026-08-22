import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, BadgeIndianRupee, Banknote, Building2, CheckCircle2, Download, GraduationCap, IndianRupee, Mail, MapPin, Phone, Printer, ReceiptIndianRupee, RefreshCw, ShieldCheck, Smartphone, UserRound, WalletCards } from "lucide-react";
import { academyApi } from "../../api/academyApi.js";
import { getBranches } from "../../api/branchApi.js";
import { feePaymentApi } from "../../api/feeApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import useAuth from "../../hooks/useAuth.js";
import { formatPaymentMode } from "../../utils/feePaymentModes.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import styles from "./ReceiptView.module.css";
import { formatMoney } from "../../utils/currency.js";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const studentName = (student) => [student?.firstName, student?.lastName].filter(Boolean).join(" ").trim() || "Student";
const joinAddress = (source) => [source?.address, source?.city, source?.state, source?.country].map((item) => String(item || "").trim()).filter(Boolean).join(", ");
const normalizeAcademy = (response) => response?.data?.data?.academy || response?.data?.academy || null;
const normalizeBranches = (response) => {
  const list = response?.data?.data || response?.data || [];
  return Array.isArray(list) ? list.filter((item) => item?.isActive !== false) : [];
};
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};
const numberToWords = (rawValue) => {
  const value = Math.round(Number(rawValue || 0));
  if (value === 0) return "Zero Rupees Only";
  if (value < 0 || value > 99999999) return `${value.toLocaleString("en-IN")} Rupees Only`;
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const underHundred = (number) => number < 20 ? ones[number] : `${tens[Math.floor(number / 10)]}${number % 10 ? ` ${ones[number % 10]}` : ""}`;
  const underThousand = (number) => `${Math.floor(number / 100) ? `${ones[Math.floor(number / 100)]} Hundred` : ""}${Math.floor(number / 100) && number % 100 ? " " : ""}${number % 100 ? underHundred(number % 100) : ""}`;
  const parts = [];
  let remaining = value;
  const crore = Math.floor(remaining / 10000000); if (crore) { parts.push(`${underHundred(crore)} Crore`); remaining %= 10000000; }
  const lakh = Math.floor(remaining / 100000); if (lakh) { parts.push(`${underHundred(lakh)} Lakh`); remaining %= 100000; }
  const thousand = Math.floor(remaining / 1000); if (thousand) { parts.push(`${underHundred(thousand)} Thousand`); remaining %= 1000; }
  if (remaining) parts.push(underThousand(remaining));
  return `${parts.join(" ")} Rupees Only`;
};

const ReceiptView = () => {
  const { paymentId } = useParams();
  const { user } = useAuth();
  const receiptRef = useRef(null);
  const [payment, setPayment] = useState(null);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const fetchReceipt = async () => {
    try {
      setLoading(true);
      const [paymentResult, academyResult, branchResult] = await Promise.allSettled([feePaymentApi.getReceipt(paymentId), academyApi.getMyAcademy(), getBranches({ status: "active" })]);
      if (paymentResult.status !== "fulfilled") throw paymentResult.reason;
      setPayment(paymentResult.value?.data?.data || null);
      if (academyResult.status === "fulfilled") setAcademy(normalizeAcademy(academyResult.value));
      if (branchResult.status === "fulfilled") setBranches(normalizeBranches(branchResult.value));
    } catch (error) {
      toast.error(error.response?.data?.message || "Receipt load nahi hui");
      setPayment(null);
    } finally { setLoading(false); }
  };
  useEffect(() => { fetchReceipt(); }, [paymentId]);

  const mainBranch = branches.find((branch) => branch?.isMainBranch) || branches[0] || null;
  const receiptBranch = payment?.student?.branch || mainBranch;
  const currency = (value) => formatMoney(value, payment?.currencyCode ? payment : receiptBranch);
  const academyAddress = joinAddress(mainBranch) || joinAddress(academy);
  const receiptAddress = joinAddress(receiptBranch) || academyAddress;
  const logoUrl = academy?.logo ? getAcademyLogoUrl(academy) : "";
  const feePeriod = payment ? `${MONTHS[Number(payment.feeMonth) - 1] || "Month"} ${payment.feeYear || ""}`.trim() : "—";
  const status = useMemo(() => {
    const pending = Number(payment?.pendingAmount || 0), paid = Number(payment?.amountPaid || 0);
    if (payment?.status === "cancelled") return { key: "cancelled", label: "Cancelled" };
    if (pending <= 0 && paid > 0) return { key: "paid", label: "Paid" };
    if (paid > 0) return { key: "partial", label: "Partial" };
    return { key: "due", label: "Due" };
  }, [payment]);

  const handleDownloadPdf = async () => {
    if (!receiptRef.current || downloading) return;
    try {
      setDownloading(true);
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import("html2canvas"), import("jspdf")]);
      const canvas = await html2canvas(receiptRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false, windowWidth: receiptRef.current.scrollWidth });
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth(), pageHeight = pdf.internal.pageSize.getHeight(), margin = 8;
      const ratio = Math.min((pageWidth - margin * 2) / canvas.width, (pageHeight - margin * 2) / canvas.height);
      const width = canvas.width * ratio, height = canvas.height * ratio;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", (pageWidth - width) / 2, margin, width, height, undefined, "FAST");
      pdf.save(`${payment?.receiptNumber || "fee-receipt"}.pdf`);
    } catch { toast.error("PDF generate nahi ho payi. Please try again."); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className={styles.stateCard}><RefreshCw className={styles.spinner} size={26} /><strong>Loading receipt...</strong></div>;
  if (!payment) return <div className={styles.stateCard}><ReceiptIndianRupee size={30} /><strong>Receipt not found</strong><Link to="/fees/payments">Back to payments</Link></div>;

  const statusClass = styles[`status${status.key[0].toUpperCase()}${status.key.slice(1)}`];
  const resultClass = styles[`result${status.key[0].toUpperCase()}${status.key.slice(1)}`];
  return (
    <div className={`page ${styles.page}`}>
      <div className={styles.screenOnly}>
        <AcademyHeroHeader headingId="fee-receipt-academy" academyName={academy?.academyName || "KHILADI Academy"} ownerName={academy?.ownerName || user?.name || "Academy Owner"} logoUrl={logoUrl} eyebrow="Fee receipt desk" addressLabel={mainBranch?.branchName || "Main Branch"} address={academyAddress || "Complete main branch address not available"} summaryItems={[{ key: "branches", type: "branches", value: branches.length, label: `Active ${branches.length === 1 ? "Branch" : "Branches"}` }, { key: "receipt", icon: ReceiptIndianRupee, value: payment.receiptNumber || "Receipt", label: status.label }]} />
        <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link to="/dashboard">Dashboard</Link><span>/</span><Link to="/fees">Fees</Link><span>/</span><Link to="/fees/payments">Payments</Link><span>/</span><strong>{payment.receiptNumber || "Receipt"}</strong></nav>
        <header className={styles.heading}>
          <div><span><ReceiptIndianRupee size={25} /></span><div><small>Payment document</small><h1>Fee Receipt</h1><p>Review, print or download this payment receipt.</p></div></div>
          <div className={styles.actions}><Link to="/fees/payments"><ArrowLeft size={16} />Back to Payments</Link><button type="button" onClick={() => window.print()}><Printer size={16} />Print Receipt</button><button type="button" className={styles.primaryAction} onClick={handleDownloadPdf} disabled={downloading}><Download size={16} />{downloading ? "Preparing PDF..." : "Download PDF"}</button></div>
        </header>
      </div>

      <main ref={receiptRef} className={styles.receipt}>
        <header className={styles.receiptHeader}>
          <div className={styles.brand}><div className={styles.logo}>{logoUrl ? <img src={logoUrl} alt={`${academy?.academyName || "Academy"} logo`} /> : <GraduationCap size={35} />}</div><div><h2>{academy?.academyName || "KHILADI Academy"}</h2><p>Official Fee Receipt</p></div></div>
          <span className={`${styles.statusBadge} ${statusClass}`}><CheckCircle2 size={17} />{status.label}</span>
          <dl className={styles.receiptIdentity}><div><dt>Receipt No.</dt><dd>{payment.receiptNumber || "—"}</dd></div><div><dt>Payment Date</dt><dd>{formatDate(payment.paymentDate)}</dd></div></dl>
        </header>

        <section className={styles.informationGrid}>
          <article><h3><UserRound size={17} />Student Details</h3><dl><div><dt>Student Name</dt><dd>{studentName(payment.student)}</dd></div><div><dt>Admission No.</dt><dd>{payment.student?.admissionNumber || "—"}</dd></div><div><dt>Branch</dt><dd>{receiptBranch?.branchName || "Not assigned"}</dd></div><div><dt>Batch</dt><dd>{payment.batch?.batchName || "Not assigned"}</dd></div></dl></article>
          <article><h3><BadgeIndianRupee size={17} />Payment Details</h3><dl><div><dt>Fee Period</dt><dd>{feePeriod}</dd></div><div><dt>Payment Mode</dt><dd>{formatPaymentMode(payment.paymentMode)}</dd></div><div><dt>Phone</dt><dd>{payment.student?.phone || "—"}</dd></div><div><dt>Collected By</dt><dd>{payment.collectedBy?.name || "Academy"}</dd></div></dl></article>
        </section>

        <section className={styles.feeTable} aria-label="Fee payment summary"><div className={styles.tableHeader}><span>Description</span><span>Fee</span><span>Discount</span><span>Paid</span><span>Balance</span></div><div className={styles.tableRow}><strong>Monthly Training Fee — {feePeriod}</strong><span>{currency(payment.amount)}</span><span>{currency(payment.discount)}</span><span>{currency(payment.amountPaid)}</span><span>{currency(payment.pendingAmount)}</span></div></section>
        <section className={styles.paymentOverview}>
          {payment.paymentMode === "cash_online" ? <div className={styles.splitPayment}><article><span><Banknote size={20} /></span><div><small>Cash Amount</small><strong>{currency(payment.cashAmount)}</strong></div></article><b>+</b><article><span><Smartphone size={20} /></span><div><small>Online Amount</small><strong>{currency(payment.onlineAmount)}</strong></div></article><b>=</b><article className={styles.splitTotal}><span><WalletCards size={20} /></span><div><small>Total Paid</small><strong>{currency(payment.amountPaid)}</strong></div></article></div> : <div className={styles.singlePayment}><span>{payment.paymentMode === "cash" ? <Banknote size={22} /> : <Smartphone size={22} />}</span><div><small>{formatPaymentMode(payment.paymentMode)} Payment</small><strong>{currency(payment.amountPaid)}</strong></div></div>}
          <dl className={styles.totals}><div><dt>Subtotal</dt><dd>{currency(payment.amount)}</dd></div><div><dt>Discount</dt><dd className={styles.discount}>−{currency(payment.discount)}</dd></div><div className={styles.totalPaid}><dt>Amount Paid</dt><dd>{currency(payment.amountPaid)}</dd></div><div><dt>Balance</dt><dd>{currency(payment.pendingAmount)}</dd></div><div className={`${styles.paymentResult} ${resultClass}`}><dt>{status.key === "paid" ? "Paid in full" : status.label}</dt><dd>{status.key === "paid" ? <ShieldCheck size={16} /> : null}</dd></div></dl>
        </section>
        <div className={styles.amountWords}><IndianRupee size={16} /><strong>Amount in words:</strong><span>{numberToWords(payment.amountPaid)}</span></div>
        <footer className={styles.contactFooter}>{receiptAddress ? <span><MapPin size={14} />{receiptAddress}</span> : null}{academy?.phone ? <span><Phone size={14} />{academy.countryCode || "+91"} {academy.phone}</span> : null}{academy?.email ? <span><Mail size={14} />{academy.email}</span> : null}<span className={styles.generated}><Building2 size={14} />Computer-generated official receipt</span></footer>
      </main>
    </div>
  );
};

export default ReceiptView;
