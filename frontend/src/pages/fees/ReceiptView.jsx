import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { feePaymentApi } from "../../api/feeApi.js";

const ReceiptView = () => {
  const { paymentId } = useParams();
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const response = await feePaymentApi.getById(paymentId);
        setPayment(response.data?.data?.feePayment);
      } catch (error) {
        toast.error(error.response?.data?.message || "Receipt load nahi hui");
      }
    };

    fetchPayment();
  }, [paymentId]);

  if (!payment) return <p>Loading receipt...</p>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Fee Receipt</h1>
          <p>{payment.receiptNumber || payment._id}</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="card receipt-card">
        <h2>KHILADI Academy Manager</h2>
        <p>Fee Payment Receipt</p>

        <hr />

        <div className="details-grid">
          <p><strong>Receipt No:</strong> {payment.receiptNumber || "-"}</p>
          <p><strong>Student:</strong> {payment.student?.name || "-"}</p>
          <p><strong>Student Code:</strong> {payment.student?.studentCode || "-"}</p>
          <p><strong>Phone:</strong> {payment.student?.phone || "-"}</p>
          <p><strong>Month:</strong> {payment.month}</p>
          <p><strong>Fee Plan:</strong> {payment.feePlan?.name || "-"}</p>
          <p><strong>Amount:</strong> ₹{payment.amount}</p>
          <p><strong>Discount:</strong> ₹{payment.discount}</p>
          <p><strong>Final Amount:</strong> ₹{payment.finalAmount}</p>
          <p><strong>Status:</strong> {payment.status}</p>
          <p><strong>Payment Mode:</strong> {payment.paymentMode}</p>
          <p>
            <strong>Paid Date:</strong>{" "}
            {payment.paidDate
              ? new Date(payment.paidDate).toLocaleDateString()
              : "-"}
          </p>
        </div>

        <hr />

        <p><strong>Note:</strong> {payment.note || "-"}</p>
      </div>
    </div>
  );
};

export default ReceiptView;