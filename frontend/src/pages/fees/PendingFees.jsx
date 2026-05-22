import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { feePaymentApi } from "../../api/feeApi.js";

const PendingFees = () => {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const response = await feePaymentApi.getAll({ status: "pending" });
        setPayments(response.data?.data?.feePayments || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Pending fees load nahi hui");
      }
    };

    fetchPending();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Pending Fees</h1>
          <p>Pending student payments</p>
        </div>
      </div>

      <div className="card">
        {payments.length === 0 ? (
          <p>No pending fees found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Phone</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>
                      <Link to={`/fees/student/${payment.student?._id}`}>
                        {payment.student?.name || "-"}
                      </Link>
                    </td>
                    <td>{payment.student?.phone || "-"}</td>
                    <td>{payment.month}</td>
                    <td>₹{payment.finalAmount}</td>
                    <td>
                      {payment.dueDate
                        ? new Date(payment.dueDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>
                      <Link to={`/fees/receipt/${payment._id}`}>
                        View
                      </Link>
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

export default PendingFees;