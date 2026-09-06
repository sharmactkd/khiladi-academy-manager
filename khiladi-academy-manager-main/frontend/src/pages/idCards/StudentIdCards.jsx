import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { idCardApi } from "../../api/idCardApi.js";

const StudentIdCards = () => {
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [idCards, setIdCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const response = await idCardApi.getByStudent(studentId);
        setStudent(response.data?.data?.student || null);
        setIdCards(response.data?.data?.idCards || []);
      } finally {
        setLoading(false);
      }
    };

    loadCards();
  }, [studentId]);

  if (loading) return <div className="card">Loading student ID cards...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Student ID Cards</h1>
          <p>{student?.name || "Student"} generated ID cards.</p>
        </div>

        <Link className="btn btn-secondary" to={`/students/${studentId}`}>
          Back to Student
        </Link>
      </div>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Card Number</th>
              <th>Template</th>
              <th>Issued Date</th>
              <th>Valid Till</th>
              <th>Status</th>
              <th>Print</th>
            </tr>
          </thead>

          <tbody>
            {idCards.length === 0 ? (
              <tr>
                <td colSpan="6">No ID cards found.</td>
              </tr>
            ) : (
              idCards.map((card) => (
                <tr key={card._id}>
                  <td>{card.cardNumber}</td>
                  <td>{card.template?.templateName || "-"}</td>
                  <td>{new Date(card.issuedDate).toLocaleDateString()}</td>
                  <td>
                    {card.validTill
                      ? new Date(card.validTill).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{card.status}</td>
                  <td>
                    <Link to={`/id-cards/${card._id}/print`}>Print</Link>
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

export default StudentIdCards;