import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { announcementApi } from "../../api/announcementApi.js";

const MyAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const response = await announcementApi.getMine();
        setAnnouncements(response.data?.data?.announcements || []);
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncements();
  }, []);

  if (loading) return <div className="card">Loading announcements...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>My Announcements</h1>
          <p>Notices shared with you by your academy.</p>
        </div>
      </div>

      <div className="announcement-list">
        {announcements.length === 0 ? (
          <div className="card">No announcements found.</div>
        ) : (
          announcements.map((announcement) => (
            <div className="card announcement-card" key={announcement._id}>
              <div className="announcement-card-header">
                <div>
                  <h3>{announcement.title}</h3>
                  <p className="muted">
                    {announcement.category} | {announcement.priority}
                  </p>
                </div>

                <Link to={`/announcements/${announcement._id}`}>View</Link>
              </div>

              <p>{announcement.message}</p>

              <small>
                Published:{" "}
                {announcement.publishAt
                  ? new Date(announcement.publishAt).toLocaleString()
                  : "-"}
              </small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyAnnouncements;