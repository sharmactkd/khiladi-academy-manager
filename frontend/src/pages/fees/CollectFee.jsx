import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { studentApi } from "../../api/studentApi.js";
import { feePlanApi, feePaymentApi } from "../../api/feeApi.js";

const currentMonth = new Date().toISOString().slice(0, 7);

const CollectFee = () => {
  const [students, setStudents] = useState([]);
  const [plans, setPlans] = useState([]);
  const { register, handleSubmit, reset, watch, setValue } = useForm({
    defaultValues: {
      month: currentMonth,
      status: "paid",
      paymentMode: "cash",
      discount: 0,
    },
  });

  const selectedPlan = watch("feePlan");
  const amount = Number(watch("amount") || 0);
  const discount = Number(watch("discount") || 0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [studentRes, planRes] = await Promise.all([
          studentApi.getAll({ status: "active", limit: 100 }),
          feePlanApi.getAll({ isActive: true }),
        ]);

        setStudents(studentRes.data?.data?.students || []);
        setPlans(planRes.data?.data?.feePlans || []);
      } catch {
        toast.error("Students/fee plans load nahi hue");
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const plan = plans.find((item) => item._id === selectedPlan);
    if (plan) setValue("amount", plan.amount);
  }, [selectedPlan, plans, setValue]);

  const onSubmit = async (values) => {
    try {
      await feePaymentApi.create({
        ...values,
        amount: Number(values.amount || 0),
        discount: Number(values.discount || 0),
      });

      toast.success("Fee collect ho gayi");
      reset({
        month: currentMonth,
        status: "paid",
        paymentMode: "cash",
        discount: 0,
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Fee collect nahi hui");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Collect Fee</h1>
          <p>Student fee payment record karein</p>
        </div>
      </div>

      <form className="card form" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-3">
          <label>
            Student
            <select {...register("student", { required: true })}>
              <option value="">Select Student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} - {student.studentCode}
                </option>
              ))}
            </select>
          </label>

          <label>
            Fee Plan
            <select {...register("feePlan")}>
              <option value="">No Plan</option>
              {plans.map((plan) => (
                <option key={plan._id} value={plan._id}>
                  {plan.name} - ₹{plan.amount}
                </option>
              ))}
            </select>
          </label>

          <label>
            Month
            <input type="month" {...register("month", { required: true })} />
          </label>

          <label>
            Amount
            <input type="number" min="0" {...register("amount")} />
          </label>

          <label>
            Discount
            <input type="number" min="0" {...register("discount")} />
          </label>

          <label>
            Final Amount
            <input value={Math.max(amount - discount, 0)} readOnly />
          </label>

          <label>
            Status
            <select {...register("status")}>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <label>
            Payment Mode
            <select {...register("paymentMode")}>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank</option>
              <option value="online">Online</option>
              <option value="other">Other</option>
            </select>
          </label>

          <label>
            Due Date
            <input type="date" {...register("dueDate")} />
          </label>

          <label>
            Paid Date
            <input type="date" {...register("paidDate")} />
          </label>

          <label>
            Receipt Number
            <input
              placeholder="Auto generate if blank"
              {...register("receiptNumber")}
            />
          </label>
        </div>

        <label>
          Note
          <textarea {...register("note")} />
        </label>

        <button className="btn btn-primary">Save Payment</button>
      </form>
    </div>
  );
};

export default CollectFee;