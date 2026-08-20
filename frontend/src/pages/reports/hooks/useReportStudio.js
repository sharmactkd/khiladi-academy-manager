import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { academyApi } from "../../../api/academyApi.js";
import { batchApi } from "../../../api/batchApi.js";
import { getBranches } from "../../../api/branchApi.js";
import { getReportByType, getReportHistory } from "../../../api/reportApi.js";
import useAuth from "../../../hooks/useAuth.js";
import { REPORT_TYPES } from "../reportStudio.config.js";

const dataOf = (response) => response?.data?.data ?? response?.data ?? response ?? {};
const listOf = (response, key) => { const value = dataOf(response); if (Array.isArray(value)) return value; return Array.isArray(value?.[key]) ? value[key] : []; };

const useReportStudio = () => {
  const { user } = useAuth();
  const canManageFees = ["super_admin", "academy_owner"].includes(user?.role);
  const availableTypes = useMemo(() => REPORT_TYPES.filter((type) => !type.ownerOnly || canManageFees), [canManageFees]);
  const [reportType, setReportType] = useState("students");
  const [filters, setFilters] = useState({ branch: "", batch: "", status: "", fromDate: "", toDate: "", preset: "all" });
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [history, setHistory] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState("");

  const loadSetup = useCallback(async () => {
    const [academyResult, branchResult, batchResult, historyResult] = await Promise.allSettled([academyApi.getMyAcademy(), getBranches({ status: "active" }), batchApi.getAll({ status: "active" }), getReportHistory()]);
    if (academyResult.status === "fulfilled") setAcademy(dataOf(academyResult.value)?.academy || dataOf(academyResult.value));
    if (branchResult.status === "fulfilled") setBranches(listOf(branchResult.value, "branches"));
    if (batchResult.status === "fulfilled") setBatches(listOf(batchResult.value, "batches"));
    if (historyResult.status === "fulfilled") setHistory(listOf(historyResult.value, "history"));
    setBooting(false);
  }, []);

  useEffect(() => { loadSetup(); }, [loadSetup]);

  useEffect(() => {
    setFilters((current) => ({ ...current, batch: "", status: "" }));
    setReport(null);
    setError("");
  }, [reportType]);

  const visibleBatches = useMemo(() => filters.branch ? batches.filter((batch) => String(batch.branch?._id || batch.branch) === String(filters.branch)) : batches, [batches, filters.branch]);

  const generate = async () => {
    try {
      setLoading(true); setError("");
      const currentType = availableTypes.find((item) => item.id === reportType);
      const params = Object.fromEntries(Object.entries(filters).filter(([key, value]) => key !== "preset" && value && !(currentType?.noDates && ["fromDate", "toDate"].includes(key)) && !(currentType?.noBatch && key === "batch")));
      const response = await getReportByType(reportType, params);
      const nextReport = dataOf(response);
      const decorated = { ...nextReport, academy: { name: academy?.academyName || "KHILADI Academy", logo: academy?.logo || "", owner: academy?.ownerName || user?.name || "Academy Owner" } };
      setReport(decorated);
      sessionStorage.setItem("khiladi:last-report", JSON.stringify(decorated));
      toast.success(`${currentType?.shortLabel || "Report"} report generated`);
      getReportHistory().then((result) => setHistory(listOf(result, "history"))).catch(() => {});
    } catch (requestError) {
      const message = requestError?.response?.data?.message || "Report generate nahi ho saka";
      setError(message); setReport(null); toast.error(message);
    } finally { setLoading(false); }
  };

  return { academy, availableTypes, batches: visibleBatches, booting, branches, canManageFees, error, filters, generate, history, loading, report, reportType, setFilters, setReportType, user };
};

export default useReportStudio;
