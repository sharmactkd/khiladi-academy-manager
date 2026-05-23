import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { parentPortalApi } from "../../api/parentPortalApi.js";
import TimelineList from "../../components/timeline/TimelineList.jsx";

const ParentStudentProgress = () => {
  const { studentId } = useParams();

  const [data, setData] = useState({
    beltTests: [],
    championshipRecords: [],
    timeline: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const response = await parentPortalApi.getStudentProgress(studentId);
        setData(response.data?.data || data);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  if (loading) return <div className="card">Loading progress...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Progress</h1>
          <p>Belt tests, championships and timeline.</p>
        </div>

        <Link className="btn btn-secondary" to={`/parent/students/${studentId}`}>
          Back to Profile
        </Link>
      </div>

      <div className="card table-card">
        <h2>Belt Tests</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Current Belt</th>
              <th>Promoted To</th>
              <th>Result</th>
            </tr>
          </thead>

          <tbody>
            {data.beltTests?.length ? (
              data.beltTests.map((item) => (
                <tr key={item._id}>
                  <td>{new Date(item.testDate).toLocaleDateString()}</td>
                  <td>{item.currentBelt}</td>
                  <td>{item.promotedToBelt}</td>
                  <td>{item.result}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No belt tests found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card table-card">
        <h2>Championship Records</h2>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Championship</th>
              <th>Level</th>
              <th>Result</th>
            </tr>
          </thead>

          <tbody>
            {data.championshipRecords?.length ? (
              data.championshipRecords.map((item) => (
                <tr key={item._id}>
                  <td>{new Date(item.date).toLocaleDateString()}</td>
                  <td>{item.championshipName}</td>
                  <td>{item.level}</td>
                  <td>{item.result}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4">No championship records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TimelineList timeline={data.timeline || []} />
    </div>
  );
};

export default ParentStudentProgress;