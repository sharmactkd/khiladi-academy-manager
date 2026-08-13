import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CheckCircle2, Dumbbell, Plus, Search, UserPlus, UsersRound, XCircle } from "lucide-react";

import { batchApi } from "../../api/batchApi.js";
import { academyApi } from "../../api/academyApi.js";
import { getBranches } from "../../api/branchApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import useAuth from "../../hooks/useAuth.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import MetricGrid from "../../components/common/MetricGrid.jsx";
import BatchCard from "./components/BatchCard.jsx";
import "./Batches.module.css";

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

      <MetricGrid className="batches-summary" items={[
        { id: "total", icon: Dumbbell, label: "Total Batches", value: summary.total },
        { id: "active", className: "is-green", icon: CheckCircle2, label: "Active Batches", value: summary.active },
        { id: "inactive", className: "is-slate", icon: XCircle, label: "Inactive Batches", value: summary.inactive },
        { id: "students", className: "is-blue", icon: UsersRound, label: "Enrolled Students", value: summary.students },
      ]} getCardProps={() => ({ iconSize: 21 })} />

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

      <div className="batches-results">
        {loading ? (
          <div className="batches-state"><span className="batches-spinner" /><strong>Loading batches…</strong></div>
        ) : batches.length === 0 ? (
          <div className="batches-state"><Dumbbell size={34} /><strong>No batches found</strong><p>Change the filters or create your first batch.</p><Link className="btn btn-primary" to="/batches/new"><Plus size={16} /> Add Batch</Link></div>
        ) : (
          <div className="batches-card-list">
            {batches.map((batch) => (
              <BatchCard
                key={batch._id}
                batch={batch}
                onOpen={(selectedBatch) => navigate(`/batches/${selectedBatch._id}`)}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Batches;