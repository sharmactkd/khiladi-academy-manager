import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { feePaymentApi } from "../../api/feeApi.js";

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const PendingFees = () => {
  const now = new Date();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const fetchPending = async () => {
    try {
      setLoading(true);

      const response = await feePaymentApi.getPending(filters);

      setStudents(response.data?.data?.students || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Pending fees load nahi hui"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, [filters.month, filters.year]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Pending / Overdue Fees</h1>
          <p>Due, partial aur overdue students list</p>
        </div>

        <Link className="btn btn-primary" to="/fees/collect">
          Collect Fee
        </Link>
      </div>

      <div className="card">
        <div className="grid grid-2">
          <label>
            Month
            <select
              value={filters.month}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  month: Number(event.target.value),
                }))
              }
            >
              {Array.from({ length: 12 }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  {new Date(2000, index, 1).toLocaleString(
                    "en-US",
                    {
                      month: "long",
                    }
                  )}
                </option>
              ))}
            </select>
          </label>

          <label>
            Year
            <input
              type="number"
              value={filters.year}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  year: Number(event.target.value),
                }))
              }
            />
          </label>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading pending fees...</p>
        ) : students.length === 0 ? (
          <p>No pending fees found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Phone</th>
                  <th>Batch</th>
                  <th>Due Date</th>
                  <th>Payable</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {students.map((item) => (
                  <tr key={item.student?._id}>
                    <td>
                      {item.student?.name}
                      <br />
                      <small>
                        {item.student?.admissionNumber}
                      </small>
                    </td>

                    <td>{item.student?.phone || "-"}</td>

                    <td>
                      {item.student?.batch?.batchName || "-"}
                    </td>

                    <td>
                      {item.dueDate
                        ? new Date(
                            item.dueDate
                          ).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>{currency(item.payableAmount)}</td>
                    <td>{currency(item.paidAmount)}</td>
                    <td>{currency(item.pendingAmount)}</td>

                    <td>
                      <span
                        className={`badge badge-${item.status}`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="actions">
                      <Link
                        to={`/fees/collect?student=${item.student?._id}&month=${filters.month}&year=${filters.year}`}
                      >
                        Collect
                      </Link>

                      <button
                        type="button"
                        onClick={() =>
                          toast(
                            "Reminder feature placeholder hai"
                          )
                        }
                      >
                        Reminder
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

export default PendingFees;