import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { feePaymentApi } from "../../api/feeApi.js";

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    month: "",
    year: "",
    paymentMode: "",
    status: "",
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);

      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) =>
          String(value || "").trim()
        )
      );

      const response =
        await feePaymentApi.getPayments(cleanFilters);

      setPayments(response.data?.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Payments load nahi hue"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [
    filters.month,
    filters.year,
    filters.paymentMode,
    filters.status,
  ]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Payment History</h1>
          <p>All fee collection records</p>
        </div>

        <Link className="btn btn-primary" to="/fees/collect">
          Collect Fee
        </Link>
      </div>

      <div className="card">
        <div className="grid grid-4">
          <input
            placeholder="Month"
            value={filters.month}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                month: event.target.value,
              }))
            }
          />

          <input
            placeholder="Year"
            value={filters.year}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                year: event.target.value,
              }))
            }
          />

          <select
            value={filters.paymentMode}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                paymentMode: event.target.value,
              }))
            }
          >
            <option value="">All Modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank</option>
            <option value="card">Card</option>
            <option value="online">Online</option>
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value,
              }))
            }
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="due">Due</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading payments...</p>
        ) : payments.length === 0 ? (
          <p>No payments found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Student</th>
                  <th>Month</th>
                  <th>Amount</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>Mode</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => {
                  const studentName = `${
                    payment.student?.firstName || ""
                  } ${
                    payment.student?.lastName || ""
                  }`.trim();

                  return (
                    <tr key={payment._id}>
                      <td>{payment.receiptNumber || "-"}</td>

                      <td>
                        {studentName || "-"}
                        <br />
                        <small>
                          {payment.student?.admissionNumber ||
                            ""}
                        </small>
                      </td>

                      <td>
                        {payment.feeMonth}/
                        {payment.feeYear}
                      </td>

                      <td>{currency(payment.finalAmount)}</td>

                      <td>{currency(payment.amountPaid)}</td>

                      <td>
                        {currency(payment.pendingAmount)}
                      </td>

                      <td>{payment.paymentMode || "-"}</td>

                      <td>
                        {payment.paymentDate
                          ? new Date(
                              payment.paymentDate
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        <span
                          className={`badge badge-${payment.status}`}
                        >
                          {payment.status}
                        </span>
                      </td>

                      <td className="actions">
                        <Link
                          to={`/fees/receipt/${payment._id}`}
                        >
                          Receipt
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;