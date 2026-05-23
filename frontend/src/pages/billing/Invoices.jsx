import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { billingApi } from "../../api/billingApi.js";

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const response = await billingApi.getInvoices();
        setInvoices(response.data?.data?.invoices || []);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, []);

  if (loading) return <div className="card">Loading invoices...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Invoices</h1>
          <p>View subscription invoices.</p>
        </div>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Amount</th>
              <th>Tax</th>
              <th>Total</th>
              <th>Status</th>
              <th>Issued</th>
              <th>View</th>
            </tr>
          </thead>

          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td colSpan="7">No invoices found.</td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice._id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>₹{invoice.amount}</td>
                  <td>₹{invoice.tax}</td>
                  <td>₹{invoice.total}</td>
                  <td>{invoice.status}</td>
                  <td>
                    {invoice.issuedAt
                      ? new Date(invoice.issuedAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    <Link to={`/billing/invoices/${invoice._id}`}>View</Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Invoices;