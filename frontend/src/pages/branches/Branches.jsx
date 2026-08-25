import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Crown,
  Plus,
  Search,
  XCircle,
} from "lucide-react";

import { academyApi } from "../../api/academyApi.js";
import { batchApi } from "../../api/batchApi.js";
import { deleteBranch, getBranches } from "../../api/branchApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import useAuth from "../../hooks/useAuth.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import MetricGrid from "../../components/common/MetricGrid.jsx";
import BranchCard from "./components/BranchCard.jsx";
import { PAGE_SIZE } from "./branch.config.js";
import { joinAddressParts, unwrapList } from "./branch.utils.js";
import "./Branches.module.css";


const Branches = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageBranches = ["super_admin", "academy_owner"].includes(user?.role);
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "active" });
  const [appliedFilters, setAppliedFilters] = useState({ search: "", status: "active" });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deactivatingId, setDeactivatingId] = useState("");
  const [error, setError] = useState("");

  const loadPage = useCallback(async ({ quiet = false, nextFilters = appliedFilters } = {}) => {
    if (!quiet) setLoading(true);
    setError("");

    try {
      const [academyResult, filteredResult, overviewResult, batchesResult] = await Promise.allSettled([
        academyApi.getMyAcademy(),
        getBranches(nextFilters),
        getBranches({ status: "all" }),
        batchApi.getAll(),
      ]);

      if (filteredResult.status === "rejected") throw filteredResult.reason;

      setBranches(unwrapList(filteredResult.value));
      setAllBranches(
        overviewResult.status === "fulfilled"
          ? unwrapList(overviewResult.value)
          : unwrapList(filteredResult.value)
      );
      setBatches(batchesResult.status === "fulfilled" ? unwrapList(batchesResult.value) : []);
      setAcademy(
        academyResult.status === "fulfilled"
          ? academyResult.value?.data?.data?.academy || academyResult.value?.data?.academy || null
          : null
      );
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load branches. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => { loadPage(); }, [loadPage]);

  const activeBranches = useMemo(
    () => allBranches.filter((branch) => branch?.isActive !== false),
    [allBranches]
  );
  const inactiveBranches = allBranches.length - activeBranches.length;
  const mainBranch = allBranches.find((branch) => branch?.isMainBranch) || activeBranches[0] || null;
  const activeBatchCount = batches.filter((batch) => batch?.isActive !== false).length;
  const academyName = academy?.academyName || "KHILADI Academy";
  const ownerName = academy?.ownerName || user?.name || "Academy Owner";
  const logoUrl = academy?.logo ? getAcademyLogoUrl(academy) : "";
  const mainBranchAddress = joinAddressParts([
    mainBranch?.address || academy?.address,
    mainBranch?.city || academy?.city,
    mainBranch?.state || academy?.state,
    mainBranch?.country || academy?.country,
  ]);

  const totalPages = Math.max(1, Math.ceil(branches.length / PAGE_SIZE));
  const visibleBranches = branches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const applyFilters = (event) => {
    event?.preventDefault();
    const next = { search: filters.search.trim(), status: filters.status };
    setCurrentPage(1);
    setAppliedFilters(next);
  };

  const changeStatus = (status) => {
    setFilters((current) => ({ ...current, status }));
    setAppliedFilters((current) => ({ ...current, status }));
    setCurrentPage(1);
  };

  const handleDeactivate = async (branch) => {
    if (!canManageBranches) return;
    if (!window.confirm(`Deactivate ${branch.branchName || "this branch"}?`)) return;
    try {
      setDeactivatingId(branch._id);
      await deleteBranch(branch._id);
      await loadPage({ quiet: true });
    } catch (requestError) {
      window.alert(requestError?.response?.data?.message || "Failed to deactivate branch");
    } finally {
      setDeactivatingId("");
    }
  };

  return (
    <div className="page branches-page">
      <AcademyHeroHeader
        headingId="branches-academy-name"
        academyName={academyName}
        ownerName={ownerName}
        logoUrl={logoUrl}
        addressLabel={mainBranch?.branchName || "Main Branch"}
        address={mainBranchAddress || "Complete main branch address not available"}
        summaryItems={[
          { key: "branches", type: "branches", value: activeBranches.length, label: `Active ${activeBranches.length === 1 ? "Branch" : "Branches"}` },
          { key: "batches", type: "batches", value: activeBatchCount, label: `Active ${activeBatchCount === 1 ? "Batch" : "Batches"}` },
        ]}
      />

      <header className="branches-heading">
        <div><span>Academy network</span><h2>Branches</h2><p>Manage every academy location, coach and operational status from one workspace.</p></div>
        {canManageBranches ? <Link to="/branches/new" className="btn btn-primary branches-add-button"><Plus size={17} /> Add Branch</Link> : null}
      </header>

      <MetricGrid className="branches-stats" items={[
        { id: "total", icon: Building2, label: "Total branches", value: allBranches.length, tone: "red" },
        { id: "active", icon: CheckCircle2, label: "Active branches", value: activeBranches.length, tone: "green" },
        { id: "inactive", icon: XCircle, label: "Inactive branches", value: inactiveBranches, tone: "slate" },
        { id: "main", icon: Crown, label: "Main branch", value: mainBranch ? 1 : 0, tone: "gold" },
      ]} getCardProps={(item) => ({ className: `branches-stat branches-stat--${item.tone}`, iconSize: 22 })} />

      <form className="branches-filters" onSubmit={applyFilters}>
        <label className="branches-search">
          <Search size={17} aria-hidden="true" />
          <input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="Search branch, code, district or coach…" />
        </label>
        <div className="branches-status-filter" aria-label="Filter by status">
          {["active", "inactive", "all"].map((status) => (
            <button key={status} type="button" className={filters.status === status ? "is-active" : ""} onClick={() => changeStatus(status)}>{status}</button>
          ))}
        </div>
        <button className="btn btn-secondary" type="submit"><Search size={16} /> Search</button>
      </form>

      {error ? <div className="branches-error" role="alert">{error}<button type="button" onClick={() => loadPage()}>Retry</button></div> : null}

      <section className="branches-results" aria-busy={loading}>
        {loading ? <div className="branches-state"><span className="branches-spinner" /><strong>Loading branches…</strong></div> : visibleBranches.length ? (
          <div className="branches-card-list">{visibleBranches.map((branch) => <BranchCard key={branch._id} branch={branch} canManage={canManageBranches} busy={deactivatingId===branch._id} onOpen={(item)=>navigate(`/branches/${item._id}`)} onDeactivate={handleDeactivate}/>)}</div>
        ) : <div className="branches-state"><Building2 size={34} /><strong>No branches found</strong><p>{canManageBranches ? "Try another filter or add your first branch." : "Try another search or status filter."}</p>{canManageBranches ? <Link to="/branches/new" className="btn btn-primary branches-add-button"><Plus size={16} /> Add Branch</Link> : null}</div>}

        {!loading && branches.length > PAGE_SIZE ? <footer className="branches-pagination"><span>Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, branches.length)} of {branches.length}</span><div><button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button type="button" key={page} className={currentPage === page ? "is-active" : ""} onClick={() => setCurrentPage(page)}>{page}</button>)}<button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button></div></footer> : null}
      </section>
    </div>
  );
};

export default Branches;
