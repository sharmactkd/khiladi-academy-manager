const InvoicePreview = ({ invoice }) => {
  if (!invoice) return <div className="card">Invoice not found.</div>;

  return (
    <div className="invoice-preview">
      <div className="invoice-header">
        <div>
          <h1>KHILADI</h1>
          <p>Academy Manager Invoice</p>
        </div>

        <div>
          <h2>{invoice.invoiceNumber}</h2>
          <p>Status: {invoice.status}</p>
        </div>
      </div>

      <div className="invoice-grid">
        <div>
          <h3>Billed To</h3>
          <p>{invoice.billingName || "-"}</p>
          <p>{invoice.billingEmail || "-"}</p>
          <p>{invoice.billingPhone || "-"}</p>
          <p>{invoice.billingAddress || "-"}</p>
        </div>

        <div>
          <h3>Invoice Details</h3>
          <p>
            Issued:{" "}
            {invoice.issuedAt
              ? new Date(invoice.issuedAt).toLocaleDateString()
              : "-"}
          </p>
          <p>
            Paid:{" "}
            {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : "-"}
          </p>
          <p>Currency: {invoice.currency}</p>
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Amount</th>
            <th>Total</th>
          </tr>
        </thead>

        <tbody>
          {(invoice.lineItems || []).map((item, index) => (
            <tr key={`${item.name}-${index}`}>
              <td>{item.name}</td>
              <td>{item.description}</td>
              <td>{item.quantity}</td>
              <td>₹{item.amount}</td>
              <td>₹{item.total}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="invoice-total">
        <p>Amount: ₹{invoice.amount}</p>
        <p>Tax: ₹{invoice.tax}</p>
        <h2>Total: ₹{invoice.total}</h2>
      </div>
    </div>
  );
};

export default InvoicePreview;