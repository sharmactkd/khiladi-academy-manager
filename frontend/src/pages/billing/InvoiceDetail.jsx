import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, Printer } from "lucide-react";
import { billingApi } from "../../api/billingApi.js";
import InvoicePreview from "../../components/billing/InvoicePreview.jsx";
import styles from "./InvoiceDetail.module.css";

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

  if (loading) return <div className={styles.loading}>Loading invoice...</div>;

  return (
    <div className={`page print-page ${styles.page}`}>
      <nav className={`${styles.breadcrumb} no-print`}><Link to="/billing?tab=invoices">Invoices</Link><ChevronRight size={13}/><strong>{invoice?.invoiceNumber || "Invoice"}</strong></nav><div className={`${styles.header} no-print`}><div><small>KHILADI BILLING DOCUMENT</small><h1>Invoice Detail</h1><p>Review, print or save this subscription invoice as PDF.</p></div><button type="button" onClick={() => window.print()}><Printer size={16}/>Print / Save PDF</button></div>
      <div className={`${styles.invoice} print-area`}>
        <InvoicePreview invoice={invoice} />
      </div>
    </div>
  );
};

export default InvoiceDetail;
