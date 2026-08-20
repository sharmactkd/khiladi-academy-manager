import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { academyApi } from "../../../api/academyApi.js";
import { batchApi } from "../../../api/batchApi.js";
import { getBranches } from "../../../api/branchApi.js";
import { getStudents } from "../../../api/studentApi.js";
import { createSkill, createSkillAssessment, deleteSkill, deleteSkillAssessment, getSkillAssessments, getSkills, seedDefaultSkills, updateSkill, updateSkillAssessment } from "../../../api/skillApi.js";
import useAuth from "../../../hooks/useAuth.js";

const dataOf = (response) => response?.data?.data ?? response?.data ?? response ?? {};
const listOf = (response, key) => { const data = dataOf(response); if (Array.isArray(data)) return data; return Array.isArray(data?.[key]) ? data[key] : []; };

const useSkillsStudio = () => {
  const { user } = useAuth();
  const canManageLibrary = ["academy_owner", "super_admin"].includes(user?.role);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [skills, setSkills] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [skillSummary, setSkillSummary] = useState({ total: 0, active: 0, categories: 0 });
  const [assessmentSummary, setAssessmentSummary] = useState({ total: 0, published: 0, drafts: 0, dueReviews: 0 });
  const [filters, setFilters] = useState({ search: "", category: "", level: "", status: "active" });
  const [assessmentFilters, setAssessmentFilters] = useState({ branch: "", student: "", skill: "", category: "", status: "", fromDate: "", toDate: "" });
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const loadSetup = useCallback(async () => {
    setLoading(true); setError("");
    const [academyResult, branchResult, batchResult, studentResult] = await Promise.allSettled([academyApi.getMyAcademy(), getBranches({ status: "active" }), batchApi.getAll({ status: "active" }), getStudents({ status: "active", limit: 1000 })]);
    if (academyResult.status === "fulfilled") setAcademy(dataOf(academyResult.value)?.academy || dataOf(academyResult.value));
    if (branchResult.status === "fulfilled") setBranches(listOf(branchResult.value, "branches"));
    if (batchResult.status === "fulfilled") setBatches(listOf(batchResult.value, "batches"));
    if (studentResult.status === "fulfilled") setStudents(listOf(studentResult.value, "students"));
    setLoading(false);
  }, []);

  const loadSkills = useCallback(async () => {
    try { const response = await getSkills({ ...filters, page: 1, limit: 200 }); const payload = dataOf(response); setSkills(listOf(response, "skills")); setSkillSummary(payload.summary || { total: listOf(response, "skills").length, active: listOf(response, "skills").filter((item) => item.isActive).length, categories: new Set(listOf(response, "skills").map((item) => item.category)).size }); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Skills load nahi ho sake"); }
  }, [filters]);

  const loadAssessments = useCallback(async () => {
    try { const params = Object.fromEntries(Object.entries(assessmentFilters).filter(([, value]) => value)); const response = await getSkillAssessments({ ...params, page: 1, limit: 200 }); const payload = dataOf(response); setAssessments(listOf(response, "assessments")); setAssessmentSummary(payload.summary || {}); }
    catch (requestError) { setError(requestError?.response?.data?.message || "Assessments load nahi ho sake"); }
  }, [assessmentFilters]);

  useEffect(() => { loadSetup(); }, [loadSetup]);
  useEffect(() => { const timer = window.setTimeout(loadSkills, 250); return () => window.clearTimeout(timer); }, [loadSkills]);
  useEffect(() => { loadAssessments(); }, [loadAssessments]);

  const saveSkill = async (payload, id) => { try { setWorking(true); id ? await updateSkill(id, payload) : await createSkill(payload); toast.success(id ? "Skill updated" : "Skill created"); await loadSkills(); return true; } catch (e) { toast.error(e?.response?.data?.message || "Skill save nahi hua"); return false; } finally { setWorking(false); } };
  const archiveSkill = async (id) => { if (!window.confirm("Archive this skill? Historical assessments will stay safe.")) return; await deleteSkill(id); toast.success("Skill archived"); loadSkills(); };
  const installDefaults = async () => { try { setWorking(true); const response = await seedDefaultSkills(); const result = dataOf(response); toast.success(`${result.created || 0} default skills installed`); await loadSkills(); } catch (e) { toast.error(e?.response?.data?.message || "Default catalog install nahi hua"); } finally { setWorking(false); } };
  const saveAssessment = async (payload, id) => { try { setWorking(true); id ? await updateSkillAssessment(id, payload) : await createSkillAssessment(payload); toast.success(id ? "Assessment updated" : "Assessment saved"); await loadAssessments(); return true; } catch (e) { toast.error(e?.response?.data?.message || "Assessment save nahi hua"); return false; } finally { setWorking(false); } };
  const removeAssessment = async (id) => { if (!window.confirm("Remove this assessment from active history?")) return; await deleteSkillAssessment(id); toast.success("Assessment removed"); loadAssessments(); };

  const activeSkills = useMemo(() => skills.filter((item) => item.isActive), [skills]);
  return { academy, activeSkills, assessmentFilters, assessmentSummary, assessments, batches, branches, canManageLibrary, error, filters, installDefaults, loading, removeAssessment, saveAssessment, saveSkill, archiveSkill, setAssessmentFilters, setFilters, skillSummary, skills, students, user, working };
};

export default useSkillsStudio;
