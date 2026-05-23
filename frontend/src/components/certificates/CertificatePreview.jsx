const CertificatePreview = ({ certificate }) => {
  if (!certificate) {
    return <div className="card">No certificate selected.</div>;
  }

  const student = certificate.student || {};
  const template = certificate.template || {};

  return (
    <div
      className="certificate-preview"
      style={{
        backgroundImage: template.backgroundImage
          ? `url(${template.backgroundImage})`
          : "none",
      }}
    >
      <div className="certificate-inner">
        <p className="certificate-small">Certificate of</p>
        <h1>{certificate.certificateType}</h1>

        <p className="certificate-small">This is proudly presented to</p>
        <h2>{student.name}</h2>

        <p>For successful completion / achievement recorded by the academy.</p>

        <div className="certificate-meta">
          <span>Certificate No: {certificate.certificateNumber}</span>
          <span>
            Issue Date:{" "}
            {certificate.issueDate
              ? new Date(certificate.issueDate).toLocaleDateString()
              : "-"}
          </span>
        </div>

        <div className="certificate-sign-row">
          <div>
            <strong>Authorized Signature</strong>
            <span>Academy</span>
          </div>

          <div>
            <strong>{template.templateName || "Certificate Template"}</strong>
            <span>Status: {certificate.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificatePreview;