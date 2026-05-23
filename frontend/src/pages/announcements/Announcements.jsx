import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { announcementApi } from "../../api/announcementApi.js";

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    search: "",
  });
  const [loading, setLoading] = useState(true);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementApi.getAll(filters);
      setAnnouncements(response.data?.data?.announcements || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.category, filters.priority]);

  const handleSearch = (event) => {
    event.preventDefault();
    loadAnnouncements();
  };

  const handleArchive = async (id) => {
    const confirmed = window.confirm("Archive this announcement?");
    if (!confirmed) return;

    await announcementApi.remove(id);
    await loadAnnouncements();
  };

  if (loading) return <div className="card">Loading announcements...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Announcements</h1>
          <p>Create and manage notice board announcements.</p>
        </div>

        <Link className="btn btn-primary" to="/announcements/new">
          Create Announcement
        </Link>
      </div>

      <form className="card filters-grid" onSubmit={handleSearch}>
        <input
          value={filters.search}
          placeholder="Search announcements..."
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
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={filters.category}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, category: event.target.value }))
          }
        >
          <option value="">All Categories</option>
          <option value="general">General</option>
          <option value="fees">Fees</option>
          <option value="attendance">Attendance</option>
          <option value="belt_test">Belt Test</option>
          <option value="championship">Championship</option>
          <option value="holiday">Holiday</option>
          <option value="urgent">Urgent</option>
        </select>

        <select
          value={filters.priority}
          onChange={(event) =>
            setFilters((prev) => ({ ...prev, priority: event.target.value }))
          }
        >
          <option value="">All Priority</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>

        <button className="btn btn-secondary" type="submit">
          Search
        </button>
      </form>

      <div className="card table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Audience</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Channels</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {announcements.length === 0 ? (
              <tr>
                <td colSpan="7">No announcements found.</td>
              </tr>
            ) : (
              announcements.map((item) => (
                <tr key={item._id}>
                  <td>
                    <strong>{item.title}</strong>
                    <br />
                    <small>{new Date(item.publishAt).toLocaleString()}</small>
                  </td>
                  <td>{item.audienceType}</td>
                  <td>{item.category}</td>
                  <td>{item.priority}</td>
                  <td>{item.status}</td>
                  <td>{item.channels?.join(", ")}</td>
                  <td className="table-actions">
                    <Link to={`/announcements/${item._id}`}>View</Link>
                    {item.status !== "archived" && (
                      <button type="button" onClick={() => handleArchive(item._id)}>
                        Archive
                      </button>
                    )}
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

export default Announcements;