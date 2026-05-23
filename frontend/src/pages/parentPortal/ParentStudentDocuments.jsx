import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { parentPortalApi } from "../../api/parentPortalApi.js";

const ParentStudentDocuments = () => {
  const { studentId } = useParams();

  const [documents, setDocuments] = useState({
    idCards: [],
    certificates: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await parentPortalApi.getStudentDocuments(studentId);
        setDocuments(response.data?.data || documents);
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  if (loading) return <div className="card">Loading documents...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Documents</h1>
          <p>ID cards and certificates.</p>
        </div>

        <Link className="btn btn-secondary" to={`/parent/students/${studentId}`}>
          Back to Profile
        </Link>
      </div>

      <div className="card table-card">
        <h2>ID Cards</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Card Number</th>
              <th>Issued Date</th>
              <th>Valid Till</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {documents.idCards?.length ? (
              documents.idCards.map((card) => (
                <tr key={card._id}>
                  <td>{card.cardNumber}</td>
                  <td>{new Date(card.issuedDate).toLocaleDateString()}</td>
                  <td>
                    {card.validTill
                      ? new Date(card.validTill).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{card.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No ID cards found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card table-card">
        <h2>Certificates</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Certificate Number</th>
              <th>Type</th>
              <th>Issue Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {documents.certificates?.length ? (
              documents.certificates.map((certificate) => (
                <tr key={certificate._id}>
                  <td>{certificate.certificateNumber}</td>
                  <td>{certificate.certificateType}</td>
                  <td>{new Date(certificate.issueDate).toLocaleDateString()}</td>
                  <td>{certificate.status}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No certificates found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ParentStudentDocuments;