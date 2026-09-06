import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { certificateApi } from "../../api/certificateApi.js";

const StudentCertificates = () => {
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCertificates = async () => {
      try {
        const response = await certificateApi.getByStudent(studentId);
        setStudent(response.data?.data?.student || null);
        setCertificates(response.data?.data?.certificates || []);
      } finally {
        setLoading(false);
      }
    };

    loadCertificates();
  }, [studentId]);

  if (loading) return <div className="card">Loading student certificates...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Student Certificates</h1>
          <p>{student?.name || "Student"} generated certificates.</p>
        </div>

        <Link className="btn btn-secondary" to={`/students/${studentId}`}>
          Back to Student
        </Link>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Certificate No</th>
              <th>Type</th>
              <th>Template</th>
              <th>Issue Date</th>
              <th>Status</th>
              <th>Print</th>
            </tr>
          </thead>

          <tbody>
            {certificates.length === 0 ? (
              <tr>
                <td colSpan="6">No certificates found.</td>
              </tr>
            ) : (
              certificates.map((certificate) => (
                <tr key={certificate._id}>
                  <td>{certificate.certificateNumber}</td>
                  <td>{certificate.certificateType}</td>
                  <td>{certificate.template?.templateName || "-"}</td>
                  <td>{new Date(certificate.issueDate).toLocaleDateString()}</td>
                  <td>{certificate.status}</td>
                  <td>
                    <Link to={`/certificates/${certificate._id}/print`}>
                      Print
                    </Link>
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

export default StudentCertificates;