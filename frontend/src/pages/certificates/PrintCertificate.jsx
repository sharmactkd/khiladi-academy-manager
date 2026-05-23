import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { certificateApi } from "../../api/certificateApi.js";
import CertificatePreview from "../../components/certificates/CertificatePreview.jsx";

const PrintCertificate = () => {
  const { id } = useParams();
  const printRef = useRef(null);

  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCertificate = async () => {
      try {
        const response = await certificateApi.getById(id);
        setCertificate(response.data?.data?.certificate || null);
      } finally {
        setLoading(false);
      }
    };

    loadCertificate();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="card">Loading certificate...</div>;

  return (
    <div className="page print-page">
      <div className="page-header no-print">
        <div>
          <h1>Print Certificate</h1>
          <p>Use browser print or save as PDF.</p>
        </div>

        <button className="btn btn-primary" onClick={handlePrint}>
          Print
        </button>
      </div>

      <div ref={printRef} className="print-area">
        <CertificatePreview certificate={certificate} />
      </div>
    </div>
  );
};

export default PrintCertificate;