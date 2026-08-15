import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BadgeCheck,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileBadge2,
  GraduationCap,
  Image,
  Medal,
  RotateCcw,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { academyApi } from "../../api/academyApi.js";
import { beltTestApi } from "../../api/beltTestApi.js";
import { getBranches } from "../../api/branchApi.js";
import { studentApi } from "../../api/studentApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import {
  TAEKWONDO_BELTS,
  TAEKWONDO_BELT_ORDER,
  TAEKWONDO_DAN_RANKS,
} from "../../components/taekwondoBelts/taekwondoBelts.js";
import useAuth from "../../hooks/useAuth.js";
import { getAcademyLogoUrl, getStudentPhotoUrl } from "../../utils/fileUrl.js";
import styles from "./AddBeltTest.module.css";

const initialForm = {
  student: "",
  currentBelt: "",
  currentDanRank: "",
  promotedToBelt: "",
  promotedToDanRank: "",
  marks: "",
  outOf: "",
  testDate: new Date().toISOString().slice(0, 10),
  result: "pending",
  examinerName: "",
  remarks: "",
  certificateNumber: "",
  certificateUrl: "",
};
const BELT_COLORS = {
  White: "#f8fafc",
  Yellow: "#f4cd28",
  Green: "#23904b",
  "Green One": "#23904b",
  Blue: "#2674ce",
  "Blue One": "#2674ce",
  Red: "#df2731",
  "Red One": "#df2731",
  Black: "#111827",
};
const normalizeList = (response, nestedKey) => {
  const data = response?.data;
  if (Array.isArray(response)) return response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.[nestedKey])) return data.data[nestedKey];
  if (Array.isArray(data?.[nestedKey])) return data[nestedKey];
  return [];
};
const normalizeAcademy = (response) =>
  response?.data?.data?.academy || response?.data?.academy || null;
const normalizeBranches = (response) => {
  const list = response?.data?.data || response?.data || [];
  return Array.isArray(list)
    ? list.filter((item) => item?.isActive !== false)
    : [];
};
const getStudentName = (student) =>
  student?.name ||
  [student?.firstName, student?.lastName].filter(Boolean).join(" ").trim() ||
  "Student";
const getStudentCode = (student) =>
  student?.studentCode || student?.admissionNumber || "No admission number";
const joinAddress = (source) =>
  [source?.address, source?.city, source?.state, source?.country]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .join(", ");
const beltStyle = (belt) => ({
  "--belt-color": BELT_COLORS[belt] || "#94a3b8",
  "--belt-text": ["White", "Yellow"].includes(belt) ? "#16243a" : "#ffffff",
});

const AddBeltTest = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const studentIdFromUrl = searchParams.get("student") || "";
  const [form, setForm] = useState({
    ...initialForm,
    student: studentIdFromUrl,
  });
  const [students, setStudents] = useState([]);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      studentApi.getAll({}),
      academyApi.getMyAcademy(),
      getBranches({ status: "active" }),
    ]).then(([studentResult, academyResult, branchResult]) => {
      const list =
        studentResult.status === "fulfilled"
          ? normalizeList(studentResult.value, "students")
          : [];
      setStudents(list);
      if (academyResult.status === "fulfilled")
        setAcademy(normalizeAcademy(academyResult.value));
      if (branchResult.status === "fulfilled")
        setBranches(normalizeBranches(branchResult.value));
      if (studentIdFromUrl) {
        const matched = list.find(
          (student) => String(student._id) === String(studentIdFromUrl),
        );
        setForm((prev) => ({
          ...prev,
          student: studentIdFromUrl,
          currentBelt: matched?.beltRank || prev.currentBelt,
          currentDanRank:
            matched?.beltRank === "Black" ? matched?.danRank || "" : "",
          promotedToBelt: "",
          promotedToDanRank: "",
        }));
        if (matched) setStudentSearch(getStudentName(matched));
      }
      setLoading(false);
    });
  }, [studentIdFromUrl]);

  const selectedStudent = useMemo(
    () =>
      students.find(
        (student) => String(student._id) === String(form.student),
      ) || null,
    [students, form.student],
  );
  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    return students
      .filter(
        (student) =>
          !query ||
          [
            getStudentName(student),
            getStudentCode(student),
            student.phone,
            student.batch?.batchName,
          ].some((value) =>
            String(value || "")
              .toLowerCase()
              .includes(query),
          ),
      )
      .slice(0, 80);
  }, [students, studentSearch]);
  const showCurrentDan = form.currentBelt === "Black";
  const showPromotedDan = form.promotedToBelt === "Black";
  const score =
    form.marks !== "" && form.outOf !== "" && Number(form.outOf) > 0
      ? Math.round((Number(form.marks) / Number(form.outOf)) * 100)
      : null;
  const mainBranch = branches.find((item) => item?.isMainBranch) || branches[0];

  const update = (name, value) => {
    if (name === "student") {
      const next = students.find(
        (student) => String(student._id) === String(value),
      );
      setForm((prev) => ({
        ...prev,
        student: value,
        currentBelt: next?.beltRank || "",
        currentDanRank: next?.beltRank === "Black" ? next?.danRank || "" : "",
        promotedToBelt: "",
        promotedToDanRank: "",
      }));
      if (next) setStudentSearch(getStudentName(next));
      return;
    }
    if (name === "currentBelt") {
      setForm((prev) => ({
        ...prev,
        currentBelt: value,
        currentDanRank: value === "Black" ? prev.currentDanRank : "",
        promotedToBelt: "",
        promotedToDanRank: "",
      }));
      return;
    }
    if (name === "promotedToBelt") {
      setForm((prev) => ({
        ...prev,
        promotedToBelt: value,
        promotedToDanRank: value === "Black" ? prev.promotedToDanRank : "",
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const selectStudent = (student) => {
    update("student", student._id);
    setStudentMenuOpen(false);
    setError("");
  };
  const clearStudent = () =>
    setForm((prev) => ({
      ...prev,
      student: "",
      currentBelt: "",
      currentDanRank: "",
      promotedToBelt: "",
      promotedToDanRank: "",
    }));
  const handleStudentSearch = (event) => {
    const value = event.target.value;
    setStudentSearch(value);
    setStudentMenuOpen(true);
    if (form.student) clearStudent();
  };
  const handleChange = (event) => update(event.target.name, event.target.value);
  const resetForm = () => {
    setForm({ ...initialForm, student: studentIdFromUrl });
    if (!studentIdFromUrl) setStudentSearch("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.student) {
      setError("Please select a student from the search results.");
      return;
    }
    if (!form.currentBelt || !form.promotedToBelt) {
      setError("Please select both current and promoted belt.");
      return;
    }
    if (
      form.marks !== "" &&
      form.outOf !== "" &&
      Number(form.marks) > Number(form.outOf)
    ) {
      setError("Obtained marks total marks se zyada nahi ho sakte.");
      return;
    }
    if (
      (form.marks !== "" || form.outOf !== "") &&
      (!form.outOf || Number(form.outOf) <= 0)
    ) {
      setError("Please enter valid total marks.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      await beltTestApi.create({
        ...form,
        marks: form.marks === "" ? null : Number(form.marks),
        outOf: form.outOf === "" ? null : Number(form.outOf),
        testDate: form.testDate
          ? new Date(`${form.testDate}T00:00:00`).toISOString()
          : new Date().toISOString(),
      });
      toast.success("Belt test and promotion record created successfully");
      navigate("/belt-tests");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create belt test");
    } finally {
      setSaving(false);
    }
  };

  const renderBeltSelector = (name, value, label) => {
    const isPromoted = name === "promotedToBelt";
    const currentOrder = TAEKWONDO_BELT_ORDER[form.currentBelt];
    return (
      <fieldset className={styles.beltField}>
        <div className={styles.beltFieldHeader}>
          <legend>{label} *</legend>
          {value ? (
            <button type="button" onClick={() => update(name, "")}>
              <X size={12} />
              Clear
            </button>
          ) : null}
        </div>
        <div className={styles.beltTags}>
          {TAEKWONDO_BELTS.map((belt) => {
            const lockedBySelection = Boolean(value && value !== belt);
            const belowCurrent = Boolean(
              isPromoted &&
              currentOrder !== undefined &&
              TAEKWONDO_BELT_ORDER[belt] <= currentOrder,
            );
            const disabled = lockedBySelection || belowCurrent;
            return (
              <button
                key={belt}
                type="button"
                className={`${value === belt ? styles.selectedBelt : ""} ${disabled ? styles.disabledBelt : ""}`}
                style={beltStyle(belt)}
                disabled={disabled}
                aria-pressed={value === belt}
                title={
                  belowCurrent
                    ? "Promoted belt must be above the current belt"
                    : lockedBySelection
                      ? "Clear the selected belt to choose another rank"
                      : belt
                }
                onClick={() => update(name, value === belt ? "" : belt)}
              >
                <i />
                <span>{belt}</span>
                {value === belt ? <Check size={13} /> : null}
              </button>
            );
          })}
        </div>
        <p>
          {value
            ? "Selected tag par dobara click karke ya Clear se rank badal sakte hain."
            : isPromoted && form.currentBelt
              ? "Current rank se upar ki available belt choose karein."
              : "Belt tag choose karein."}
        </p>
      </fieldset>
    );
  };

  return (
    <div className={`page ${styles.page}`}>
      <AcademyHeroHeader
        headingId="add-belt-test-academy"
        academyName={academy?.academyName || "KHILADI Academy"}
        ownerName={academy?.ownerName || user?.name || "Academy Owner"}
        logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""}
        eyebrow="Belt progression desk"
        addressLabel={mainBranch?.branchName || "Main Branch"}
        address={
          joinAddress(mainBranch) ||
          joinAddress(academy) ||
          "Complete main branch address not available"
        }
        summaryItems={[
          {
            key: "students",
            icon: GraduationCap,
            value: students.length,
            label: "Student Records",
          },
          {
            key: "belts",
            icon: Award,
            value: TAEKWONDO_BELTS.length,
            label: "Taekwondo Ranks",
          },
        ]}
      />
      <nav className={styles.breadcrumb}>
        <Link to="/dashboard">Dashboard</Link>
        <span>/</span>
        <Link to="/belt-tests">Belt Tests</Link>
        <span>/</span>
        <strong>Add Belt Test</strong>
      </nav>
      <header className={styles.heading}>
        <div>
          <span>
            <Medal size={25} />
          </span>
          <div>
            <small>Promotion record</small>
            <h1>Add Belt Test</h1>
            <p>
              Record assessment results and update a student's belt progression.
            </p>
          </div>
        </div>
        <Link to="/belt-tests">
          <ArrowLeft size={16} />
          Belt Test Records
        </Link>
      </header>
      {error ? (
        <div className={styles.error}>
          <ShieldCheck size={17} />
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>
            <X size={15} />
          </button>
        </div>
      ) : null}

      <form className={styles.workspace} onSubmit={handleSubmit}>
        <main className={styles.formCard}>
          <section className={styles.section}>
            <header>
              <span>01</span>
              <div>
                <h2>Student Identity</h2>
                <p>Select the student appearing for this belt assessment.</p>
              </div>
            </header>
            <div className={styles.studentPicker}>
              <label htmlFor="belt-student-search">Search Student *</label>
              <div className={styles.searchBox}>
                <Search size={16} />
                <input
                  id="belt-student-search"
                  value={studentSearch}
                  onChange={handleStudentSearch}
                  onFocus={() => setStudentMenuOpen(true)}
                  onBlur={() =>
                    window.setTimeout(() => setStudentMenuOpen(false), 150)
                  }
                  autoComplete="off"
                  placeholder={
                    loading
                      ? "Loading students..."
                      : "Search by name, code, phone or batch..."
                  }
                  disabled={loading}
                />
                {selectedStudent ? (
                  <CheckCircle2 className={styles.selectedCheck} size={18} />
                ) : null}
              </div>
              {studentMenuOpen && !loading ? (
                <div className={styles.studentMenu}>
                  {filteredStudents.length ? (
                    filteredStudents.map((student) => (
                      <button
                        key={student._id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectStudent(student)}
                      >
                        <img
                          src={getStudentPhotoUrl(student)}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.src = "/default-avatar.png";
                          }}
                        />
                        <span>
                          <strong>{getStudentName(student)}</strong>
                          <small>
                            {getStudentCode(student)}
                            {student.phone ? ` · ${student.phone}` : ""}
                          </small>
                        </span>
                        <b>{student.batch?.batchName || "No batch"}</b>
                      </button>
                    ))
                  ) : (
                    <p>No matching student found.</p>
                  )}
                </div>
              ) : null}
            </div>
            {selectedStudent ? (
              <article className={styles.studentStrip}>
                <button type="button" onClick={() => setShowPhotoModal(true)}>
                  <img
                    src={getStudentPhotoUrl(selectedStudent)}
                    alt={getStudentName(selectedStudent)}
                    onError={(event) => {
                      event.currentTarget.src = "/default-avatar.png";
                    }}
                  />
                  <Image size={14} />
                </button>
                <div>
                  <small>Selected student</small>
                  <strong>{getStudentName(selectedStudent)}</strong>
                  <span>{getStudentCode(selectedStudent)}</span>
                </div>
                <dl>
                  <div>
                    <dt>Batch</dt>
                    <dd>
                      {selectedStudent.batch?.batchName || "Not assigned"}
                    </dd>
                  </div>
                  <div>
                    <dt>Martial Art</dt>
                    <dd>
                      {selectedStudent.martialArt ||
                        selectedStudent.batch?.martialArt ||
                        "Not added"}
                    </dd>
                  </div>
                  <div>
                    <dt>Current Rank</dt>
                    <dd>
                      {selectedStudent.beltRank || "Not added"}
                      {selectedStudent.danRank
                        ? ` · ${selectedStudent.danRank}`
                        : ""}
                    </dd>
                  </div>
                </dl>
              </article>
            ) : null}
          </section>

          <section className={styles.section}>
            <header>
              <span>02</span>
              <div>
                <h2>Promotion Path</h2>
                <p>Confirm the current rank and the belt being awarded.</p>
              </div>
            </header>
            <div className={styles.promotionGrid}>
              <div>
                {renderBeltSelector(
                  "currentBelt",
                  form.currentBelt,
                  "Current Belt",
                )}
                {showCurrentDan ? (
                  <label>
                    <span>Current Dan *</span>
                    <select
                      name="currentDanRank"
                      value={form.currentDanRank}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Dan</option>
                      {TAEKWONDO_DAN_RANKS.map((dan) => (
                        <option key={dan}>{dan}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
              <div className={styles.promotionArrow}>
                <ArrowRight size={20} />
                <span>Promotion</span>
              </div>
              <div>
                {renderBeltSelector(
                  "promotedToBelt",
                  form.promotedToBelt,
                  "Promoted To Belt",
                )}
                {showPromotedDan ? (
                  <label>
                    <span>Promoted To Dan *</span>
                    <select
                      name="promotedToDanRank"
                      value={form.promotedToDanRank}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Dan</option>
                      {TAEKWONDO_DAN_RANKS.map((dan) => (
                        <option key={dan}>{dan}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <header>
              <span>03</span>
              <div>
                <h2>Assessment Result</h2>
                <p>Enter the test date, score and final result.</p>
              </div>
            </header>
            <div className={styles.assessmentGrid}>
              <label>
                <span>Test Date *</span>
                <div className={styles.iconInput}>
                  <CalendarDays size={15} />
                  <input
                    type="date"
                    name="testDate"
                    value={form.testDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </label>
              <label>
                <span>Marks Obtained</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  name="marks"
                  value={form.marks}
                  onChange={handleChange}
                  placeholder="Obtained marks"
                />
              </label>
              <label>
                <span>Total Marks</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  name="outOf"
                  value={form.outOf}
                  onChange={handleChange}
                  placeholder="Out of"
                />
              </label>
              <div className={styles.scoreBox}>
                <small>Score</small>
                <strong>{score === null ? "—" : `${score}%`}</strong>
              </div>
            </div>
            <fieldset className={styles.resultField}>
              <legend>Result *</legend>
              <div>
                {[
                  { value: "pending", label: "Pending", icon: ClipboardCheck },
                  { value: "pass", label: "Pass", icon: BadgeCheck },
                  { value: "fail", label: "Fail", icon: X },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      form.result === value ? styles[`result${label}`] : ""
                    }
                    onClick={() => update("result", value)}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                    {form.result === value ? <Check size={14} /> : null}
                  </button>
                ))}
              </div>
            </fieldset>
          </section>

          <section className={styles.section}>
            <header>
              <span>04</span>
              <div>
                <h2>Examiner & Certification</h2>
                <p>Add official assessment and certificate details.</p>
              </div>
            </header>
            <div className={styles.detailsGrid}>
              <label>
                <span>Examiner Name</span>
                <div className={styles.iconInput}>
                  <UserRound size={15} />
                  <input
                    name="examinerName"
                    maxLength="100"
                    value={form.examinerName}
                    onChange={handleChange}
                    placeholder="Examiner's full name"
                  />
                </div>
              </label>
              <label>
                <span>Certificate Number</span>
                <div className={styles.iconInput}>
                  <FileBadge2 size={15} />
                  <input
                    name="certificateNumber"
                    maxLength="80"
                    value={form.certificateNumber}
                    onChange={handleChange}
                    placeholder="Certificate reference"
                  />
                </div>
              </label>
              <label className={styles.fullWidth}>
                <span>Certificate URL</span>
                <input
                  type="url"
                  name="certificateUrl"
                  maxLength="500"
                  value={form.certificateUrl}
                  onChange={handleChange}
                  placeholder="https://..."
                />
              </label>
              <label className={styles.fullWidth}>
                <span>Remarks</span>
                <textarea
                  name="remarks"
                  maxLength="1000"
                  value={form.remarks}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Assessment notes, strengths or areas for improvement..."
                />
                <small>{form.remarks.length}/1000</small>
              </label>
            </div>
          </section>
        </main>

        <aside className={styles.reviewCard}>
          <header>
            <span>
              <Trophy size={20} />
            </span>
            <div>
              <small>Review & confirm</small>
              <h2>Promotion Summary</h2>
            </div>
          </header>
          {selectedStudent ? (
            <div className={styles.reviewStudent}>
              <img
                src={getStudentPhotoUrl(selectedStudent)}
                alt=""
                onError={(event) => {
                  event.currentTarget.src = "/default-avatar.png";
                }}
              />
              <div>
                <strong>{getStudentName(selectedStudent)}</strong>
                <span>{getStudentCode(selectedStudent)}</span>
                <small>{selectedStudent.batch?.batchName || "No batch"}</small>
              </div>
            </div>
          ) : (
            <div className={styles.reviewEmpty}>
              <UserRound size={25} />
              <span>Select a student to prepare the promotion record.</span>
            </div>
          )}
          <div className={styles.rankPreview}>
            <div>
              <small>Current Rank</small>
              <strong>{form.currentBelt || "Not selected"}</strong>
              {form.currentDanRank ? <span>{form.currentDanRank}</span> : null}
            </div>
            <ArrowRight size={18} />
            <div>
              <small>Promoted Rank</small>
              <strong>{form.promotedToBelt || "Not selected"}</strong>
              {form.promotedToDanRank ? (
                <span>{form.promotedToDanRank}</span>
              ) : null}
            </div>
          </div>
          <dl className={styles.reviewDetails}>
            <div>
              <dt>Test Date</dt>
              <dd>
                {form.testDate
                  ? new Date(`${form.testDate}T00:00:00`).toLocaleDateString(
                      "en-GB",
                      { day: "2-digit", month: "short", year: "numeric" },
                    )
                  : "Not selected"}
              </dd>
            </div>
            <div>
              <dt>Score</dt>
              <dd>
                {score === null
                  ? "Not added"
                  : `${form.marks}/${form.outOf} · ${score}%`}
              </dd>
            </div>
            <div>
              <dt>Result</dt>
              <dd
                className={
                  styles[
                    `summary${form.result.charAt(0).toUpperCase()}${form.result.slice(1)}`
                  ]
                }
              >
                {form.result}
              </dd>
            </div>
            <div>
              <dt>Examiner</dt>
              <dd>{form.examinerName || "Not added"}</dd>
            </div>
          </dl>
          <button
            className={styles.submitButton}
            type="submit"
            disabled={saving || loading}
          >
            <Award size={17} />
            {saving ? "Saving Promotion..." : "Save Belt Test"}
            <ArrowRight size={16} />
          </button>
          <button
            className={styles.resetButton}
            type="button"
            onClick={resetForm}
            disabled={saving}
          >
            <RotateCcw size={15} />
            Reset Form
          </button>
          <footer>
            <Sparkles size={15} />
            <span>
              <strong>Automatic progression</strong>A passed result updates the
              student's belt rank.
            </span>
          </footer>
        </aside>
      </form>

      {showPhotoModal && selectedStudent ? (
        <div
          className={styles.modalBackdrop}
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className={styles.photoModal}
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <small>Student profile</small>
                <h2>{getStudentName(selectedStudent)}</h2>
                <p>{getStudentCode(selectedStudent)}</p>
              </div>
              <button type="button" onClick={() => setShowPhotoModal(false)}>
                <X size={18} />
              </button>
            </header>
            <img
              src={getStudentPhotoUrl(selectedStudent)}
              alt={getStudentName(selectedStudent)}
              onError={(event) => {
                event.currentTarget.src = "/default-avatar.png";
              }}
            />
            <Link to={`/students/${selectedStudent._id}/edit`}>
              Edit Student Profile
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AddBeltTest;
