import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { announcementApi } from "../../api/announcementApi.js";

const AnnouncementDetail = () => {
  const { id } = useParams();

  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAnnouncement = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await announcementApi.getById(id);
        setAnnouncement(response.data?.data?.announcement || null);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load announcement");
      } finally {
        setLoading(false);
      }
    };

    loadAnnouncement();
  }, [id]);

  if (loading) return <div className="card">Loading announcement...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{announcement?.title || "Announcement"}</h1>
          <p>
            {announcement?.category || "-"} | {announcement?.priority || "-"}
          </p>
        </div>

        <Link className="btn btn-secondary" to="/announcements">
          Back
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {announcement && (
        <div className="card announcement-detail">
          <div className="announcement-meta">
            <span>Status: {announcement.status}</span>
            <span>Audience: {announcement.audienceType}</span>
            <span>Channels: {announcement.channels?.join(", ")}</span>
            <span>
              Publish:{" "}
              {announcement.publishAt
                ? new Date(announcement.publishAt).toLocaleString()
                : "-"}
            </span>
            <span>
              Expires:{" "}
              {announcement.expiresAt
                ? new Date(announcement.expiresAt).toLocaleString()
                : "-"}
            </span>
          </div>

          <hr />

          <p className="announcement-message">{announcement.message}</p>
        </div>
      )}
    </div>
  );
};

export default AnnouncementDetail;