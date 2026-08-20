import { useEffect, useMemo, useState } from "react";
import { Award, BarChart3, CalendarDays, Search, TrendingUp, UserRound } from "lucide-react";
import { getStudentSkillProfile } from "../../api/skillApi.js";
import { categoryMeta, pretty } from "../../pages/skills/skillsStudio.config.js";

const StudentProgressPanel = ({ students, styles, initialStudentId = "" }) => {
  const [search, setSearch] = useState("");
  const [studentId, setStudentId] = useState(initialStudentId);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const candidates = useMemo(() => { const query = search.toLowerCase().trim(); return students.filter((student) => !query || `${student.firstName} ${student.lastName} ${student.admissionNumber || ""}`.toLowerCase().includes(query)).slice(0, 8); }, [search, students]);
  useEffect(() => {
    if (!initialStudentId) return;
    setStudentId(initialStudentId);
    const student = students.find((item) => item._id === initialStudentId);
    if (student) setSearch(`${student.firstName} ${student.lastName}`.trim());
  }, [initialStudentId, students]);
  useEffect(() => { if (!studentId) return setProfile(null); setLoading(true); getStudentSkillProfile(studentId).then((response) => setProfile(response.data || null)).finally(() => setLoading(false)); }, [studentId]);
  return <section className={styles.panel}><header className={styles.panelHeader}><div><span><BarChart3 size={20}/></span><div><small>Athlete development</small><h2>Student Skill Progress</h2><p>Review category readiness, recent scores and coach feedback.</p></div></div></header><div className={styles.progressSearch}><label><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student..."/></label>{search && !studentId ? <div>{candidates.map((student) => <button type="button" key={student._id} onClick={() => { setStudentId(student._id); setSearch(`${student.firstName} ${student.lastName}`); }}><span>{student.firstName?.[0]}</span><p><strong>{student.firstName} {student.lastName}</strong><small>{student.admissionNumber || "No admission number"}</small></p></button>)}</div> : null}</div>{loading ? <div className={styles.empty}>Loading student progress...</div> : profile ? <div className={styles.progressBody}><section className={styles.studentHero}><span><UserRound size={24}/></span><div><small>Student skill profile</small><h3>{profile.student?.firstName} {profile.student?.lastName}</h3><p>{profile.student?.admissionNumber || "No admission number"} · {profile.student?.branch?.branchName || "No branch"}</p></div><strong>{profile.overallAverage || 0}%<small>Overall</small></strong></section><div className={styles.progressCards}>{(profile.categoryAverage || []).map((item) => { const meta = categoryMeta(item.category); const Icon = meta.icon; return <article key={item.category}><span className={`${styles.categoryIcon} ${styles[`tone${meta.tone[0].toUpperCase()}${meta.tone.slice(1)}`]}`}><Icon size={17}/></span><p><strong>{meta.label}</strong><small>{item.totalAssessments} assessments</small></p><b>{item.averageScore}%</b></article>; })}</div><section className={styles.timeline}><header><h3>Recent Assessment Timeline</h3><span>{profile.assessments?.length || 0} records</span></header>{profile.assessments?.length ? profile.assessments.slice(0, 12).map((item) => <article key={item._id}><span><CalendarDays size={15}/></span><p><strong>{item.skill?.skillName || item.skillSnapshot?.skillName}</strong><small>{new Date(item.assessmentDate).toLocaleDateString("en-GB")} · {pretty(item.skill?.category || item.skillSnapshot?.category)}</small></p><div><i style={{ width: `${item.percentage ?? Math.round((item.score/item.maxScore)*100)}%` }}/></div><b>{item.percentage ?? Math.round((item.score/item.maxScore)*100)}%</b></article>) : <div className={styles.empty}>No assessment history found.</div>}</section></div> : <div className={styles.progressWelcome}><span><TrendingUp size={29}/></span><h3>Select a student to open progress insights</h3><p>Category averages, skill history and improvement trends will appear here.</p></div>}</section>;
};

export default StudentProgressPanel;
