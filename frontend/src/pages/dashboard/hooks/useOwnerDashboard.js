import { useCallback, useEffect, useMemo, useState } from "react";

import { academyApi } from "../../../api/academyApi.js";
import { getBranches } from "../../../api/branchApi.js";
import { batchApi } from "../../../api/batchApi.js";
import { billingApi } from "../../../api/billingApi.js";
import {
  getAttendanceAnalytics,
  getDashboardAnalytics,
  getFeesAnalytics,
} from "../../../api/analyticsApi.js";
import useAuth from "../../../hooks/useAuth.js";
import { isEnabled, unwrapList } from "../dashboard.utils.js";

const useOwnerDashboard = () => {
  const { user } = useAuth();
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState(null);
  const [batches, setBatches] = useState(null);
  const [billing, setBilling] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [attendanceAnalytics, setAttendanceAnalytics] = useState(null);
  const [feesAnalytics, setFeesAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const canManageRecords = [
    "super_admin",
    "academy_owner",
    "assistant_coach",
  ].includes(user?.role);
  const canManageFees = ["super_admin", "academy_owner"].includes(user?.role);
  const canManageBilling = ["super_admin", "academy_owner"].includes(user?.role);

  const plan = billing?.plan || {};
  const usage = billing?.usage || {};
  const limits = plan?.limits || {};
  const hasAnalyticsAccess = useMemo(
    () => user?.role === "super_admin" || isEnabled(limits?.analytics),
    [limits?.analytics, user?.role]
  );

  const loadDashboard = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const academyResponse = await academyApi.getMyAcademy();
        setAcademy(academyResponse.data?.data?.academy || null);

        const [branchesResult, batchesResult] = await Promise.allSettled([
          getBranches({ status: "active" }),
          batchApi.getAll(),
        ]);

        setBranches(
          branchesResult.status === "fulfilled"
            ? unwrapList(branchesResult.value)
            : null
        );
        setBatches(
          batchesResult.status === "fulfilled"
            ? unwrapList(batchesResult.value)
            : null
        );

        let billingData = null;
        if (canManageBilling) {
          try {
            const billingResponse = await billingApi.getMySubscription();
            billingData = billingResponse.data?.data || null;
            setBilling(billingData);
          } catch {
            setBilling(null);
          }
        }

        const analyticsAllowed =
          user?.role === "super_admin" ||
          isEnabled(billingData?.plan?.limits?.analytics);

        if (canManageRecords && analyticsAllowed) {
          const [dashboardResult, attendanceResult, feesResult] =
            await Promise.allSettled([
              getDashboardAnalytics(),
              getAttendanceAnalytics(),
              canManageFees ? getFeesAnalytics() : Promise.resolve(null),
            ]);

          setDashboard(
            dashboardResult.status === "fulfilled"
              ? dashboardResult.value?.data || null
              : null
          );
          setAttendanceAnalytics(
            attendanceResult.status === "fulfilled"
              ? attendanceResult.value?.data || null
              : null
          );
          setFeesAnalytics(
            feesResult.status === "fulfilled"
              ? feesResult.value?.data || null
              : null
          );

          if (dashboardResult.status === "rejected") {
            setError(
              dashboardResult.reason?.response?.data?.message ||
                "Dashboard analytics could not be loaded."
            );
          }
        } else {
          setDashboard(null);
          setAttendanceAnalytics(null);
          setFeesAnalytics(null);
        }
      } catch (requestError) {
        setAcademy(null);
        setError(
          requestError?.response?.data?.message ||
            "Dashboard could not be loaded. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [canManageBilling, canManageFees, canManageRecords, user?.role]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    user,
    academy,
    branches,
    batches,
    billing,
    dashboard,
    attendanceAnalytics,
    feesAnalytics,
    loading,
    error,
    canManageRecords,
    canManageFees,
    canManageBilling,
    plan,
    usage,
    limits,
    hasAnalyticsAccess,
    loadDashboard,
  };
};

export default useOwnerDashboard;
