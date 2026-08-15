import { useEffect, useState } from "react";
import { billingApi } from "../../api/billingApi.js";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const response = await billingApi.getPayments();
        setPayments(response.data?.data?.payments || []);
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  if (loading) return <div className="card">Loading payments...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Payment History</h1>
          <p>View all subscription payments.</p>
        </div>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Plan</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Provider</th>
              <th>Order ID</th>
              <th>Payment ID</th>
            </tr>
          </thead>

          <tbody>
            {payments.length === 0 ? (
              <tr>
                <td colSpan="7">No payments found.</td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment._id}>
                  <td>{new Date(payment.createdAt).toLocaleString()}</td>
                  <td>{payment.plan?.name || payment.metadata?.planCode || "-"}</td>
                  <td>₹{payment.amount}</td>
                  <td>{payment.status}</td>
                  <td>{payment.provider}</td>
                  <td>{payment.razorpayOrderId || "-"}</td>
                  <td>{payment.razorpayPaymentId || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PaymentHistory;