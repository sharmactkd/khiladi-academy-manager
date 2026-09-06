import { useCallback, useEffect, useMemo, useState } from "react";
import { academyApi } from "../../../api/academyApi.js";
import { getAttendanceAnalytics, getDashboardAnalytics, getFeesAnalytics, getPerformanceAnalytics, getStudentAnalytics } from "../../../api/analyticsApi.js";
import { getBranches } from "../../../api/branchApi.js";
import useAuth from "../../../hooks/useAuth.js";
import { getPayload, normalizeBranches } from "../analyticsStudio.utils.js";

const EMPTY_DATA = { overview: {}, students: {}, attendance: {}, fees: {}, performance: {} };

const useAnalyticsStudio = () => {
  const { user } = useAuth();
  const canManageFees = ["super_admin", "academy_owner"].includes(user?.role);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [filters, setFilters] = useState({ branch: "", fromDate: "", toDate: "", preset: "all" });
  const [data, setData] = useState(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errors, setErrors] = useState([]);

  const params = useMemo(() => Object.fromEntries(Object.entries(filters).filter(([key, value]) => key !== "preset" && value)), [filters]);

  const load = useCallback(async ({ quiet = false } = {}) => {
    quiet ? setRefreshing(true) : setLoading(true);
    setErrors([]);
    const requests = [
      ["overview", getDashboardAnalytics(params)],
      ["students", getStudentAnalytics(params)],
      ["attendance", getAttendanceAnalytics(params)],
      ["performance", getPerformanceAnalytics(params)],
      ...(canManageFees ? [["fees", getFeesAnalytics(params)]] : []),
    ];
    const [academyResult, branchesResult, ...analyticsResults] = await Promise.allSettled([
      academyApi.getMyAcademy(), getBranches({ status: "active" }), ...requests.map(([, request]) => request),
    ]);

    if (academyResult.status === "fulfilled") {
      const academyPayload = getPayload(academyResult.value, {});
      setAcademy(academyPayload?.academy || academyPayload || null);
    }
    if (branchesResult.status === "fulfilled") setBranches(normalizeBranches(branchesResult.value));

    const nextData = { ...EMPTY_DATA };
    const nextErrors = [];
    analyticsResults.forEach((result, index) => {
      const section = requests[index][0];
      if (result.status === "fulfilled") nextData[section] = getPayload(result.value, {});
      else nextErrors.push(result.reason?.response?.data?.message || `${section} analytics could not be loaded`);
    });
    setData(nextData);
    setErrors([...new Set(nextErrors)]);
    setLoading(false);
    setRefreshing(false);
  }, [canManageFees, params]);

  useEffect(() => { load(); }, [load]);

  return { academy, branches, canManageFees, data, errors, filters, loading, refreshing, setFilters, reload: () => load({ quiet: true }), user };
};

export default useAnalyticsStudio;
