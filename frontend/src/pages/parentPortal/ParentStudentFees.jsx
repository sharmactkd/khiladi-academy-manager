import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { parentPortalApi } from "../../api/parentPortalApi.js";

const ParentStudentFees = () => {
  const { studentId } = useParams();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFees = async () => {
      try {
        const response = await parentPortalApi.getStudentFees(studentId);
        setPayments(response.data?.data?.payments || []);
      } finally {
        setLoading(false);
      }
    };

    loadFees();
  }, [studentId]);

  if (loading) return <div className="card">Loading fees...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Fee History</h1>
          <p>Parent-safe fee payment records.</p>
        </div>

        <Link className="btn btn-secondary" to={`/parent/students/${studentId}`}>
          Back to Profile
        </Link>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Amount</th>
              <th>Discount</th>
              <th>Final Amount</th>
              <th>Status</th>
              <th>Paid Date</th>
              <th>Receipt</th>
            </tr>
          </thead>

          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="7">No fee records found.</td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment._id}>
                  <td>{payment.month}</td>
                  <td>₹{payment.amount}</td>
                  <td>₹{payment.discount}</td>
                  <td>₹{payment.finalAmount}</td>
                  <td>{payment.status}</td>
                  <td>
                    {payment.paidDate
                      ? new Date(payment.paidDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{payment.receiptNumber || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParentStudentFees;