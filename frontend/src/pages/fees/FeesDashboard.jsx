import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { feePaymentApi } from "../../api/feeApi.js";

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const FeesDashboard = () => {
  const navigate = useNavigate();
  const now = new Date();

  const [filters, setFilters] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });

  const [data, setData] = useState({
    totalCollection: 0,
    thisMonthCollection: 0,
    pendingAmount: 0,
    overdueStudents: 0,
    summary: {
      paid: 0,
      due: 0,
      partial: 0,
      overdue: 0,
    },
    recentPayments: [],
  });

  const [feeStatusList, setFeeStatusList] = useState([]);
  const [loading, setLoading] = useState(true);

  const dueStudents = useMemo(() => {
    return feeStatusList.filter((item) =>
      ["due", "partial", "overdue"].includes(item.status)
    );
  }, [feeStatusList]);

  const paidStudents = useMemo(() => {
    return feeStatusList.filter((item) => item.status === "paid");
  }, [feeStatusList]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const dashboardResponse = await feePaymentApi.getDashboard(filters);
      setData(dashboardResponse.data?.data || {});

      const statusResponse = await feePaymentApi.getStudentsStatus(filters);
      setFeeStatusList(statusResponse.data?.data?.students || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Fees dashboard load nahi hua");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [filters.month, filters.year]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Fees Dashboard</h1>
          <p>Collection, pending fees aur recent payments ka overview</p>
        </div>

        <div className="actions">
          <Link className="btn btn-primary" to="/fees/collect">
            Collect Fee
          </Link>
          <Link className="btn" to="/fees/students-status">
            Students Fee Status
          </Link>
        </div>
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
                  {new Date(2000, index, 1).toLocaleString("en-US", {
                    month: "long",
                  })}
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

      {loading ? (
        <div className="card">
          <p>Loading fees dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-4">
            <div className="card stat-card">
              <span>Total Collection</span>
              <strong>{currency(data.totalCollection)}</strong>
            </div>

            <div className="card stat-card">
              <span>This Month Collection</span>
              <strong>{currency(data.thisMonthCollection)}</strong>
            </div>

            <div className="card stat-card">
              <span>Pending Amount</span>
              <strong>{currency(data.pendingAmount)}</strong>
            </div>

            <div className="card stat-card">
              <span>Overdue Students</span>
              <strong>{data.overdueStudents || 0}</strong>
            </div>
          </div>

          <div className="grid grid-4">
            <div className="card stat-card">
              <span>Paid</span>
              <strong>{data.summary?.paid || 0}</strong>
            </div>

            <div className="card stat-card">
              <span>Due</span>
              <strong>{data.summary?.due || 0}</strong>
            </div>

            <div className="card stat-card">
              <span>Partial</span>
              <strong>{data.summary?.partial || 0}</strong>
            </div>

            <div className="card stat-card">
              <span>Overdue</span>
              <strong>{data.summary?.overdue || 0}</strong>
            </div>
          </div>

          <div className="grid grid-3">
            <Link className="card action-card" to="/fees/students-status">
              All Students Fee Status
            </Link>

            <Link className="card action-card" to="/fees/pending">
              Pending / Overdue Fees
            </Link>

            <Link className="card action-card" to="/fees/plans">
              Fee Plans
            </Link>
          </div>

          <div className="card">
            <div className="page-header">
              <div>
                <h2>Recent Payments</h2>
                <p>Latest fee collections</p>
              </div>

              <Link to="/fees/payments">View All</Link>
            </div>

            {!data.recentPayments?.length ? (
              <p>No payments found.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Receipt</th>
                      <th>Student</th>
                      <th>Amount</th>
                      <th>Mode</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {data.recentPayments.map((payment) => (
                      <tr
                        key={payment._id}
                        onClick={() =>
                          payment._id && navigate(`/fees/receipt/${payment._id}`)
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <td>{payment.receiptNumber || "-"}</td>
                        <td>
                          {payment.studentName || "-"}
                          <br />
                          <small>{payment.admissionNumber || ""}</small>
                        </td>
                        <td>{currency(payment.amountPaid)}</td>
                        <td>{payment.paymentMode || "-"}</td>
                        <td>
                          {payment.paymentDate
                            ? new Date(payment.paymentDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>
                          <span className={`badge badge-${payment.status}`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="page-header">
              <div>
                <h2>Due / Pending Students</h2>
                <p>Due, partial aur overdue students</p>
              </div>
            </div>

            {dueStudents.length === 0 ? (
              <p>No due students found.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Batch</th>
                      <th>Payable</th>
                      <th>Paid</th>
                      <th>Pending</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {dueStudents.map((item) => (
                      <tr
                        key={item.student?._id}
                        onClick={() =>
                          item.student?._id &&
                          navigate(`/fees/student/${item.student._id}`)
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          {item.student?.name || "-"}
                          <br />
                          <small>{item.student?.admissionNumber || "-"}</small>
                        </td>
                        <td>{item.student?.batch?.batchName || "-"}</td>
                        <td>{currency(item.payableAmount)}</td>
                        <td>{currency(item.paidAmount)}</td>
                        <td>{currency(item.pendingAmount)}</td>
                        <td>
                          {item.dueDate
                            ? new Date(item.dueDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>
                          <span className={`badge badge-${item.status}`}>
                            {item.status}
                          </span>
                        </td>
                        <td onClick={(event) => event.stopPropagation()}>
                          <Link
                            to={`/fees/collect?student=${item.student?._id}&month=${filters.month}&year=${filters.year}`}
                          >
                            Collect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="card">
            <div className="page-header">
              <div>
                <h2>Paid Students</h2>
                <p>Students jinki selected month ki fee paid hai</p>
              </div>
            </div>

            {paidStudents.length === 0 ? (
              <p>No paid students found.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Batch</th>
                      <th>Paid Amount</th>
                      <th>Paid Date</th>
                      <th>Mode</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paidStudents.map((item) => (
                      <tr
                        key={item.student?._id}
                        onClick={() =>
                          item.student?._id &&
                          navigate(`/fees/student/${item.student._id}`)
                        }
                        style={{ cursor: "pointer" }}
                      >
                        <td>
                          {item.student?.name || "-"}
                          <br />
                          <small>{item.student?.admissionNumber || "-"}</small>
                        </td>
                        <td>{item.student?.batch?.batchName || "-"}</td>
                        <td>{currency(item.paidAmount)}</td>
                        <td>
                          {item.paidDate
                            ? new Date(item.paidDate).toLocaleDateString()
                            : "-"}
                        </td>
                        <td>{item.paymentMode || "-"}</td>
                        <td onClick={(event) => event.stopPropagation()}>
                          {item.paymentId ? (
                            <Link to={`/fees/receipt/${item.paymentId}`}>
                              Receipt
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FeesDashboard;