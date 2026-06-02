import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Trash2 } from "lucide-react";

import { batchApi } from "../../api/batchApi.js";

const formatTime = (time) => {
  if (!time) return "-";

  const [hours, minutes] = time.split(":");

  const date = new Date();
  date.setHours(Number(hours));
  date.setMinutes(Number(minutes));

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatLabel = (value) => {
  const text = String(value || "").trim();

  if (!text) return "-";

  return text
    .split("-")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
};

const formatGenderGroup = (value) => {
  if (value === "male") return "Male";
  if (value === "female") return "Female";
  return "Male & Female";
};

const Batches = () => {
  const navigate = useNavigate();

  const [batches, setBatches] = useState([]);
  const [status, setStatus] = useState("");
  const [batchType, setBatchType] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    try {
      setLoading(true);

      const response = await batchApi.getAll({
        batchType: batchType || undefined,
        skillLevel: skillLevel || undefined,
      });

      const list = response.data?.data || [];

      const filteredList =
        status === "active"
          ? list.filter((batch) => batch.isActive)
          : status === "inactive"
            ? list.filter((batch) => !batch.isActive)
            : list;

      setBatches(filteredList);
    } catch (error) {
      toast.error(error.response?.data?.message || "Batches load nahi hue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [status, batchType, skillLevel]);

  const handleToggleStatus = async (batch) => {
    try {
      if (batch.isActive) {
        if (!window.confirm("Batch ko inactive karna hai?")) return;

        await batchApi.remove(batch._id);
        toast.success("Batch inactive ho gaya");
      } else {
        await batchApi.update(batch._id, {
          ...batch,
          isActive: true,
        });
        toast.success("Batch active ho gaya");
      }

      fetchBatches();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Batch status update nahi hua"
      );
    }
  };

  const handleDelete = async (batch) => {
    const confirmed = window.confirm(
      `Kya aap sach me "${batch.batchName}" batch ko permanently delete karna chahte hain?`
    );

    if (!confirmed) return;

    try {
      await batchApi.remove(batch._id);
      toast.success("Batch delete ho gaya");
      fetchBatches();
    } catch (error) {
      toast.error(error.response?.data?.message || "Batch delete nahi hua");
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Batches</h1>
          <p>Classes aur training batches manage karein</p>
        </div>

        <div className="actions">
          <Link className="btn btn-primary" to="/students/new">
            Add Student
          </Link>

          <Link className="btn btn-primary" to="/batches/new">
            Add Batch
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-3">
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <label>
            Batch Type
            <select
              value={batchType}
              onChange={(event) => setBatchType(event.target.value)}
            >
              <option value="">All Types</option>
              <option value="regular">Regular</option>
              <option value="competition">Competition Team</option>
              <option value="poomsae">Poomsae Team</option>
              <option value="sparring">Sparring Team</option>
              <option value="fitness">Fitness Batch</option>
              <option value="kids">Kids Batch</option>
              <option value="adults">Adults Batch</option>
              <option value="black-belt">Black Belt Batch</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          <label>
            Skill Level
            <select
              value={skillLevel}
              onChange={(event) => setSkillLevel(event.target.value)}
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="elite">Elite</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>
        </div>
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
                  <th>Code</th>
                  <th>Type</th>
                  <th>Level</th>
                  <th>Martial Art</th>
                  <th>Gender</th>
                  <th>Days</th>
                  <th>Time</th>
                  <th>Students</th>
                  <th>Coach</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {batches.map((batch) => (
                  <tr
                    key={batch._id}
                    onClick={() => navigate(`/batches/${batch._id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <strong>{batch.batchName}</strong>
                      {batch.isCompetitionBatch ? (
                        <div className="muted">Competition Batch</div>
                      ) : null}
                    </td>

                    <td>{batch.batchCode || "-"}</td>

                    <td>{formatLabel(batch.batchType)}</td>

                    <td>{formatLabel(batch.skillLevel)}</td>

                    <td>{batch.martialArt || "-"}</td>

                    <td>{formatGenderGroup(batch.genderGroup)}</td>

                    <td>
                      {batch.schedule?.map((item) => item.day).join(", ") ||
                        "-"}
                    </td>

                    <td>
                      {formatTime(batch.schedule?.[0]?.startTime)} -{" "}
                      {formatTime(batch.schedule?.[0]?.endTime)}
                    </td>

                    <td>
                      {batch.students?.length || 0} / {batch.capacity || 0}
                    </td>

                    <td>{batch.headCoachName || batch.coach?.name || "-"}</td>

                    <td>
                      <span
                        className={`badge badge-${
                          batch.isActive ? "active" : "inactive"
                        }`}
                      >
                        {batch.isActive ? "active" : "inactive"}
                      </span>
                    </td>

                    <td
                      className="actions"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Link to={`/batches/${batch._id}/edit`}>Edit</Link>

                      <button
                        type="button"
                        className={`btn ${
                          batch.isActive ? "btn-danger" : "btn-success"
                        }`}
                        onClick={() => handleToggleStatus(batch)}
                      >
                        {batch.isActive ? "Inactive" : "Active"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => handleDelete(batch)}
                        title="Delete Batch"
                      >
                        <Trash2 size={16} />
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