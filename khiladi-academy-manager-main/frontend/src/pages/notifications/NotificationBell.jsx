import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { notificationApi } from "../../api/notificationApi.js";
import useAuth from "../../hooks/useAuth.js";

const NotificationBell = () => {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!isAuthenticated || !user) return;

      try {
        const response = await notificationApi.getAll({
          isRead: false,
          limit: 1,
        });

        setUnreadCount(response.data?.data?.unreadCount || 0);
      } catch {
        setUnreadCount(0);
      }
    };

    loadUnreadCount();
  }, [isAuthenticated, user]);

  if (!isAuthenticated) return null;

  return (
    <Link className="notification-bell" to="/notifications">
      <span>🔔</span>
      {unreadCount > 0 && <strong>{unreadCount}</strong>}
    </Link>
  );
};

export default NotificationBell;