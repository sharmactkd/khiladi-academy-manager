import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

import { studentApi } from "../../api/studentApi.js";
import { feePaymentApi } from "../../api/feeApi.js";

const paymentModes = [
  "cash",
  "upi",
  "bank",
  "card",
  "online",
  "other",
];

const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Date(2000, index, 1).toLocaleString("en-US", {
    month: "long",
  }),
}));

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const CollectFee = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const now = new Date();

  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      student: searchParams.get("student") || "",
      feeMonth:
        Number(searchParams.get("month")) || now.getMonth() + 1,
      feeYear:
        Number(searchParams.get("year")) || now.getFullYear(),
      amount: "",
      discount: 0,
      amountPaid: "",
      paymentDate: new Date().toISOString().slice(0, 10),
      paymentMode: "cash",
      notes: "",
    },
  });

  const selectedStudentId = watch("student");
  const amount = Number(watch("amount") || 0);
  const discount = Number(watch("discount") || 0);
  const amountPaid = Number(watch("amountPaid") || 0);

  const finalPayable = Math.max(amount - discount, 0);
  const pendingAmount = Math.max(finalPayable - amountPaid, 0);

  const selectedStudent = useMemo(
    () =>
      students.find((student) => student._id === selectedStudentId),
    [students, selectedStudentId]
  );

  const fetchStudents = async () => {
    try {
      setLoadingStudents(true);

     const response = await studentApi.getAll({
  status: "active",
});

const list = Array.isArray(response?.data)
  ? response.data
  : response?.data?.students || response?.data?.data || [];

setStudents(Array.isArray(list) ? list : []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Students load nahi hue"
      );
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!selectedStudent) return;

    const overrideAmount =
      Number(selectedStudent.monthlyFeeOverride || 0) || 0;

    if (overrideAmount > 0) {
      setValue("amount", overrideAmount);
      setValue("amountPaid", overrideAmount);
    }
  }, [selectedStudent, setValue]);

  const onSubmit = async (values) => {
    try {
      setSaving(true);

      await feePaymentApi.collect({
        ...values,
        amount: Number(values.amount || 0),
        discount: Number(values.discount || 0),
        amountPaid: Number(values.amountPaid || 0),
        feeMonth: Number(values.feeMonth),
        feeYear: Number(values.feeYear),
      });

      toast.success("Fee collected successfully");

      navigate("/fees/payments");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Fee collect nahi hui"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Collect Fee</h1>
          <p>Student fee collect karein aur receipt generate karein</p>
        </div>

        <Link className="btn" to="/fees/payments">
          Payment History
        </Link>
      </div>

      <form className="card form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-3">
          <label>
            Student *
            <select
              {...register("student", {
                required: "Student required",
              })}
            >
              <option value="">
                {loadingStudents
                  ? "Loading students..."
                  : "Select Student"}
              </option>

              {students.map((student) => {
                const fullName = `${student.firstName || ""} ${
                  student.lastName || ""
                }`.trim();

                return (
                  <option key={student._id} value={student._id}>
                    {fullName} ({student.admissionNumber})
                  </option>
                );
              })}
            </select>

            {errors.student && (
              <small>{errors.student.message}</small>
            )}
          </label>

          <label>
            Month *
            <select
              {...register("feeMonth", {
                required: "Month required",
              })}
            >
              {monthOptions.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Year *
            <input
              type="number"
              {...register("feeYear", {
                required: "Year required",
              })}
            />
          </label>

          <label>
            Monthly Fee *
            <input
              type="number"
              step="0.01"
              {...register("amount", {
                required: "Amount required",
                min: 0,
              })}
            />
          </label>

          <label>
            Discount / Scholarship
            <input
              type="number"
              step="0.01"
              {...register("discount")}
            />
          </label>

          <label>
            Final Payable
            <input value={currency(finalPayable)} disabled />
          </label>

          <label>
            Amount Paid *
            <input
              type="number"
              step="0.01"
              {...register("amountPaid", {
                required: "Amount paid required",
                min: 0,
              })}
            />
          </label>

          <label>
            Pending Amount
            <input value={currency(pendingAmount)} disabled />
          </label>

          <label>
            Payment Date *
            <input
              type="date"
              {...register("paymentDate", {
                required: "Payment date required",
              })}
            />
          </label>

          <label>
            Payment Mode *
            <select
              {...register("paymentMode", {
                required: "Payment mode required",
              })}
            >
              {paymentModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <label>
            Status
            <input
              disabled
              value={
                pendingAmount <= 0
                  ? "Paid"
                  : amountPaid > 0
                    ? "Partial"
                    : "Due"
              }
            />
          </label>

          <label>
            Batch
            <input
              disabled
              value={selectedStudent?.batch?.batchName || "-"}
            />
          </label>
        </div>

        <label>
          Notes
          <textarea {...register("notes")} />
        </label>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => reset()}
          >
            Reset
          </button>

          <button
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? "Saving..." : "Collect Fee"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CollectFee;