import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { feePaymentApi } from "../../api/feeApi.js";
import { batchApi } from "../../api/batchApi.js";

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const getStatusBadge = (status) => {
  const value = status || "due";
  return <span className={`badge badge-${value}`}>{value}</span>;
};

const AllStudentsFeeStatus = () => {
  const now = new Date();

  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);

  const [filters, setFilters] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    batch: "",
    status: "",
    search: "",
  });

  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    try {
      const response = await batchApi.getAll();
      const list = response.data?.data || [];
      setBatches(list.filter((batch) => batch.isActive));
    } catch {
      setBatches([]);
    }
  };

  const fetchStudentsStatus = async () => {
    try {
      setLoading(true);

      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([, value]) =>
          String(value || "").trim()
        )
      );

      const response = await feePaymentApi.getStudentsStatus(cleanFilters);
      setStudents(response.data?.data?.students || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Students fee status load nahi hua"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchStudentsStatus, 300);
    return () => clearTimeout(timer);
  }, [
    filters.month,
    filters.year,
    filters.batch,
    filters.status,
    filters.search,
  ]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>All Students Fee Status</h1>
          <p>Active students ka month-wise fee status dekhein</p>
        </div>

        <Link className="btn btn-primary" to="/fees/collect">
          Collect Fee
        </Link>
      </div>

      <div className="card">
        <div className="grid grid-5">
          <input
            placeholder="Search student, phone, admission no."
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                search: event.target.value,
              }))
            }
          />

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
                {new Date(2000, index, 1).toLocaleString("en-US", {
                  month: "long",
                })}
              </option>
            ))}
          </select>

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

          <select
            value={filters.batch}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                batch: event.target.value,
              }))
            }
          >
            <option value="">All Batches</option>
            {batches.map((batch) => (
              <option key={batch._id} value={batch._id}>
                {batch.batchName}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                status: event.target.value,
              }))
            }
          >
            <option value="">All Status</option>
            <option value="paid">Paid</option>
            <option value="due">Due</option>
            <option value="partial">Partial</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading fee status...</p>
        ) : students.length === 0 ? (
          <p>No students found.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Contact</th>
                  <th>Batch</th>
                  <th>Monthly Fee</th>
                  <th>Discount</th>
                  <th>Payable</th>
                  <th>Paid</th>
                  <th>Pending</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {students.map((item) => (
                  <tr key={item.student?._id}>
                    <td>
                      <strong>{item.student?.name || "-"}</strong>
                      <br />
                      <small>{item.student?.admissionNumber || "-"}</small>
                    </td>

                    <td>{item.student?.phone || "-"}</td>

                    <td>{item.student?.batch?.batchName || "-"}</td>

                    <td>{currency(item.monthlyFee)}</td>
                    <td>{currency(item.discount)}</td>
                    <td>{currency(item.payableAmount)}</td>
                    <td>{currency(item.paidAmount)}</td>
                    <td>{currency(item.pendingAmount)}</td>

                    <td>
                      {item.dueDate
                        ? new Date(item.dueDate).toLocaleDateString()
                        : "-"}
                    </td>

                    <td>{getStatusBadge(item.status)}</td>

                    <td>
                      {item.paidDate ? (
                        <>
                          {new Date(item.paidDate).toLocaleDateString()}
                          <br />
                          <small>{item.paymentMode || "-"}</small>
                        </>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="actions">
                      <Link
                        to={`/fees/collect?student=${item.student?._id}&month=${filters.month}&year=${filters.year}`}
                      >
                        Collect
                      </Link>

                      <Link to={`/fees/student/${item.student?._id}`}>
                        History
                      </Link>

                      {item.paymentId ? (
                        <Link to={`/fees/receipt/${item.paymentId}`}>
                          Receipt
                        </Link>
                      ) : (
                        <button
                          type="button"
                          disabled
                          title="No receipt available"
                        >
                          Receipt
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          toast("Reminder feature placeholder hai")
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

export default AllStudentsFeeStatus;