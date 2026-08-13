import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  Crown,
  MapPin,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";

import { academyApi } from "../../api/academyApi.js";
import { batchApi } from "../../api/batchApi.js";
import { deleteBranch, getBranches } from "../../api/branchApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import useAuth from "../../hooks/useAuth.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import BranchStatCard from "./components/BranchStatCard.jsx";
import { PAGE_SIZE } from "./branch.config.js";
import { joinAddressParts, unwrapList } from "./branch.utils.js";
import "./Branches.module.css";


const displayValue = (value) => String(value ?? "").trim() || "-";
const displayPhone = (countryCode, phone) => {
  const number = String(phone ?? "").trim();
  return number ? `${String(countryCode || "+91").trim()} ${number}` : "-";
};

const Branches = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [academy, setAcademy] = useState(null);
  const [branches, setBranches] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [batches, setBatches] = useState([]);
  const [filters, setFilters] = useState({ search: "", status: "active" });
  const [appliedFilters, setAppliedFilters] = useState({ search: "", status: "active" });
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState("");
  const [error, setError] = useState("");

  const loadPage = useCallback(async ({ quiet = false, nextFilters = appliedFilters } = {}) => {
    quiet ? setRefreshing(true) : setLoading(true);
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
      setRefreshing(false);
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
        action={
          <button className="branches-hero-refresh" type="button" onClick={() => loadPage({ quiet: true })} disabled={refreshing}>
            <RefreshCw size={16} className={refreshing ? "is-spinning" : ""} />
            {refreshing ? "Refreshing" : "Refresh"}
          </button>
        }
      />

      <header className="branches-heading">
        <div><span>Academy network</span><h2>Branches</h2><p>Manage every academy location, coach and operational status from one workspace.</p></div>
        <Link to="/branches/new" className="btn btn-primary"><Plus size={17} /> Add Branch</Link>
      </header>

      <section className="branches-stats" aria-label="Branch summary">
        <BranchStatCard icon={Building2} label="Total branches" value={allBranches.length} />
        <BranchStatCard icon={CheckCircle2} label="Active branches" value={activeBranches.length} tone="green" />
        <BranchStatCard icon={XCircle} label="Inactive branches" value={inactiveBranches} tone="slate" />
        <BranchStatCard icon={Crown} label="Main branch" value={mainBranch ? 1 : 0} tone="gold" />
      </section>

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

      <section className="branches-table-card" aria-busy={loading}>
        {loading ? <div className="branches-state"><span className="branches-spinner" /><strong>Loading branches…</strong></div> : visibleBranches.length ? (
          <div className="branches-table-wrap">
            <table className="branches-table">
              <thead><tr><th>Branch</th><th>Code</th><th>District</th><th>Branch phone</th><th>Head coach</th><th>Coach phone</th><th>Main</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{visibleBranches.map((branch) => (
                <tr key={branch._id} onClick={() => navigate(`/branches/${branch._id}`)}>
                  <td><div className="branches-identity"><span><Building2 size={17} /></span><div><strong>{displayValue(branch.branchName)}</strong><small><MapPin size={11} /> {displayValue(branch.address || branch.city)}</small></div></div></td>
                  <td><code>{displayValue(branch.branchCode)}</code></td>
                  <td>{displayValue(branch.city || branch.district)}</td>
                  <td>{displayPhone(branch.countryCode, branch.phone)}</td>
                  <td><span className="branches-coach"><UserRound size={14} /> {displayValue(branch.headCoachName)}</span></td>
                  <td>{displayPhone(branch.headCoachCountryCode, branch.headCoachPhone)}</td>
                  <td>{branch.isMainBranch ? <span className="branches-main-badge"><Crown size={12} /> Main</span> : <span className="branches-muted">—</span>}</td>
                  <td><span className={`branches-status ${branch.isActive !== false ? "branches-status--active" : "branches-status--inactive"}`}><i />{branch.isActive !== false ? "Active" : "Inactive"}</span></td>
                  <td onClick={(event) => event.stopPropagation()}><div className="branches-actions"><Link to={`/branches/${branch._id}/edit`} title="Edit branch"><Pencil size={15} /><span>Edit</span></Link>{branch.isActive !== false ? <button type="button" onClick={() => handleDeactivate(branch)} disabled={deactivatingId === branch._id} title="Deactivate branch"><Power size={15} /><span>{deactivatingId === branch._id ? "Working" : "Deactivate"}</span></button> : null}</div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <div className="branches-state"><Building2 size={34} /><strong>No branches found</strong><p>Try another filter or add your first branch.</p><Link to="/branches/new" className="btn btn-primary"><Plus size={16} /> Add Branch</Link></div>}

        {!loading && branches.length > PAGE_SIZE ? <footer className="branches-pagination"><span>Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, branches.length)} of {branches.length}</span><div><button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous</button>{Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button type="button" key={page} className={currentPage === page ? "is-active" : ""} onClick={() => setCurrentPage(page)}>{page}</button>)}<button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next</button></div></footer> : null}
      </section>
    </div>
  );
};

export default Branches;
