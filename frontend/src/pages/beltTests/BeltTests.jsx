import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { studentApi } from "../../api/studentApi.js";
import { batchApi } from "../../api/batchApi.js";
import { beltTestApi } from "../../api/beltTestApi.js";

const normalizeList = (response, nestedKey) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.[nestedKey])) return data.data[nestedKey];
  if (Array.isArray(data?.[nestedKey])) return data[nestedKey];

  return [];
};

const getStudentName = (student) => {
  const fullName = `${student.firstName || ""} ${student.lastName || ""}`.trim();
  return student.name || fullName || "Unknown";
};

const getStudentCode = (student) =>
  student.studentCode || student.admissionNumber || "-";

const getLatestTest = (studentId, beltTests) => {
  return beltTests
    .filter((record) => {
      const recordStudentId = record.student?._id || record.student;
      return String(recordStudentId) === String(studentId);
    })
    .sort((a, b) => new Date(b.testDate || 0) - new Date(a.testDate || 0))[0];
};

const BeltTests = () => {
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [beltTests, setBeltTests] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    status: "",
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);

      const [studentsRes, batchesRes, beltTestsRes] = await Promise.all([
        studentApi.getAll({}),
        batchApi.getAll(),
        beltTestApi.getAll({ limit: 100 }),
      ]);

      const studentsList = normalizeList(studentsRes, "students");
      const batchesList = normalizeList(batchesRes, "batches");
      const beltTestsList = normalizeList(beltTestsRes, "beltTests");

      const activeBatches = batchesList.filter((batch) => batch.isActive);

      setStudents(studentsList);
      setBatches(activeBatches);
      setBeltTests(beltTestsList);

      if (activeBatches.length) {
        setSelectedBatchId((prev) => prev || activeBatches[0]._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Belt test data load nahi hua");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedBatch = useMemo(() => {
    return batches.find((batch) => batch._id === selectedBatchId) || null;
  }, [batches, selectedBatchId]);

  const selectedBatchStudents = useMemo(() => {
    const search = filters.search.trim().toLowerCase();

    return students.filter((student) => {
      const studentBatchId = String(student.batch?._id || student.batch || "");
      const name = getStudentName(student).toLowerCase();
      const code = getStudentCode(student).toLowerCase();
      const phone = String(student.phone || "").toLowerCase();

      const matchesBatch = selectedBatchId
        ? studentBatchId === String(selectedBatchId)
        : true;

      const matchesSearch =
        !search ||
        name.includes(search) ||
        code.includes(search) ||
        phone.includes(search);

      const matchesStatus =
        !filters.status || String(student.status || "") === filters.status;

      return matchesBatch && matchesSearch && matchesStatus;
    });
  }, [students, selectedBatchId, filters]);

  const activeStudents = useMemo(() => {
    return selectedBatchStudents.filter((student) => student.status === "active");
  }, [selectedBatchStudents]);

  const nonActiveStudents = useMemo(() => {
    return selectedBatchStudents.filter((student) => student.status !== "active");
  }, [selectedBatchStudents]);

  const renderStudentRow = (student) => {
    const latestTest = getLatestTest(student._id, beltTests);

    return (
      <tr
        key={student._id}
        onClick={() => navigate(`/students/${student._id}/belt-history`)}
        style={{ cursor: "pointer" }}
      >
        <td>
          <strong>{getStudentName(student)}</strong>
          <br />
          <small>{getStudentCode(student)}</small>
        </td>

        <td>{student.phone || "-"}</td>
        <td>{student.beltRank || "-"}</td>
        <td>{latestTest?.promotedToBelt || "-"}</td>

        <td>
          {latestTest?.testDate
            ? new Date(latestTest.testDate).toLocaleDateString()
            : "-"}
        </td>

        <td>
          {latestTest?.result ? (
            <span className={`status-pill ${latestTest.result}`}>
              {latestTest.result}
            </span>
          ) : (
            "-"
          )}
        </td>

        <td>
          <span className={`badge badge-${student.status}`}>
            {student.status || "-"}
          </span>
        </td>

        <td
          className="table-actions"
          onClick={(event) => event.stopPropagation()}
        >
          <Link to={`/belt-tests/new?student=${student._id}`}>Add Test</Link>
          <Link to={`/students/${student._id}/belt-history`}>History</Link>
        </td>
      </tr>
    );
  };

  const renderStudentTable = (list, emptyText) => {
    if (!list.length) {
      return <p>{emptyText}</p>;
    }

    return (
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Phone</th>
              <th>Current Belt</th>
              <th>Promoted To</th>
              <th>Last Test Date</th>
              <th>Result</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>{list.map(renderStudentRow)}</tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Belt Test Records</h1>
          <p>Batch wise active aur non-active students ke belt test records.</p>
        </div>

        <Link className="btn btn-primary" to="/belt-tests/new">
          Add Belt Test
        </Link>
      </div>

      <div className="card">
        <h3>Batches</h3>

        {batches.length === 0 ? (
          <p>No active batches found.</p>
        ) : (
          <div className="actions" style={{ flexWrap: "wrap" }}>
            {batches.map((batch) => (
              <button
                key={batch._id}
                type="button"
                className={
                  selectedBatchId === batch._id ? "btn btn-primary" : "btn"
                }
                onClick={() => setSelectedBatchId(batch._id)}
              >
                {batch.batchName} - {batch.martialArt}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="card filters-grid">
        <input
          type="text"
          placeholder="Search student, code, phone..."
          value={filters.search}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, search: event.target.value }))
          }
        />

        <select
          value={filters.status}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, status: event.target.value }))
          }
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="left">Left</option>
        </select>

        <button
          type="button"
          className="btn btn-secondary"
          onClick={() =>
            setFilters({
              search: "",
              status: "",
            })
          }
        >
          Reset
        </button>
      </div>

      {loading ? (
        <div className="card">Loading belt test records...</div>
      ) : !selectedBatch ? (
        <div className="card">No batch selected.</div>
      ) : (
        <div className="card table-card">
          <div className="page-header">
            <div>
              <h2>
                {selectedBatch.batchName} - {selectedBatch.martialArt}
              </h2>
              <p>
                Active: {activeStudents.length} | Non-active:{" "}
                {nonActiveStudents.length}
              </p>
            </div>
          </div>

          <h3>Active Students</h3>
          {renderStudentTable(activeStudents, "No active students found.")}

          <h3 style={{ marginTop: "24px" }}>Non Active Students</h3>
          {renderStudentTable(nonActiveStudents, "No non-active students found.")}
        </div>
      )}
    </div>
  );
};

export default BeltTests;