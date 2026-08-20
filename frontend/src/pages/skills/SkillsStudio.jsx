import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BarChart3, BookOpenCheck, ChevronRight, ClipboardCheck, GraduationCap, History, LoaderCircle, Sparkles } from "lucide-react";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import AssessmentHistoryPanel from "../../components/skills/AssessmentHistoryPanel.jsx";
import AssessmentWorkspace from "../../components/skills/AssessmentWorkspace.jsx";
import SkillEditorDrawer from "../../components/skills/SkillEditorDrawer.jsx";
import SkillLibraryPanel from "../../components/skills/SkillLibraryPanel.jsx";
import SkillsOverviewPanel from "../../components/skills/SkillsOverviewPanel.jsx";
import StudentProgressPanel from "../../components/skills/StudentProgressPanel.jsx";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import useSkillsStudio from "./hooks/useSkillsStudio.js";
import styles from "./SkillsStudio.module.css";

const TABS = [{ id: "overview", label: "Overview", icon: BarChart3 }, { id: "library", label: "Skill Library", icon: BookOpenCheck }, { id: "assess", label: "Assess Students", icon: ClipboardCheck }, { id: "history", label: "Assessment History", icon: History }, { id: "progress", label: "Student Progress", icon: GraduationCap }];
const joinAddress = (source) => [source?.address, source?.city, source?.state, source?.country].map((value) => String(value || "").trim()).filter(Boolean).join(", ");

const SkillsStudio = () => {
  const state = useSkillsStudio();
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab") || "overview";
  const activeTab = TABS.some((tab) => tab.id === requested) ? requested : "overview";
  const [drawerOpen, setDrawerOpen] = useState(params.get("action") === "new");
  const [editingSkill, setEditingSkill] = useState(null);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const mainBranch = state.branches.find((branch) => branch.isMainBranch) || state.branches[0];
  const activeStudents = useMemo(() => state.students.filter((student) => student.status === "active" || !student.status), [state.students]);
  const setTab = (tab) => { const next = new URLSearchParams(params); tab === "overview" ? next.delete("tab") : next.set("tab", tab); next.delete("action"); setParams(next, { replace: true }); };
  const editAssessment = (assessment) => { setEditingAssessment(assessment); setTab("assess"); };

  if (state.loading) return <div className={`page ${styles.page}`}><div className={styles.loading}><LoaderCircle size={30}/><strong>Preparing Skills & Assessment Studio...</strong></div></div>;

  return <div className={`page ${styles.page}`}>
    <AcademyHeroHeader headingId="skills-academy" academyName={state.academy?.academyName || "KHILADI Academy"} ownerName={state.academy?.ownerName || state.user?.name || "Academy Owner"} logoUrl={state.academy?.logo ? getAcademyLogoUrl(state.academy) : ""} eyebrow="Athlete development" addressLabel={mainBranch?.branchName || "Main Branch"} address={joinAddress(mainBranch) || joinAddress(state.academy) || "Complete main branch address not available"} summaryItems={[{ key: "skills", icon: Sparkles, value: state.skillSummary.active || state.activeSkills.length, label: "Active Skills" }, { key: "students", type: "profile", value: activeStudents.length, label: "Active Students" }]}/>
    <nav className={styles.breadcrumb}><Link to="/dashboard">Dashboard</Link><ChevronRight size={13}/><strong>Skills & Assessments</strong></nav>
    <header className={styles.heading}><div><span><Sparkles size={25}/></span><div><small>Athlete development</small><h1>Skills & Assessment Studio</h1><p>Build the curriculum, assess athletes and track measurable progress.</p></div></div></header>
    <nav className={styles.tabs}>{TABS.map((tab) => { const Icon = tab.icon; return <button type="button" key={tab.id} className={activeTab === tab.id ? styles.activeTab : ""} onClick={() => setTab(tab.id)}><Icon size={17}/>{tab.label}</button>; })}</nav>
    {state.error ? <div className={styles.error}>{state.error}</div> : null}
    {activeTab === "overview" ? <SkillsOverviewPanel skills={state.activeSkills} assessments={state.assessments} skillSummary={state.skillSummary} assessmentSummary={state.assessmentSummary} onLibrary={() => setTab("library")} onAssess={() => setTab("assess")} styles={styles}/> : null}
    {activeTab === "library" ? <SkillLibraryPanel canManage={state.canManageLibrary} filters={state.filters} onFilters={state.setFilters} onAdd={() => { setEditingSkill(null); setDrawerOpen(true); }} onArchive={state.archiveSkill} onEdit={(skill) => { setEditingSkill(skill); setDrawerOpen(true); }} onInstall={state.installDefaults} skills={state.skills} summary={state.skillSummary} working={state.working} styles={styles}/> : null}
    {activeTab === "assess" ? <AssessmentWorkspace assessment={editingAssessment} skills={state.activeSkills} students={activeStudents} saving={state.working} onSave={async (payload, id) => { const ok = await state.saveAssessment(payload, id); if (ok) setEditingAssessment(null); return ok; }} styles={styles}/> : null}
    {activeTab === "history" ? <AssessmentHistoryPanel assessments={state.assessments} branches={state.branches} filters={state.assessmentFilters} onFilters={state.setAssessmentFilters} onDelete={state.removeAssessment} onEdit={editAssessment} styles={styles}/> : null}
    {activeTab === "progress" ? <StudentProgressPanel initialStudentId={params.get("student") || ""} students={activeStudents} styles={styles}/> : null}
    <SkillEditorDrawer open={drawerOpen} skill={editingSkill} saving={state.working} onClose={() => { setDrawerOpen(false); setEditingSkill(null); }} onSave={state.saveSkill} styles={styles}/>
  </div>;
};

export default SkillsStudio;
