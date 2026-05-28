import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { feePaymentApi } from "../../api/feeApi.js";

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getStudentName = (student) =>
  `${student?.firstName || ""} ${student?.lastName || ""}`.trim();

const StudentFeeHistory = () => {
  const { studentId } = useParams();

  const [data, setData] = useState({
    student: null,
    currentStatus: null,
    payments: [],
  });

  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);

      const response = await feePaymentApi.getStudentHistory(studentId);
      setData(response.data?.data || {});
    } catch (error) {
      toast.error(error.response?.data?.message || "Fee history load nahi hui");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [studentId]);

  if (loading) return <p>Loading fee history...</p>;

  const student = data.student;
  const currentStatus = data.currentStatus;
  const payments = data.payments || [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Student Fee History</h1>
          <p>
            {getStudentName(student)}{" "}
            {student?.admissionNumber ? `(${student.admissionNumber})` : ""}
          </p>
        </div>

        <Link
          className="btn btn-primary"
          to={`/fees/collect?student=${student?._id}`}
        >
          Collect Fee
        </Link>
      </div>

      <div className="grid grid-4">
        <div className="card stat-card">
          <span>Current Fee</span>
          <strong>{currency(currentStatus?.payableAmount)}</strong>
        </div>

        <div className="card stat-card">
          <span>Paid</span>
          <strong>{currency(currentStatus?.paidAmount)}</strong>
        </div>

        <div className="card stat-card">
          <span>Pending</span>
          <strong>{currency(currentStatus?.pendingAmount)}</strong>
        </div>

        <div className="card stat-card">
          <span>Status</span>
          <strong>{currentStatus?.status || "-"}</strong>
        </div>
      </div>

      <div className="card">
        <h2>Student Details</h2>

        <div className="details-grid">
          <p>
            <strong>Name:</strong> {getStudentName(student) || "-"}
          </p>
          <p>
            <strong>Admission No:</strong> {student?.admissionNumber || "-"}
          </p>
          <p>
            <strong>Phone:</strong> {student?.phone || "-"}
          </p>
          <p>
            <strong>Batch:</strong> {student?.batch?.batchName || "-"}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="page-header">
          <div>
            <h2>Payment History</h2>
            <p>Student ke saare fee records</p>
          </div>
        </div>

        {!payments.length ? (
          <p>No payment history found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Discount</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>Mode</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Receipt</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{payment.receiptNumber || "-"}</td>
                    <td>
                      {payment.feeMonth}/{payment.feeYear}
                    </td>
                    <td>{currency(payment.amount)}</td>
                    <td>{currency(payment.discount)}</td>
                    <td>{currency(payment.amountPaid)}</td>
                    <td>{currency(payment.pendingAmount)}</td>
                    <td>{payment.paymentMode || "-"}</td>
                    <td>
                      {payment.paymentDate
                        ? new Date(payment.paymentDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      <span className={`badge badge-${payment.status}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      <Link to={`/fees/receipt/${payment._id}`}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentFeeHistory;