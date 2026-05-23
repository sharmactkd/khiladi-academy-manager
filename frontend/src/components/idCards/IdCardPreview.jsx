import QRCode from "qrcode";
import { useEffect, useState } from "react";

const IdCardPreview = ({ idCard }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    const generateQr = async () => {
      if (!idCard?.qrCodeData) return;

      try {
        const url = await QRCode.toDataURL(idCard.qrCodeData);
        setQrCodeUrl(url);
      } catch {
        setQrCodeUrl("");
      }
    };

    generateQr();
  }, [idCard]);

  if (!idCard) {
    return <div className="card">No ID card selected.</div>;
  }

  const student = idCard.student || {};
  const template = idCard.template || {};

  return (
    <div
      className="id-card-preview"
      style={{
        backgroundColor: template.backgroundColor || "#ffffff",
        color: template.textColor || "#111827",
      }}
    >
      <div className="id-card-header">
        {template.logo ? <img src={template.logo} alt="Academy Logo" /> : null}
        <div>
          <h2>STUDENT ID CARD</h2>
          <p>{template.templateName || "Academy ID Card"}</p>
        </div>
      </div>

      <div className="id-card-body">
        <div className="id-card-photo">
          {student.photo ? <img src={student.photo} alt={student.name} /> : "PHOTO"}
        </div>

        <div className="id-card-details">
          <h3>{student.name}</h3>
          <p>Code: {student.studentCode || "-"}</p>
          <p>Belt: {student.beltRank || "-"}</p>
          <p>Phone: {student.phone || "-"}</p>
          <p>Card No: {idCard.cardNumber}</p>
          <p>
            Valid Till:{" "}
            {idCard.validTill
              ? new Date(idCard.validTill).toLocaleDateString()
              : "-"}
          </p>
        </div>
      </div>

      <div className="id-card-footer">
        {qrCodeUrl ? <img src={qrCodeUrl} alt="QR Code" /> : null}
        <span>Status: {idCard.status}</span>
      </div>
    </div>
  );
};

export default IdCardPreview;