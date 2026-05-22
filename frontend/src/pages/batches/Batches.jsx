import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { batchApi } from "../../api/batchApi.js";

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await batchApi.getAll(status ? { status } : {});
      setBatches(response.data?.data?.batches || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Batches load nahi hue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [status]);

  const handleDelete = async (id) => {
    if (!window.confirm("Batch ko inactive karna hai?")) return;

    try {
      await batchApi.remove(id);
      toast.success("Batch inactive ho gaya");
      fetchBatches();
    } catch (error) {
      toast.error(error.response?.data?.message || "Batch inactive nahi hua");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Batches</h1>
          <p>Classes aur training batches manage karein</p>
        </div>
        <Link className="btn btn-primary" to="/batches/new">
          Add Batch
        </Link>
      </div>

      <div className="card">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading batches...</p>
        ) : batches.length === 0 ? (
          <p>No batches found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Martial Art</th>
                  <th>Days</th>
                  <th>Time</th>
                  <th>Students</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr key={batch._id}>
                    <td>{batch.batchName}</td>
                    <td>{batch.martialArt}</td>
                    <td>{batch.days?.join(", ") || "-"}</td>
                    <td>
                      {batch.startTime || "-"} - {batch.endTime || "-"}
                    </td>
                    <td>{batch.studentCount || 0}</td>
                    <td>
                      <span className={`badge badge-${batch.status}`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="actions">
                      <Link to={`/batches/${batch._id}`}>View</Link>
                      <Link to={`/batches/${batch._id}/edit`}>Edit</Link>
                      <button onClick={() => handleDelete(batch._id)}>
                        Inactive
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Batches;