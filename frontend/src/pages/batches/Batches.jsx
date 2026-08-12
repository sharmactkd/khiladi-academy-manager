import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, Dumbbell, Plus, Search, Trash2, UserPlus, UsersRound, XCircle } from "lucide-react";

import { batchApi } from "../../api/batchApi.js";
import { academyApi } from "../../api/academyApi.js";
import { getBranches } from "../../api/branchApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import useAuth from "../../hooks/useAuth.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";

const formatTime = (time) => {
  if (!time) return "-";

  const [hours, minutes] = time.split(":");

  const date = new Date();
  date.setHours(Number(hours));
  date.setMinutes(Number(minutes));

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const formatLabel = (value) => {
  const text = String(value || "").trim();

  if (!text) return "-";

  return text
    .split("-")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
};

const formatGenderGroup = (value) => {
  if (value === "male") return "Male";
  if (value === "female") return "Female";
  return "Male & Female";
};

const Batches = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [status, setStatus] = useState("");
  const [batchType, setBatchType] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);

      const [batchResult, academyResult, branchResult] = await Promise.allSettled([
        batchApi.getAll({
          batchType: batchType || undefined,
          skillLevel: skillLevel || undefined,
        }),
        academyApi.getMyAcademy(),
        getBranches({ status: "all" }),
      ]);

      if (batchResult.status === "rejected") throw batchResult.reason;
      const response = batchResult.value;

      const list = response.data?.data || [];

      const filteredList =
        status === "active"
          ? list.filter((batch) => batch.isActive)
          : status === "inactive"
            ? list.filter((batch) => !batch.isActive)
            : list;

      setBatches(filteredList);
      if (academyResult.status === "fulfilled") {
        setAcademy(academyResult.value?.data?.data?.academy || academyResult.value?.data?.academy || null);
      }
      if (branchResult.status === "fulfilled") {
        const candidates = [branchResult.value?.data?.data, branchResult.value?.data, branchResult.value];
        setBranches(candidates.find(Array.isArray) || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Batches load nahi hue");
    } finally {
      setLoading(false);
    }
  }, [batchType, skillLevel, status]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const summary = useMemo(() => ({
    total: batches.length,
    active: batches.filter((batch) => batch.isActive !== false).length,
    inactive: batches.filter((batch) => batch.isActive === false).length,
    students: batches.reduce((sum, batch) => sum + (batch.students?.length || 0), 0),
  }), [batches]);

  const activeBranches = branches.filter((branch) => branch?.isActive !== false);
  const mainBranch = branches.find((branch) => branch?.isMainBranch) || activeBranches[0] || null;
  const heroAddress = [
    mainBranch?.address || academy?.address,
    mainBranch?.city || academy?.city,
    mainBranch?.state || academy?.state,
    mainBranch?.country || academy?.country,
  ].filter(Boolean).join(", ");

  const handleToggleStatus = async (batch) => {
    try {
      if (batch.isActive) {
        if (!window.confirm("Batch ko inactive karna hai?")) return;

        await batchApi.remove(batch._id);
        toast.success("Batch inactive ho gaya");
      } else {
        await batchApi.update(batch._id, {
          ...batch,
          isActive: true,
        });
        toast.success("Batch active ho gaya");
      }

      fetchBatches();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Batch status update nahi hua"
      );
    }
  };

  const handleDelete = async (batch) => {
    const confirmed = window.confirm(
      `Kya aap sach me "${batch.batchName}" batch ko permanently delete karna chahte hain?`
    );

    if (!confirmed) return;

    try {
      await batchApi.remove(batch._id);
      toast.success("Batch delete ho gaya");
      fetchBatches();
    } catch (error) {
      toast.error(error.response?.data?.message || "Batch delete nahi hua");
    }
  };

  return (
    <div className="page branches-page batches-page">
      <AcademyHeroHeader
        headingId="batches-academy-name"
        academyName={academy?.academyName || "KHILADI Academy"}
        ownerName={academy?.ownerName || user?.name || "Academy Owner"}
        logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""}
        addressLabel={mainBranch?.branchName || "Main Branch"}
        address={heroAddress || "Complete main branch address not available"}
        summaryItems={[
          { key: "branches", type: "branches", value: activeBranches.length, label: "Active Branches" },
          { key: "batches", type: "batches", value: summary.active, label: "Active Batches" },
        ]}
      />

      <div className="batches-heading">
        <div>
          <span>Training operations</span>
          <h1>Batches</h1>
          <p>Manage schedules, coaches, eligibility, capacity and fees from one workspace.</p>
        </div>

        <div className="batches-heading__actions">
          <Link className="btn btn-outline" to="/students/new">
            <UserPlus size={16} /> Add Student
          </Link>

          <Link className="btn btn-primary" to="/batches/new">
            <Plus size={16} /> Add Batch
          </Link>
        </div>
      </div>

      <section className="batches-summary">
        <article><span><Dumbbell size={21} /></span><div><small>Total Batches</small><strong>{summary.total}</strong></div></article>
        <article className="is-green"><span><CheckCircle2 size={21} /></span><div><small>Active Batches</small><strong>{summary.active}</strong></div></article>
        <article className="is-slate"><span><XCircle size={21} /></span><div><small>Inactive Batches</small><strong>{summary.inactive}</strong></div></article>
        <article className="is-blue"><span><UsersRound size={21} /></span><div><small>Enrolled Students</small><strong>{summary.students}</strong></div></article>
      </section>

      <div className="batches-filters">
        <div className="batches-filters__title"><Search size={17} /><div><strong>Filter batches</strong><small>Narrow the training schedule.</small></div></div>
        <div className="batches-filters__grid">
          <label>
            Status
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <label>
            Batch Type
            <select
              value={batchType}
              onChange={(event) => setBatchType(event.target.value)}
            >
              <option value="">All Types</option>
              <option value="regular">Regular</option>
              <option value="competition">Competition Team</option>
              <option value="poomsae">Poomsae Team</option>
              <option value="sparring">Sparring Team</option>
              <option value="fitness">Fitness Batch</option>
              <option value="kids">Kids Batch</option>
              <option value="adults">Adults Batch</option>
              <option value="black-belt">Black Belt Batch</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          <label>
            Skill Level
            <select
              value={skillLevel}
              onChange={(event) => setSkillLevel(event.target.value)}
            >
              <option value="">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="elite">Elite</option>
              <option value="mixed">Mixed</option>
            </select>
          </label>
        </div>
      </div>

      <div className="batches-table-card">
        {loading ? (
          <div className="batches-state"><span className="batches-spinner" /><strong>Loading batches…</strong></div>
        ) : batches.length === 0 ? (
          <div className="batches-state"><Dumbbell size={34} /><strong>No batches found</strong><p>Change the filters or create your first batch.</p><Link className="btn btn-primary" to="/batches/new"><Plus size={16} /> Add Batch</Link></div>
        ) : (
          <div className="batches-table-wrap">
            <table className="batches-table">
              <thead>
                <tr>
                  <th>Batch</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Level</th>
                  <th>Martial Art</th>
                  <th>Gender</th>
                  <th>Days</th>
                  <th>Time</th>
                  <th>Students</th>
                  <th>Coach</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {batches.map((batch) => (
                  <tr
                    key={batch._id}
                    onClick={() => navigate(`/batches/${batch._id}`)}
                  >
                    <td>
                      <strong>{batch.batchName}</strong>
                      {batch.isCompetitionBatch ? (
                        <small className="batches-competition">Competition Batch</small>
                      ) : null}
                    </td>

                    <td>{batch.batchCode || "-"}</td>

                    <td>{formatLabel(batch.batchType)}</td>

                    <td>{formatLabel(batch.skillLevel)}</td>

                    <td>{batch.martialArt || "-"}</td>

                    <td>{formatGenderGroup(batch.genderGroup)}</td>

                    <td>
                      {batch.schedule?.map((item) => item.day).join(", ") ||
                        "-"}
                    </td>

                    <td>
                      {formatTime(batch.schedule?.[0]?.startTime)} -{" "}
                      {formatTime(batch.schedule?.[0]?.endTime)}
                    </td>

                    <td>
                      {batch.students?.length || 0} / {batch.capacity || 0}
                    </td>

                    <td>{batch.headCoachName || batch.coach?.name || "-"}</td>

                    <td>
                      <span className={"batches-status batches-status--" + (batch.isActive ? "active" : "inactive")}>
                        {batch.isActive ? "active" : "inactive"}
                      </span>
                    </td>

                    <td
                      className="batches-actions"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Link className="batches-action batches-action--edit" to={`/batches/${batch._id}/edit`}>Edit</Link>

                      <button
                        type="button"
                        className={"batches-action batches-action--status " + (batch.isActive ? "is-active" : "is-inactive")}
                        onClick={() => handleToggleStatus(batch)}
                      >
                        {batch.isActive ? "Inactive" : "Active"}
                      </button>

                      <button
                        type="button"
                        className="batches-action batches-action--delete"
                        onClick={() => handleDelete(batch)}
                        title="Delete Batch"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Batches;