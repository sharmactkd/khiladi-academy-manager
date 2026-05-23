import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { idCardApi } from "../../api/idCardApi.js";
import IdCardPreview from "../../components/idCards/IdCardPreview.jsx";

const PrintIdCard = () => {
  const { id } = useParams();
  const printRef = useRef(null);

  const [idCard, setIdCard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCard = async () => {
      try {
        const response = await idCardApi.getById(id);
        setIdCard(response.data?.data?.idCard || null);
      } finally {
        setLoading(false);
      }
    };

    loadCard();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="card">Loading ID card...</div>;

  return (
    <div className="page print-page">
      <div className="page-header no-print">
        <div>
          <h1>Print ID Card</h1>
          <p>Use browser print or save as PDF.</p>
        </div>

        <button className="btn btn-primary" onClick={handlePrint}>
          Print
        </button>
      </div>

      <div ref={printRef} className="print-area">
        <IdCardPreview idCard={idCard} />
      </div>
    </div>
  );
};

export default PrintIdCard;