import { useCallback, useEffect, useMemo, useState } from "react";
import { academyApi } from "../../../api/academyApi.js";
import { announcementApi } from "../../../api/announcementApi.js";
import { communicationApi } from "../../../api/communicationApi.js";
import { notificationApi } from "../../../api/notificationApi.js";
import { parentLinkApi } from "../../../api/parentLinkApi.js";
import { getBranches } from "../../../api/branchApi.js";
import api from "../../../api/api.js";
import useAuth from "../../../hooks/useAuth.js";

const payload = (response) => response?.data?.data || response?.data || response || {};
const list = (response, key) => payload(response)?.[key] || [];

const useCommunicationHub = () => {
  const { user } = useAuth();
  const canManageFees = ["super_admin", "academy_owner"].includes(user?.role);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [parentLinks, setParentLinks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logPagination, setLogPagination] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationPagination, setNotificationPagination] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async ({ quiet = false, logParams = {}, notificationParams = {} } = {}) => {
    quiet ? setRefreshing(true) : setLoading(true);
    setError("");
    const requests = await Promise.allSettled([
      academyApi.getMyAcademy(),
      getBranches({ status: "active" }),
      api.get("/batches", { params: { limit: 200, status: "active" } }),
      announcementApi.getAll(),
      parentLinkApi.getAll(),
      communicationApi.getLogs({ page: 1, limit: 20, ...logParams }),
      notificationApi.getAll({ page: 1, limit: 20, ...notificationParams }),
    ]);
    const [academyResult, branchResult, batchResult, announcementResult, linkResult, logResult, notificationResult] = requests;
    if (academyResult.status === "fulfilled") setAcademy(payload(academyResult.value)?.academy || payload(academyResult.value));
    if (branchResult.status === "fulfilled") { const data = payload(branchResult.value); setBranches(Array.isArray(data) ? data : data.branches || data.items || []); }
    if (batchResult.status === "fulfilled") setBatches(list(batchResult.value, "batches"));
    if (announcementResult.status === "fulfilled") setAnnouncements(list(announcementResult.value, "announcements"));
    if (linkResult.status === "fulfilled") setParentLinks(list(linkResult.value, "links"));
    if (logResult.status === "fulfilled") { const data = payload(logResult.value); setLogs(data.logs || []); setLogPagination(data.pagination || null); }
    if (notificationResult.status === "fulfilled") { const data = payload(notificationResult.value); setNotifications(data.notifications || []); setUnreadCount(data.unreadCount || 0); setNotificationPagination(data.pagination || null); }
    const failures = requests.filter((result) => result.status === "rejected");
    if (failures.length) setError(failures[0].reason?.response?.data?.message || "Some communication data could not be loaded.");
    setLoading(false); setRefreshing(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const stats = useMemo(() => ({
    published: announcements.filter((item) => item.status === "published").length,
    scheduled: announcements.filter((item) => item.status === "draft" || new Date(item.publishAt) > new Date()).length,
    activeLinks: parentLinks.filter((item) => item.isActive !== false).length,
    sent: logs.filter((item) => ["sent", "delivered"].includes(item.status)).length,
    failed: logs.filter((item) => item.status === "failed").length,
    unread: unreadCount,
  }), [announcements, logs, parentLinks, unreadCount]);

  const archiveAnnouncement = async (id) => { await announcementApi.remove(id); await load({ quiet: true }); };
  const deactivateParentLink = async (id) => { await parentLinkApi.remove(id); await load({ quiet: true }); };
  const markRead = async (id) => { await notificationApi.markRead(id); await load({ quiet: true }); };
  const markAllRead = async () => { await notificationApi.markAllRead(); await load({ quiet: true }); };
  const sendAttendanceReminder = async (form) => communicationApi.sendAttendanceReminder(form);
  const sendFeeReminder = async (form) => communicationApi.sendFeeReminder(form);

  return { academy, announcements, archiveAnnouncement, batches, branches, canManageFees, deactivateParentLink, error, loading, logPagination, logs, markAllRead, markRead, notificationPagination, notifications, parentLinks, refresh: () => load({ quiet: true }), refreshing, sendAttendanceReminder, sendFeeReminder, stats, unreadCount, user };
};

export default useCommunicationHub;
