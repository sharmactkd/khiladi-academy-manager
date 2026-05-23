import { useEffect, useState } from "react";
import { notificationApi } from "../../api/notificationApi.js";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filters, setFilters] = useState({
    isRead: "",
    page: 1,
    limit: 20,
  });
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      setLoading(true);

      const params = {
        page: filters.page,
        limit: filters.limit,
      };

      if (filters.isRead !== "") {
        params.isRead = filters.isRead;
      }

      const response = await notificationApi.getAll(params);
      setNotifications(response.data?.data?.notifications || []);
      setUnreadCount(response.data?.data?.unreadCount || 0);
      setPagination(response.data?.data?.pagination || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.isRead, filters.page]);

  const handleRead = async (id) => {
    await notificationApi.markRead(id);
    await loadNotifications();
  };

  const handleReadAll = async () => {
    await notificationApi.markAllRead();
    await loadNotifications();
  };

  if (loading) return <div className="card">Loading notifications...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Notifications</h1>
          <p>{unreadCount} unread notifications.</p>
        </div>

        <button className="btn btn-primary" type="button" onClick={handleReadAll}>
          Mark All Read
        </button>
      </div>

      <div className="card filters-grid">
        <select
          value={filters.isRead}
          onChange={(event) =>
            setFilters((prev) => ({
              ...prev,
              isRead: event.target.value,
              page: 1,
            }))
          }
        >
          <option value="">All Notifications</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>
      </div>

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="card">No notifications found.</div>
        ) : (
          notifications.map((notification) => (
            <div
              className={`card notification-card ${
                notification.isRead ? "read" : "unread"
              }`}
              key={notification._id}
            >
              <div>
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <small>
                  {notification.type} |{" "}
                  {new Date(notification.createdAt).toLocaleString()}
                </small>
              </div>

              {!notification.isRead && (
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => handleRead(notification._id)}
                >
                  Mark Read
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {pagination && (
        <div className="pagination-row">
          <button
            className="btn btn-secondary"
            disabled={filters.page <= 1}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
            }
          >
            Previous
          </button>

          <span>
            Page {pagination.page} of {pagination.pages || 1}
          </span>

          <button
            className="btn btn-secondary"
            disabled={filters.page >= pagination.pages}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Notifications;