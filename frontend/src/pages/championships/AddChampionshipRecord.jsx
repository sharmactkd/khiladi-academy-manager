import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import ReactCountryFlag from "react-country-flag";

import { championshipRecordApi } from "../../api/championshipRecordApi.js";
import { studentApi } from "../../api/studentApi.js";
import { getStudentPhotoUrl } from "../../utils/fileUrl.js";

const CHAMPIONSHIP_TYPES = ["Open", "Official"];

const OFFICIAL_CATEGORIES = [
  "Association",
  "Federation",
  "School Games",
  "University Games",
  "National Games",
];

const LEVELS = ["District", "Regional", "State", "National", "International"];

const GRADINGS = ["G-1", "G-2", "G-4", "G-8", "G-12", "G-16", "G-20"];

const AGE_CATEGORIES = [
  "Sub-Junior",
  "Cadet",
  "Junior",
  "Senior",
  "Under-14",
  "Under-17",
  "Under-19",
];

const EVENT_TYPES = ["Kyorugi", "Fresher", "Tag Team", "Poomsae"];

const POOMSAE_TYPES = ["Individual", "Pair", "Team"];

const RESULTS = [
  "Gold",
  "Silver",
  "Bronze",
  "Participation",
  "No Medal",
  "Disqualified",
];

const DEFAULT_COUNTRY_ISO = "IN";

const initialForm = {
  student: "",
  championshipName: "",
  championshipType: "Open",
  officialCategory: "",
  level: "District",
  grading: "",
  sport: "Taekwondo",
  eventType: "Kyorugi",
  poomsaeType: "",
  gender: "Male",
  ageCategory: "",
  weightCategory: "",
  beltCategory: "",
  result: "Participation",
  ranking: "",
  totalBouts: "",
  boutsWon: "",
  boutsLost: "",
  pointsScored: "",
  pointsConceded: "",
  byeReceived: false,
  walkoverWin: false,
  walkoverLoss: false,
  startDate: "",
  endDate: "",
  venue: "",
  district: "",
  state: "",
  country: "India",
  organizer: "",
  association: "",
  registrationNumber: "",
  sanctionNumber: "",
  certificateUrl: "",
  medalPhotoUrl: "",
  podiumPhotoUrl: "",
  matchVideoUrl: "",
  youtubeUrl: "",
  newsUrl: "",
  remarks: "",
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

const getStudentName = (student) => {
  const fullName = `${student?.firstName || ""} ${
    student?.lastName || ""
  }`.trim();

  return student?.name || fullName || "Student";
};

const getStudentCode = (student) =>
  student?.studentCode || student?.admissionNumber || "-";

const getCountryIsoFromName = (countries, countryName = "India") => {
  const matched =
    countries.find((item) => item.name === countryName) ||
    countries.find((item) => item.isoCode === DEFAULT_COUNTRY_ISO);

  return matched?.isoCode || DEFAULT_COUNTRY_ISO;
};

const AddChampionshipRecord = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const countries = useMemo(() => Country.getAllCountries(), []);
  const studentIdFromUrl = searchParams.get("student") || "";

  const [form, setForm] = useState({
    ...initialForm,
    student: studentIdFromUrl,
  });

  const [students, setStudents] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const [selectedCountryIso, setSelectedCountryIso] = useState(
    getCountryIsoFromName(countries, form.country)
  );
  const [selectedStateIso, setSelectedStateIso] = useState("");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");

  const states = useMemo(
    () => State.getStatesOfCountry(selectedCountryIso),
    [selectedCountryIso]
  );

  const districts = useMemo(() => {
    if (!selectedCountryIso || !selectedStateIso) return [];
    return City.getCitiesOfState(selectedCountryIso, selectedStateIso);
  }, [selectedCountryIso, selectedStateIso]);

  const selectedCountry = useMemo(() => {
    return (
      countries.find((item) => item.isoCode === selectedCountryIso) ||
      countries.find((item) => item.isoCode === DEFAULT_COUNTRY_ISO)
    );
  }, [countries, selectedCountryIso]);

  const filteredCountries = useMemo(() => {
    const search = countrySearch.trim().toLowerCase();

    if (!search) return countries;

    return countries.filter(
      (item) =>
        item.name.toLowerCase().includes(search) ||
        item.isoCode.toLowerCase().includes(search)
    );
  }, [countries, countrySearch]);

  const selectedStudent = useMemo(() => {
    return (
      students.find(
        (student) => String(student._id) === String(form.student)
      ) || null
    );
  }, [students, form.student]);

  const showOfficialFields = form.championshipType === "Official";
  const showGrading =
    form.championshipType === "Official" && form.level === "International";
  const showPoomsaeType = form.eventType === "Poomsae";

  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await studentApi.getAll({});
        const list = normalizeList(response, "students");

        setStudents(list);

        if (studentIdFromUrl) {
          const matchedStudent = list.find(
            (student) => String(student._id) === String(studentIdFromUrl)
          );

          setForm((prev) => ({
            ...prev,
            student: studentIdFromUrl,
            weightCategory:
              matchedStudent?.weightCategory || prev.weightCategory,
            sport: matchedStudent?.martialArt || prev.sport || "Taekwondo",
          }));
        }
      } catch {
        setStudents([]);
      }
    };

    loadStudents();
  }, [studentIdFromUrl]);

  const updateField = (name, value) => {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    const finalValue = type === "checkbox" ? checked : value;

    if (name === "championshipType") {
      setForm((prev) => ({
        ...prev,
        championshipType: value,
        officialCategory: value === "Official" ? prev.officialCategory : "",
        grading: value === "Official" ? prev.grading : "",
      }));
      return;
    }

    if (name === "level") {
      setForm((prev) => ({
        ...prev,
        level: value,
        grading:
          prev.championshipType === "Official" && value === "International"
            ? prev.grading
            : "",
      }));
      return;
    }

    if (name === "eventType") {
      setForm((prev) => ({
        ...prev,
        eventType: value,
        poomsaeType: value === "Poomsae" ? prev.poomsaeType : "",
      }));
      return;
    }

    updateField(name, finalValue);
  };

  const handleCountrySelect = (country) => {
    setSelectedCountryIso(country.isoCode);
    setSelectedStateIso("");
    setCountrySearch("");
    setShowCountryDropdown(false);

    setForm((prev) => ({
      ...prev,
      country: country.name || "",
      state: "",
      district: "",
    }));
  };

  const handleStateChange = (event) => {
    const isoCode = event.target.value;
    const state = states.find((item) => item.isoCode === isoCode);

    setSelectedStateIso(isoCode);

    setForm((prev) => ({
      ...prev,
      state: state?.name || "",
      district: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (form.endDate && form.startDate && form.endDate < form.startDate) {
        setError("End Date start date se pehle nahi ho sakti");
        setSaving(false);
        return;
      }

      if (
        form.totalBouts !== "" &&
        Number(form.boutsWon || 0) + Number(form.boutsLost || 0) >
          Number(form.totalBouts)
      ) {
        setError("Won + Lost bouts total bouts se zyada nahi ho sakte");
        setSaving(false);
        return;
      }

      await championshipRecordApi.create({
        ...form,
        date: form.startDate
          ? new Date(form.startDate).toISOString()
          : new Date().toISOString(),
        startDate: form.startDate
          ? new Date(form.startDate).toISOString()
          : new Date().toISOString(),
        endDate: form.endDate
          ? new Date(form.endDate).toISOString()
          : form.startDate
          ? new Date(form.startDate).toISOString()
          : new Date().toISOString(),
      });

      alert("Championship record created successfully");
      navigate("/championship-records");
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to create championship record"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Add Championship Record</h1>
          <p>Add tournament participation, medal or certificate record.</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <form className="card form-grid" onSubmit={handleSubmit}>
        <label>
          Student
          <select
            name="student"
            value={form.student}
            onChange={handleChange}
            required
          >
            <option value="">Select Student</option>

            {students.map((student) => (
              <option key={student._id} value={student._id}>
                {getStudentName(student)} ({getStudentCode(student)})
              </option>
            ))}
          </select>
        </label>

        <label>
          Championship Name
          <input
            name="championshipName"
            value={form.championshipName}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Championship Type
          <select
            name="championshipType"
            value={form.championshipType}
            onChange={handleChange}
          >
            {CHAMPIONSHIP_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        {showOfficialFields && (
          <label>
            Official Category
            <select
              name="officialCategory"
              value={form.officialCategory}
              onChange={handleChange}
              required
            >
              <option value="">Select Official Category</option>
              {OFFICIAL_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Level
          <select name="level" value={form.level} onChange={handleChange}>
            {LEVELS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        {showGrading && (
          <label>
            Grading
            <select
              name="grading"
              value={form.grading}
              onChange={handleChange}
              required
            >
              <option value="">Select Grading</option>
              {GRADINGS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        )}

        {selectedStudent && (
          <div className="full-width card subtle-card">
            <h3>Student Photo</h3>

            <button
              type="button"
              onClick={() => setShowPhotoModal(true)}
              style={{
                border: 0,
                background: "transparent",
                padding: 0,
                cursor: "pointer",
              }}
            >
              <img
                src={getStudentPhotoUrl(selectedStudent)}
                alt={getStudentName(selectedStudent)}
                onError={(event) => {
                  event.currentTarget.src = "/default-avatar.png";
                }}
                style={{
                  width: "120px",
                  height: "150px",
                  objectFit: "cover",
                  borderRadius: "12px",
                  border: "1px solid #d1d5db",
                  background: "#ffffff",
                }}
              />
            </button>

            <p style={{ marginTop: "10px", marginBottom: 0 }}>
              {getStudentName(selectedStudent)} ({getStudentCode(selectedStudent)})
            </p>
          </div>
        )}

        <label>
          Sport / Martial Art
          <input name="sport" value={form.sport} onChange={handleChange} />
        </label>

        <label>
          Event Type
          <select
            name="eventType"
            value={form.eventType}
            onChange={handleChange}
          >
            {EVENT_TYPES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        {showPoomsaeType && (
          <label>
            Poomsae Type
            <select
              name="poomsaeType"
              value={form.poomsaeType}
              onChange={handleChange}
              required
            >
              <option value="">Select Poomsae Type</option>
              {POOMSAE_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Gender
          <select name="gender" value={form.gender} onChange={handleChange}>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Mixed">Mixed</option>
          </select>
        </label>

        <label>
          Age Category
          <select
            name="ageCategory"
            value={form.ageCategory}
            onChange={handleChange}
            required
          >
            <option value="">Select Age Category</option>
            {AGE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Weight Category
          <input
            name="weightCategory"
            value={form.weightCategory}
            onChange={handleChange}
          />
        </label>

        <label>
          Belt Category
          <input
            name="beltCategory"
            value={form.beltCategory}
            onChange={handleChange}
          />
        </label>

        <label>
          Result
          <select name="result" value={form.result} onChange={handleChange}>
            {RESULTS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          Ranking
          <input
            type="number"
            min="1"
            name="ranking"
            value={form.ranking}
            onChange={handleChange}
          />
        </label>

        <label>
          Total Bouts / Fights
          <input
            type="number"
            min="0"
            name="totalBouts"
            value={form.totalBouts}
            onChange={handleChange}
          />
        </label>

        <label>
          Bouts Won
          <input
            type="number"
            min="0"
            name="boutsWon"
            value={form.boutsWon}
            onChange={handleChange}
          />
        </label>

        <label>
          Bouts Lost
          <input
            type="number"
            min="0"
            name="boutsLost"
            value={form.boutsLost}
            onChange={handleChange}
          />
        </label>

        <label>
          Points Scored
          <input
            type="number"
            min="0"
            name="pointsScored"
            value={form.pointsScored}
            onChange={handleChange}
          />
        </label>

        <label>
          Points Conceded
          <input
            type="number"
            min="0"
            name="pointsConceded"
            value={form.pointsConceded}
            onChange={handleChange}
          />
        </label>

        <label>
          Start Date
          <input
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          End Date
          <input
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Venue
          <input name="venue" value={form.venue} onChange={handleChange} />
        </label>

        <label>
          Country
          <div style={{ position: "relative" }}>
            <button
              type="button"
              onClick={() => setShowCountryDropdown((prev) => !prev)}
              style={{
                width: "100%",
                minHeight: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #d1d5db",
                borderRadius: "10px",
                background: "#fff",
                color: "#111827",
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ReactCountryFlag
                  countryCode={selectedCountryIso}
                  svg
                  style={{ width: 22, height: 22, borderRadius: "50%" }}
                />
                {selectedCountry?.name || form.country || "India"}
              </span>
              <span>▾</span>
            </button>

            {showCountryDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: 48,
                  left: 0,
                  right: 0,
                  zIndex: 80,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.16)",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: 10 }}>
                  <input
                    value={countrySearch}
                    onChange={(event) => setCountrySearch(event.target.value)}
                    placeholder="Search country..."
                  />
                </div>

                <div style={{ maxHeight: 260, overflowY: "auto" }}>
                  {filteredCountries.map((country) => (
                    <button
                      type="button"
                      key={country.isoCode}
                      onClick={() => handleCountrySelect(country)}
                      style={{
                        width: "100%",
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        border: 0,
                        background:
                          country.isoCode === selectedCountryIso
                            ? "#eff6ff"
                            : "#fff",
                        padding: "10px 12px",
                        cursor: "pointer",
                      }}
                    >
                      <ReactCountryFlag
                        countryCode={country.isoCode}
                        svg
                        style={{ width: 22, height: 22, borderRadius: "50%" }}
                      />
                      <span>{country.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </label>

        <label>
          State
          <select value={selectedStateIso} onChange={handleStateChange}>
            <option value="">Select State</option>
            {states.map((state) => (
              <option key={state.isoCode} value={state.isoCode}>
                {state.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          District
          <select
            name="district"
            value={form.district}
            onChange={handleChange}
            disabled={!selectedStateIso}
          >
            <option value="">Select District</option>
            {districts.map((district) => (
              <option key={district.name} value={district.name}>
                {district.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Organizer
          <input
            name="organizer"
            value={form.organizer}
            onChange={handleChange}
          />
        </label>

        <label>
          Association / Federation
          <input
            name="association"
            value={form.association}
            onChange={handleChange}
          />
        </label>

        <label>
          Registration Number
          <input
            name="registrationNumber"
            value={form.registrationNumber}
            onChange={handleChange}
          />
        </label>

        <label>
          Sanction Number
          <input
            name="sanctionNumber"
            value={form.sanctionNumber}
            onChange={handleChange}
          />
        </label>

        <label>
          Certificate URL
          <input
            name="certificateUrl"
            value={form.certificateUrl}
            onChange={handleChange}
          />
        </label>

        <label>
          Medal Photo URL
          <input
            name="medalPhotoUrl"
            value={form.medalPhotoUrl}
            onChange={handleChange}
          />
        </label>

        <label>
          Podium Photo URL
          <input
            name="podiumPhotoUrl"
            value={form.podiumPhotoUrl}
            onChange={handleChange}
          />
        </label>

        <label>
          Match Video URL
          <input
            name="matchVideoUrl"
            value={form.matchVideoUrl}
            onChange={handleChange}
          />
        </label>

        <label>
          YouTube URL
          <input
            name="youtubeUrl"
            value={form.youtubeUrl}
            onChange={handleChange}
          />
        </label>

        <label>
          News URL
          <input name="newsUrl" value={form.newsUrl} onChange={handleChange} />
        </label>

        <div className="full-width checkbox-row">
          <label>
            <input
              type="checkbox"
              name="byeReceived"
              checked={form.byeReceived}
              onChange={handleChange}
            />
            Bye Received
          </label>

          <label>
            <input
              type="checkbox"
              name="walkoverWin"
              checked={form.walkoverWin}
              onChange={handleChange}
            />
            Walkover Win
          </label>

          <label>
            <input
              type="checkbox"
              name="walkoverLoss"
              checked={form.walkoverLoss}
              onChange={handleChange}
            />
            Walkover Loss
          </label>
        </div>

        <label className="full-width">
          Remarks
          <textarea
            name="remarks"
            value={form.remarks}
            onChange={handleChange}
            rows="4"
          />
        </label>

        <div className="form-actions full-width">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Record"}
          </button>

          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => navigate("/championship-records")}
          >
            Cancel
          </button>
        </div>
      </form>

      {showPhotoModal && selectedStudent && (
        <div
          onClick={() => setShowPhotoModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.72)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(520px, 95vw)",
              background: "#ffffff",
              borderRadius: "18px",
              padding: "24px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div className="page-header">
              <div>
                <h2>Student Photo</h2>
                <p>
                  {getStudentName(selectedStudent)} (
                  {getStudentCode(selectedStudent)})
                </p>
              </div>

              <button
                type="button"
                className="btn"
                onClick={() => setShowPhotoModal(false)}
              >
                Close
              </button>
            </div>

            <div style={{ textAlign: "center", margin: "24px 0" }}>
              <img
                src={getStudentPhotoUrl(selectedStudent)}
                alt={getStudentName(selectedStudent)}
                onError={(event) => {
                  event.currentTarget.src = "/default-avatar.png";
                }}
                style={{
                  maxWidth: "100%",
                  maxHeight: "420px",
                  objectFit: "contain",
                  borderRadius: "14px",
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  padding: "8px",
                }}
              />
            </div>

            <div className="form-actions">
              <Link
                className="btn btn-primary"
                to={`/students/${selectedStudent._id}/edit`}
              >
                Change Photo
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddChampionshipRecord;