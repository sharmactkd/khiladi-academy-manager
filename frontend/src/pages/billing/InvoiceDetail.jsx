import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { billingApi } from "../../api/billingApi.js";
import InvoicePreview from "../../components/billing/InvoicePreview.jsx";

const InvoiceDetail = () => {
  const { id } = useParams();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const response = await billingApi.getInvoiceById(id);
        setInvoice(response.data?.data?.invoice || null);
      } finally {
        setLoading(false);
      }
    };

    loadInvoice();
  }, [id]);

  if (loading) return <div className="card">Loading invoice...</div>;

  return (
    <div className="page print-page">
      <div className="page-header no-print">
        <div>
          <h1>Invoice Detail</h1>
          <p>Print or save invoice as PDF.</p>
        </div>

        <button className="btn btn-primary" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <div className="card print-area">
        <InvoicePreview invoice={invoice} />
      </div>
    </div>
  );
};

export default InvoiceDetail;