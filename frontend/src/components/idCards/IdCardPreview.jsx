import QRCode from "qrcode";
import { useEffect, useState } from "react";
import {
  getFileUrl,
  getStudentPhotoUrl,
} from "../../utils/fileUrl.js";

const getStudentName = (student) => {
  const fullName = `${student?.firstName || ""} ${student?.lastName || ""}`.trim();
  return student?.name || fullName || "-";
};

const getStudentCode = (student) => {
  return student?.studentCode || student?.admissionNumber || "-";
};

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

  const studentPhotoUrl = getStudentPhotoUrl(student, "");
  const logoUrl = getFileUrl(template.logo, "");

  return (
    <div
      className="id-card-preview"
      style={{
        backgroundColor: template.backgroundColor || "#ffffff",
        color: template.textColor || "#111827",
      }}
    >
      <div className="id-card-header">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Academy Logo"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}

        <div>
          <h2>STUDENT ID CARD</h2>
        </div>
      </div>

      <div className="id-card-body">
        <div className="id-card-photo">
          {studentPhotoUrl ? (
            <img
              src={studentPhotoUrl}
              alt={getStudentName(student)}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            "PHOTO"
          )}
        </div>

        <div className="id-card-details">
          <h3>{getStudentName(student)}</h3>
          <p>Code: {getStudentCode(student)}</p>
          <p>Belt: {student.beltRank || "-"}</p>
          <p>Phone: {student.phone || "-"}</p>
          <p>Card No: {idCard.cardNumber || "-"}</p>
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
        <span>Status: {idCard.status || "-"}</span>
      </div>
    </div>
  );
};

export default IdCardPreview;