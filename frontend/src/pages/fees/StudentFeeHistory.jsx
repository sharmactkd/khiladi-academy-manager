import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { feePaymentApi } from "../../api/feeApi.js";

const StudentFeeHistory = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await feePaymentApi.getStudentHistory(studentId);
        setStudent(response.data?.data?.student);
        setPayments(response.data?.data?.feePayments || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Fee history load nahi hui");
      }
    };

    fetchHistory();
  }, [studentId]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Fee History</h1>
          <p>{student?.name || "Student fee records"}</p>
        </div>
      </div>

      <div className="card">
        {payments.length === 0 ? (
          <p>No fee history found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Month</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Discount</th>
                  <th>Final</th>
                  <th>Status</th>
                  <th>Mode</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>
                      <Link to={`/fees/receipt/${payment._id}`}>
                        {payment.receiptNumber || "-"}
                      </Link>
                    </td>
                    <td>{payment.month}</td>
                    <td>{payment.feePlan?.name || "-"}</td>
                    <td>₹{payment.amount}</td>
                    <td>₹{payment.discount}</td>
                    <td>₹{payment.finalAmount}</td>
                    <td>{payment.status}</td>
                    <td>{payment.paymentMode}</td>
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