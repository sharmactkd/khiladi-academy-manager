import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { feePaymentApi } from "../../api/feeApi.js";

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getStudentName = (student) =>
  `${student?.firstName || ""} ${student?.lastName || ""}`.trim();

const ReceiptView = () => {
  const { paymentId } = useParams();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReceipt = async () => {
    try {
      setLoading(true);

      const response = await feePaymentApi.getReceipt(paymentId);
      setPayment(response.data?.data || null);
    } catch (error) {
      toast.error(error.response?.data?.message || "Receipt load nahi hui");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, [paymentId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <p>Loading receipt...</p>;
  if (!payment) return <p>Receipt not found.</p>;

  return (
    <div className="page">
      <div className="page-header no-print">
        <div>
          <h1>Fee Receipt</h1>
          <p>{payment.receiptNumber || "-"}</p>
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={handlePrint}>
            Print Receipt
          </button>

          <button
            className="btn"
            onClick={() => toast("WhatsApp share placeholder hai")}
          >
            WhatsApp Share
          </button>

          <Link className="btn" to="/fees/payments">
            Back
          </Link>
        </div>
      </div>

      <div className="card receipt-card">
        <div className="receipt-header">
          <div>
            <h2>KHILADI Academy Manager</h2>
            <p>Official Fee Receipt</p>
          </div>

          <div>
            <strong>Receipt No.</strong>
            <p>{payment.receiptNumber || "-"}</p>
          </div>
        </div>

        <hr />

        <div className="details-grid">
          <p>
            <strong>Student:</strong> {getStudentName(payment.student) || "-"}
          </p>
          <p>
            <strong>Admission No:</strong>{" "}
            {payment.student?.admissionNumber || "-"}
          </p>
          <p>
            <strong>Phone:</strong> {payment.student?.phone || "-"}
          </p>
          <p>
            <strong>Batch:</strong> {payment.batch?.batchName || "-"}
          </p>
          <p>
            <strong>Fee Month:</strong> {payment.feeMonth}/{payment.feeYear}
          </p>
          <p>
            <strong>Payment Date:</strong>{" "}
            {payment.paymentDate
              ? new Date(payment.paymentDate).toLocaleDateString()
              : "-"}
          </p>
          <p>
            <strong>Payment Mode:</strong> {payment.paymentMode || "-"}
          </p>
          <p>
            <strong>Status:</strong> {payment.status || "-"}
          </p>
        </div>

        <div className="receipt-total-box">
          <p>
            <span>Monthly Fee</span>
            <strong>{currency(payment.amount)}</strong>
          </p>
          <p>
            <span>Discount</span>
            <strong>{currency(payment.discount)}</strong>
          </p>
          <p>
            <span>Final Payable</span>
            <strong>{currency(payment.finalAmount)}</strong>
          </p>
          <p>
            <span>Amount Paid</span>
            <strong>{currency(payment.amountPaid)}</strong>
          </p>
          <p>
            <span>Pending</span>
            <strong>{currency(payment.pendingAmount)}</strong>
          </p>
        </div>

        <p>
          <strong>Notes:</strong> {payment.notes || payment.note || "-"}
        </p>

        <div className="receipt-footer">
          <div>
            <p>Received By</p>
            <strong>{payment.collectedBy?.name || "-"}</strong>
          </div>

          <div>
            <p>Authorized Signature</p>
            <strong>________________</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptView;