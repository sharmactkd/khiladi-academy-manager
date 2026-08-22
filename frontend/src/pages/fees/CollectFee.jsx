import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Banknote,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Globe2,
  GraduationCap,
  History,
  LockKeyhole,
  MapPin,
  ReceiptText,
  RotateCcw,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";

import { academyApi } from "../../api/academyApi.js";
import { getBranches } from "../../api/branchApi.js";
import { feePaymentApi } from "../../api/feeApi.js";
import { studentApi } from "../../api/studentApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import useAuth from "../../hooks/useAuth.js";
import { PAYMENT_MODE_OPTIONS } from "../../utils/feePaymentModes.js";
import { getAcademyLogoUrl, getStudentPhotoUrl } from "../../utils/fileUrl.js";
import { branchFor, currencyMeta, formatMoney } from "../../utils/currency.js";
import styles from "./CollectFee.module.css";

const PAYMENT_MODE_ICONS = {
  cash: Banknote,
  online: Globe2,
  cash_online: WalletCards,
};

const PAYMENT_MODES = PAYMENT_MODE_OPTIONS.map((mode) => ({
  ...mode,
  icon: PAYMENT_MODE_ICONS[mode.value],
}));

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Date(2000, index, 1).toLocaleString("en-US", { month: "long" }),
}));

const studentName = (student) =>
  [student?.firstName, student?.lastName].filter(Boolean).join(" ").trim() || "Student";
const joinAddress = (source) =>
  [source?.address, source?.city, source?.state, source?.country]
    .map((item) => String(item || "").trim()).filter(Boolean).join(", ");

const normalizeStudents = (response) => {
  const list = response?.data?.students || response?.data?.data || response?.data || response?.students || [];
  return Array.isArray(list) ? list : [];
};

const normalizeAcademy = (response) =>
  response?.data?.data?.academy || response?.data?.academy || null;

const normalizeBranches = (response) => {
  const candidates = [
    response?.data?.data?.branches,
    response?.data?.branches,
    response?.data?.data,
    response?.data,
    response?.branches,
    response,
  ];
  const list = candidates.find(Array.isArray) || [];
  return Array.isArray(list) ? list.filter((item) => item?.isActive !== false) : [];
};

const getPaymentStatus = ({ pendingAmount, amountPaid }) => {
  if (pendingAmount <= 0 && amountPaid > 0) return { key: "paid", label: "Paid" };
  if (amountPaid > 0) return { key: "partial", label: "Partial" };
  return { key: "due", label: "Due" };
};

const CollectFee = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const now = new Date();
  const studentIdFromUrl = searchParams.get("student") || "";
  const initialMonth = Number(searchParams.get("month")) || now.getMonth() + 1;
  const initialYear = Number(searchParams.get("year")) || now.getFullYear();

  const [students, setStudents] = useState([]);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      student: studentIdFromUrl,
      feeMonth: initialMonth,
      feeYear: initialYear,
      amount: "",
      discount: 0,
      amountPaid: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMode: "cash",
      cashAmount: 0,
      onlineAmount: 0,
      notes: "",
    },
  });

  const selectedStudentId = watch("student");
  const feeMonth = Number(watch("feeMonth") || initialMonth);
  const feeYear = Number(watch("feeYear") || initialYear);
  const amount = Number(watch("amount") || 0);
  const discount = Math.max(Number(watch("discount") || 0), 0);
  const amountPaid = Math.max(Number(watch("amountPaid") || 0), 0);
  const paymentMode = watch("paymentMode") || "cash";
  const cashAmount = Math.max(Number(watch("cashAmount") || 0), 0);
  const onlineAmount = Math.max(Number(watch("onlineAmount") || 0), 0);
  const finalPayable = Math.max(amount - discount, 0);
  const pendingAmount = Math.max(finalPayable - amountPaid, 0);
  const paymentStatus = getPaymentStatus({ pendingAmount, amountPaid });

  const selectedStudent = useMemo(
    () => students.find((student) => String(student._id) === String(selectedStudentId)) || null,
    [students, selectedStudentId]
  );

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return students.slice(0, 30);
    return students.filter((student) =>
      [studentName(student), student.admissionNumber, student.phone, student.batch?.batchName]
        .some((value) => String(value || "").toLowerCase().includes(query))
    ).slice(0, 50);
  }, [studentSearch, students]);

  useEffect(() => {
    let mounted = true;
    setLoadingStudents(true);
    Promise.allSettled([
      studentApi.getAll({ status: "active" }),
      academyApi.getMyAcademy(),
      getBranches({ status: "active" }),
    ]).then(([studentResult, academyResult, branchResult]) => {
      if (!mounted) return;
      if (studentResult.status === "fulfilled") setStudents(normalizeStudents(studentResult.value));
      else toast.error(studentResult.reason?.response?.data?.message || "Students load nahi hue");
      if (academyResult.status === "fulfilled") setAcademy(normalizeAcademy(academyResult.value));
      if (branchResult.status === "fulfilled") setBranches(normalizeBranches(branchResult.value));
      setLoadingStudents(false);
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!studentIdFromUrl || !students.length) return;
    const student = students.find((item) => String(item._id) === String(studentIdFromUrl));
    if (student) setValue("student", studentIdFromUrl, { shouldValidate: true });
  }, [studentIdFromUrl, students, setValue]);

  useEffect(() => {
    if (!selectedStudent) return;
    const studentFee = Number(selectedStudent.monthlyFeeOverride || 0);
    const batchFee = Number(selectedStudent.batch?.monthlyFee || 0);
    const monthlyFee = studentFee > 0 ? studentFee : batchFee;
    setStudentSearch(studentName(selectedStudent));
    setValue("amount", monthlyFee, { shouldValidate: true });
    if (paymentMode === "cash_online") {
      const cashShare = Math.floor(monthlyFee / 2);
      setValue("cashAmount", cashShare, { shouldValidate: true });
      setValue("onlineAmount", monthlyFee - cashShare, { shouldValidate: true });
    } else {
      setValue("amountPaid", monthlyFee, { shouldValidate: true });
    }
  }, [selectedStudent, paymentMode, setValue]);

  useEffect(() => {
    if (paymentMode !== "cash_online") return;
    setValue("amountPaid", cashAmount + onlineAmount, { shouldValidate: true });
  }, [cashAmount, onlineAmount, paymentMode, setValue]);

  const selectStudent = (student) => {
    setValue("student", student._id, { shouldDirty: true, shouldValidate: true });
    setStudentSearch(studentName(student));
    setStudentMenuOpen(false);
  };

  const selectPaymentMode = (mode) => {
    setValue("paymentMode", mode, { shouldDirty: true, shouldValidate: true });

    if (mode === "cash_online") {
      const cashShare = Math.floor(amountPaid / 2);
      setValue("cashAmount", cashShare, { shouldDirty: true, shouldValidate: true });
      setValue("onlineAmount", amountPaid - cashShare, { shouldDirty: true, shouldValidate: true });
      return;
    }

    setValue("cashAmount", 0, { shouldDirty: true });
    setValue("onlineAmount", 0, { shouldDirty: true });
  };

  const resetForm = () => {
    reset({
      student: studentIdFromUrl,
      feeMonth: initialMonth,
      feeYear: initialYear,
      amount: "",
      discount: 0,
      amountPaid: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMode: "cash",
      cashAmount: 0,
      onlineAmount: 0,
      notes: "",
    });
    if (!studentIdFromUrl) setStudentSearch("");
  };

  const onSubmit = async (values) => {
    try {
      setSaving(true);
      const response = await feePaymentApi.collect({
        ...values,
        amount: Number(values.amount || 0),
        discount: Number(values.discount || 0),
        amountPaid: Number(values.amountPaid || 0),
        cashAmount: Number(values.cashAmount || 0),
        onlineAmount: Number(values.onlineAmount || 0),
        feeMonth: Number(values.feeMonth),
        feeYear: Number(values.feeYear),
        paymentDate: values.paymentDate
          ? new Date(`${values.paymentDate}T00:00:00`).toISOString()
          : new Date().toISOString(),
      });
      toast.success("Fee collected successfully");
      const payment = response?.data?.data || response?.data || null;
      navigate(payment?._id ? `/fees/receipt/${payment._id}` : "/fees/payments");
    } catch (error) {
      const details = error.response?.data?.data;
      toast.error(
        Array.isArray(details) && details.length
          ? details.map((item) => item.message).join(", ")
          : error.response?.data?.message || "Fee collect nahi hui"
      );
    } finally {
      setSaving(false);
    }
  };

  const mainBranch = branches.find((item) => item?.isMainBranch) || branches[0];
  const studentBranchReference =
    selectedStudent?.branch || selectedStudent?.batch?.branch || "";
  const feeBranch = branchFor(branches, studentBranchReference);
  const feeCurrency = currencyMeta(feeBranch);
  const currency = (value) => formatMoney(value, feeBranch);
  const academyAddress = joinAddress(mainBranch) || joinAddress(academy);
  const selectedMonthLabel = MONTH_OPTIONS.find((month) => month.value === feeMonth)?.label || "Month";

  return (
    <div className={`page ${styles.page}`}>
      <AcademyHeroHeader
        headingId="collect-fee-academy"
        academyName={academy?.academyName || "KHILADI Academy"}
        ownerName={academy?.ownerName || user?.name || "Academy Owner"}
        logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""}
        eyebrow="Fee collection desk"
        addressLabel={mainBranch?.branchName || "Main Branch"}
        address={academyAddress || "Complete main branch address not available"}
        summaryItems={[
          { key: "branches", type: "branches", value: branches.length, label: `Active ${branches.length === 1 ? "Branch" : "Branches"}` },
          { key: "students", icon: GraduationCap, value: students.length, label: "Active Students" },
        ]}
      />

      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link to="/dashboard">Dashboard</Link><span>/</span><Link to="/fees">Fees</Link><span>/</span><strong>Collect Fee</strong>
      </nav>

      <header className={styles.heading}>
        <div><span><CircleDollarSign size={25} /></span><div><small>Fee collection</small><h1>Collect Fee</h1><p>Record a student payment and generate a receipt.</p></div></div>
        <Link to="/fees/payments"><History size={16} />Payment History</Link>
      </header>

      <form className={styles.workspace} onSubmit={handleSubmit(onSubmit)} noValidate>
        <main className={styles.formCard}>
          <section className={styles.formSection}>
            <header><span>01</span><div><h2>Select Student & Fee Period</h2><p>Find the student and confirm the billing month.</p></div></header>
            <input type="hidden" {...register("student", { required: "Please select a student" })} />
            <div className={styles.studentPicker}>
              <label htmlFor="fee-student-search">Search Student *</label>
              <div className={`${styles.searchBox} ${errors.student ? styles.fieldError : ""}`}>
                <Search size={17} />
                <input
                  id="fee-student-search"
                  value={studentSearch}
                  onChange={(event) => { setStudentSearch(event.target.value); setStudentMenuOpen(true); if (selectedStudentId) setValue("student", "", { shouldValidate: true }); }}
                  onFocus={() => setStudentMenuOpen(true)}
                  onBlur={() => window.setTimeout(() => setStudentMenuOpen(false), 150)}
                  placeholder={loadingStudents ? "Loading students..." : "Search by name, phone or admission number"}
                  autoComplete="off"
                  disabled={loadingStudents}
                />
                {selectedStudent ? <CheckCircle2 size={17} className={styles.selectedCheck} /> : null}
              </div>
              {errors.student ? <small className={styles.errorText}>{errors.student.message}</small> : null}
              {studentMenuOpen && !loadingStudents ? (
                <div className={styles.studentMenu} role="listbox">
                  {filteredStudents.length ? filteredStudents.map((student) => (
                    <button key={student._id} type="button" role="option" aria-selected={student._id === selectedStudentId} onMouseDown={(event) => event.preventDefault()} onClick={() => selectStudent(student)}>
                      <img src={getStudentPhotoUrl(student)} alt="" />
                      <span><strong>{studentName(student)}</strong><small>{student.admissionNumber || "No admission number"} · {student.phone || "No phone"}</small></span>
                      <b>{student.batch?.batchName || "No batch"}</b>
                    </button>
                  )) : <p>No matching active student found.</p>}
                </div>
              ) : null}
            </div>

            {selectedStudent ? (
              <article className={styles.selectedStudent}>
                <img src={getStudentPhotoUrl(selectedStudent)} alt={studentName(selectedStudent)} />
                <div><small>Selected student</small><strong>{studentName(selectedStudent)}</strong><span>{selectedStudent.admissionNumber || "Admission number not added"}</span></div>
                <dl>
                  <div><dt><MapPin size={13} />Branch</dt><dd>{selectedStudent.branch?.branchName || "Not assigned"}</dd></div>
                  <div><dt><Building2 size={13} />Batch</dt><dd>{selectedStudent.batch?.batchName || "Not assigned"}</dd></div>
                  <div><dt><WalletCards size={13} />Monthly Fee</dt><dd>{currency(amount)}</dd></div>
                </dl>
              </article>
            ) : null}

            <div className={styles.periodGrid}>
              <label><span>Month *</span><select {...register("feeMonth", { required: "Month required" })}>{MONTH_OPTIONS.map((month) => <option key={month.value} value={month.value}>{month.label}</option>)}</select></label>
              <label><span>Year *</span><input type="number" min="2000" max="2100" {...register("feeYear", { required: "Year required", min: 2000, max: 2100 })} /></label>
              <label><span>Monthly Fee</span><div className={styles.readOnlyField}>{currency(amount)}</div></label>
            </div>
          </section>

          <section className={styles.formSection}>
            <header><span>02</span><div><h2>Payment Details</h2><p>Enter the amount received and payment information.</p></div></header>
            <div className={styles.paymentGrid}>
              <label><span>Monthly Fee *</span><div className={styles.moneyInput}><b className={styles.currencyMark} aria-label={feeCurrency.code}>{feeCurrency.symbol}</b><input type="number" step="0.01" min="0" {...register("amount", { required: "Amount required", min: { value: 0, message: "Amount cannot be negative" } })} /></div>{errors.amount ? <small className={styles.errorText}>{errors.amount.message}</small> : null}</label>
              <label><span>Discount / Scholarship</span><div className={styles.moneyInput}><b className={styles.currencyMark} aria-label={feeCurrency.code}>{feeCurrency.symbol}</b><input type="number" step="0.01" min="0" {...register("discount", { min: { value: 0, message: "Discount cannot be negative" } })} /></div>{errors.discount ? <small className={styles.errorText}>{errors.discount.message}</small> : null}</label>
              <label><span>Final Payable</span><div className={`${styles.readOnlyField} ${styles.emphasisField}`}>{currency(finalPayable)}</div></label>
              <label><span>Amount Paid *</span><div className={`${styles.moneyInput} ${paymentMode === "cash_online" ? styles.calculatedInput : ""}`}><b className={styles.currencyMark} aria-label={feeCurrency.code}>{feeCurrency.symbol}</b><input type="number" step="0.01" min="0" readOnly={paymentMode === "cash_online"} {...register("amountPaid", { required: "Amount paid required", min: { value: 0, message: "Paid amount cannot be negative" } })} /></div>{paymentMode === "cash_online" ? <small className={styles.helperText}>Automatically calculated from cash and online amounts.</small> : null}{errors.amountPaid ? <small className={styles.errorText}>{errors.amountPaid.message}</small> : null}</label>
              <label><span>Pending Amount</span><div className={`${styles.readOnlyField} ${pendingAmount > 0 ? styles.pendingField : styles.successField}`}>{currency(pendingAmount)}</div></label>
              <label><span>Payment Date *</span><div className={styles.dateInput}><CalendarDays size={15} /><input type="date" {...register("paymentDate", { required: "Payment date required" })} /></div>{errors.paymentDate ? <small className={styles.errorText}>{errors.paymentDate.message}</small> : null}</label>
            </div>

            <fieldset className={styles.paymentModes}>
              <legend>Payment Mode *</legend>
              <input type="hidden" {...register("paymentMode", { required: "Payment mode required" })} />
              <div>{PAYMENT_MODES.map(({ value, label, icon: Icon }) => <button key={value} type="button" className={paymentMode === value ? styles.activeMode : ""} onClick={() => selectPaymentMode(value)}><Icon size={17} />{label}</button>)}</div>
            </fieldset>

            {paymentMode === "cash_online" ? (
              <div className={styles.splitPayment}>
                <header><WalletCards size={17} /><div><strong>Split Payment</strong><small>Enter how much was received in cash and online.</small></div><span>{currency(cashAmount + onlineAmount)}</span></header>
                <div>
                  <label><span>Cash Amount *</span><div className={styles.moneyInput}><Banknote size={14} /><input type="number" step="0.01" min="0.01" {...register("cashAmount", { required: "Cash amount required", min: { value: 0.01, message: "Cash amount must be greater than zero" } })} /></div>{errors.cashAmount ? <small className={styles.errorText}>{errors.cashAmount.message}</small> : null}</label>
                  <span className={styles.splitPlus}>+</span>
                  <label><span>Online Amount *</span><div className={styles.moneyInput}><Globe2 size={14} /><input type="number" step="0.01" min="0.01" {...register("onlineAmount", { required: "Online amount required", min: { value: 0.01, message: "Online amount must be greater than zero" } })} /></div>{errors.onlineAmount ? <small className={styles.errorText}>{errors.onlineAmount.message}</small> : null}</label>
                  <span className={styles.splitEquals}>=</span>
                  <div className={styles.splitTotal}><small>Total Amount Paid</small><strong>{currency(cashAmount + onlineAmount)}</strong></div>
                </div>
              </div>
            ) : null}

            <label className={styles.notes}><span>Notes</span><textarea rows="3" {...register("notes")} placeholder="Payment received from parent, reference ID or any remarks..." /></label>
          </section>
        </main>

        <aside className={styles.summaryCard}>
          <header><span><ReceiptText size={20} /></span><div><small>Review & confirm</small><h2>Payment Summary</h2></div></header>
          {selectedStudent ? <div className={styles.summaryStudent}><img src={getStudentPhotoUrl(selectedStudent)} alt="" /><div><strong>{studentName(selectedStudent)}</strong><span>{selectedStudent.admissionNumber || "No admission number"}</span><small>{selectedStudent.branch?.branchName || "No branch"} · {selectedStudent.batch?.batchName || "No batch"}</small></div></div> : <div className={styles.summaryPlaceholder}><UserRound size={24} /><span>Select a student to prepare the receipt.</span></div>}
          <dl className={styles.breakdown}>
            <div><dt>Monthly Fee</dt><dd>{currency(amount)}</dd></div>
            <div><dt>Discount / Scholarship</dt><dd className={discount > 0 ? styles.discountText : ""}>{discount > 0 ? `−${currency(discount)}` : currency(0)}</dd></div>
            <div className={styles.totalRow}><dt>Final Payable</dt><dd>{currency(finalPayable)}</dd></div>
            <div><dt>Amount Paid</dt><dd className={styles.paidText}>{currency(amountPaid)}</dd></div>
            {paymentMode === "cash_online" ? <><div className={styles.splitBreakdown}><dt>Cash Portion</dt><dd>{currency(cashAmount)}</dd></div><div className={styles.splitBreakdown}><dt>Online Portion</dt><dd>{currency(onlineAmount)}</dd></div></> : null}
            <div><dt>Pending Amount</dt><dd className={pendingAmount > 0 ? styles.pendingText : styles.paidText}>{currency(pendingAmount)}</dd></div>
          </dl>
          <div className={`${styles.statusPanel} ${styles[`status${paymentStatus.key[0].toUpperCase()}${paymentStatus.key.slice(1)}`]}`}><CheckCircle2 size={22} /><strong>{paymentStatus.label}</strong></div>
          <div className={styles.summaryMeta}><p><CalendarDays size={15} /><span>Fee Period</span><strong>{selectedMonthLabel} {feeYear}</strong></p><p><FileText size={15} /><span>Receipt</span><strong>Generated automatically</strong></p><p><Banknote size={15} /><span>Mode</span><strong>{PAYMENT_MODES.find((mode) => mode.value === paymentMode)?.label}</strong></p></div>
          <button className={styles.submitButton} type="submit" disabled={saving || loadingStudents}><ReceiptText size={17} />{saving ? "Collecting Fee..." : "Collect Fee & Generate Receipt"}<ArrowRight size={16} /></button>
          <button className={styles.resetButton} type="button" onClick={resetForm} disabled={saving}><RotateCcw size={15} />Reset Form</button>
          <footer><ShieldCheck size={15} /><span><strong>Secure academy record</strong>Payment and receipt details are stored safely.</span><LockKeyhole size={13} /></footer>
        </aside>
      </form>
    </div>
  );
};

export default CollectFee;
