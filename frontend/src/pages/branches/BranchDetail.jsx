import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Award, Building2, CalendarCheck2, CalendarDays, CheckCircle2,
  Crown, Dumbbell, Edit3, CircleDollarSign as IndianRupee, Languages, Mail, MapPin, Phone,
  ShieldCheck, UserRound, Users, UsersRound, Warehouse, XCircle,
  WalletCards,
} from "lucide-react";

import { academyApi } from "../../api/academyApi.js";
import { getBranchById } from "../../api/branchApi.js";
import AcademyHeroHeader from "../../components/academy/AcademyHeroHeader.jsx";
import useAuth from "../../hooks/useAuth.js";
import { getAcademyLogoUrl } from "../../utils/fileUrl.js";
import BranchDetailSectionHeader from "./components/BranchDetailSectionHeader.jsx";
import "./BranchDetail.module.css";
import { currencyMeta, formatMoney } from "../../utils/currency.js";

const displayValue = (value, fallback = "Not added") =>
  String(value ?? "").trim() || fallback;

const normalizeList = (...values) =>
  [...new Set(values.flat().filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];

const normalizePhones = (branch) => {
  const stored = Array.isArray(branch?.phoneNumbers) ? branch.phoneNumbers : [];
  const phones = stored.filter((item) => item?.phone).map((item, index) => ({
    countryCode: item.countryCode || "+91",
    phone: item.phone,
    isPrimary: index === 0 || item.isPrimary,
  }));
  if (!phones.length && branch?.phone) {
    phones.push({ countryCode: branch.countryCode || "+91", phone: branch.phone, isPrimary: true });
  }
  return phones;
};

const joinAddress = (branch) =>
  [branch?.address, branch?.city, branch?.state, branch?.country]
    .map((part) => String(part || "").trim())
    .filter((part, index, items) =>
      part && items.findIndex((item) => item.toLowerCase() === part.toLowerCase()) === index
    ).join(", ");

const DetailItem = ({ icon: Icon, label, children, wide = false }) => (
  <div className={"branch-detail-item" + (wide ? " branch-detail-item--wide" : "")}>
    <span className="branch-detail-item__icon"><Icon size={17} aria-hidden="true" /></span>
    <div><small>{label}</small><strong>{children}</strong></div>
  </div>
);

const MetricCard = ({ icon: Icon, label, value, tone = "red" }) => (
  <article className={"branch-detail-metric branch-detail-metric--" + tone}>
    <span><Icon size={22} aria-hidden="true" /></span>
    <div><small>{label}</small><strong>{value}</strong></div>
  </article>
);

const CoachCard = ({ title, name, countryCode, phone, achievements }) => (
  <article className="branch-detail-coach">
    <div className="branch-detail-coach__title">
      <span><UserRound size={18} aria-hidden="true" /></span>
      <div><small>Coach</small><h3>{title}</h3></div>
    </div>
    <dl>
      <div><dt>Name</dt><dd>{displayValue(name)}</dd></div>
      <div><dt>Mobile</dt><dd>{phone ? (countryCode || "+91") + " " + phone : "Not added"}</dd></div>
      <div className="branch-detail-coach__achievement">
        <dt>Achievements / Qualifications</dt><dd>{displayValue(achievements)}</dd>
      </div>
    </dl>
  </article>
);

const BranchDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [academy, setAcademy] = useState(null);
  const [branch, setBranch] = useState(null);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPage = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [branchResult, academyResult] = await Promise.allSettled([
        getBranchById(id), academyApi.getMyAcademy(),
      ]);
      if (branchResult.status === "rejected") throw branchResult.reason;
      const response = branchResult.value;
      const payload = response?.data || response;
      setBranch(payload?.branch || payload?.data?.branch || payload);
      setCounts(payload?.counts || payload?.data?.counts || {});
      if (academyResult.status === "fulfilled") {
        setAcademy(academyResult.value?.data?.data?.academy || academyResult.value?.data?.academy || null);
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Failed to load branch.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadPage(); }, [loadPage]);

  const phones = useMemo(() => normalizePhones(branch), [branch]);
  const facilities = useMemo(
    () => normalizeList(branch?.facilities, branch?.customFacilities).map((item) => item === "Mat Area" ? "Mat Arena" : item),
    [branch?.facilities, branch?.customFacilities]
  );
  const languages = useMemo(
    () => normalizeList(branch?.languagesSpoken, branch?.customLanguages),
    [branch?.languagesSpoken, branch?.customLanguages]
  );
  const martialArts = useMemo(
    () => normalizeList(branch?.martialArts),
    [branch?.martialArts],
  );
  const additionalCoaches = useMemo(
    () => Array.isArray(branch?.additionalCoaches)
      ? branch.additionalCoaches.filter((coach) => coach?.name || coach?.phone || coach?.achievements)
      : [],
    [branch?.additionalCoaches]
  );

  if (loading) {
    return <div className="page branch-detail-state" aria-live="polite"><span className="branch-detail-spinner" /><strong>Loading branch profile…</strong></div>;
  }
  if (error || !branch) {
    return (
      <div className="page branch-detail-state branch-detail-state--error">
        <XCircle size={34} /><strong>{error || "Branch not found."}</strong>
        <button type="button" className="btn btn-primary" onClick={() => loadPage()}>Try Again</button>
      </div>
    );
  }

  const address = joinAddress(branch);
  const academyName = academy?.academyName || "KHILADI Academy";
  const ownerName = academy?.ownerName || user?.name || "Academy Owner";
  const pendingFees = Number(counts.pendingFeesTotal || 0);

  return (
    <div className="page branch-detail-page">
      <AcademyHeroHeader
        headingId="branch-detail-academy-name"
        academyName={academyName}
        ownerName={ownerName}
        logoUrl={academy?.logo ? getAcademyLogoUrl(academy) : ""}
        addressLabel={branch.branchName || "Branch"}
        address={address || "Complete branch address not available"}
        summaryItems={[
          { key: "status", type: "profile", value: branch.isActive !== false ? "Active" : "Inactive", label: "Branch Status" },
          { key: "since", type: "since", value: branch.branchSince || "—", label: "Established" },
        ]}
      />

      <nav className="branch-detail-breadcrumb" aria-label="Breadcrumb"><Link to="/branches">Branches</Link><span>/</span><strong>{branch.branchName}</strong></nav>

      <header className="branch-detail-heading">
        <div className="branch-detail-heading__title">
          <span><Building2 size={25} /></span>
          <div>
            <div className="branch-detail-heading__name-row">
              <h1>{branch.branchName}</h1>
              <div className="branch-detail-heading__badges" aria-label="Branch status">
                <code>{displayValue(branch.branchCode, "No code")}</code>
                {branch.isMainBranch ? <b><Crown size={13} /> Main Branch</b> : null}
                <i className={branch.isActive !== false ? "is-active" : "is-inactive"}>{branch.isActive !== false ? "Active" : "Inactive"}</i>
              </div>
            </div>
            <p>A complete operational view of this academy location.</p>
          </div>
        </div>
        <div className="branch-detail-heading__actions">
          <Link to="/branches" className="btn btn-outline"><ArrowLeft size={16} /> Back</Link>
          <Link to={"/branches/" + branch._id + "/edit"} className="btn btn-primary"><Edit3 size={16} /> Edit Branch</Link>
        </div>
      </header>

      <section className="branch-detail-metrics" aria-label="Branch analytics">
        <MetricCard icon={Users} label="Total Students" value={counts.students || 0} />
        <MetricCard icon={CheckCircle2} label="Active Students" value={counts.activeStudents || 0} tone="green" />
        <MetricCard icon={UsersRound} label="Active Batches" value={counts.batches || 0} tone="blue" />
        <MetricCard icon={CalendarCheck2} label="Today Attendance" value={(counts.todayAttendancePercentage || 0) + "%"} tone="purple" />
        <MetricCard icon={IndianRupee} label="Pending Fees" value={formatMoney(pendingFees, branch)} tone="orange" />
      </section>

      <div className="branch-detail-primary-grid">
        <section className="branch-detail-card">
          <BranchDetailSectionHeader icon={Building2} eyebrow="Identity" title="Branch Information" description="Core identity and operating status." />
          <div className="branch-detail-items">
            <DetailItem icon={UserRound} label="Director Name">{displayValue(branch.directorName)}</DetailItem>
            <DetailItem icon={WalletCards} label="Currency">{`${currencyMeta(branch).code} (${currencyMeta(branch).symbol})`}</DetailItem>
            <DetailItem icon={Building2} label="Branch Code">{displayValue(branch.branchCode)}</DetailItem>
            <DetailItem icon={CalendarDays} label="Branch Since">{displayValue(branch.branchSince)}</DetailItem>
            <DetailItem icon={branch.isMainBranch ? Crown : ShieldCheck} label="Branch Type">{branch.isMainBranch ? "Main Branch" : "Academy Branch"}</DetailItem>
          </div>
        </section>
        <section className="branch-detail-card">
          <BranchDetailSectionHeader icon={MapPin} eyebrow="Contact" title="Phone & Location" description="Official communication and complete address." />
          <div className="branch-detail-items">
            {phones.length ? phones.map((item, index) => <DetailItem key={item.countryCode + item.phone + index} icon={Phone} label={index === 0 ? "Primary Phone" : "Additional Phone " + (index + 1)}>{item.countryCode} {item.phone}</DetailItem>) : <DetailItem icon={Phone} label="Phone">Not added</DetailItem>}
            <DetailItem icon={Mail} label="Email">{displayValue(branch.email)}</DetailItem>
            <DetailItem icon={MapPin} label="District / City">{displayValue(branch.city)}</DetailItem>
            <DetailItem icon={MapPin} label="State & Country">{[branch.state, branch.country].filter(Boolean).join(", ") || "Not added"}</DetailItem>
            <DetailItem icon={MapPin} label="Complete Address" wide>{address || "Not added"}</DetailItem>
          </div>
        </section>
      </div>

      <section className="branch-detail-card">
        <BranchDetailSectionHeader icon={UsersRound} eyebrow="Team" title="Coaches & Branch In-charge" description="Primary and supporting coaching team." />
        <div className="branch-detail-coach-grid">
          <CoachCard title="Head Coach / Branch In-charge" name={branch.headCoachName} countryCode={branch.headCoachCountryCode} phone={branch.headCoachPhone} achievements={branch.headCoachAchievements} />
          <CoachCard title="Assistant Coach" name={branch.assistantCoachName} countryCode={branch.assistantCoachCountryCode} phone={branch.assistantCoachPhone} achievements={branch.assistantCoachAchievements} />
          {additionalCoaches.map((coach, index) => <CoachCard key={"additional-" + index} title={"Additional Coach " + (index + 1)} name={coach.name} countryCode={coach.countryCode} phone={coach.phone} achievements={coach.achievements} />)}
        </div>
        {!additionalCoaches.length ? <p className="branch-detail-empty-note">No additional coaches added.</p> : null}
      </section>

      <div className="branch-detail-secondary-grid">
        <section className="branch-detail-card branch-detail-tags-card">
          <BranchDetailSectionHeader icon={Dumbbell} eyebrow="Training" title="Sports / Martial Arts" description="Training disciplines available at this branch." />
          <div className="branch-detail-tags">{martialArts.length ? martialArts.map((item) => <span key={item}>{item}</span>) : <p>No sports or martial arts added.</p>}</div>
        </section>
        <section className="branch-detail-card branch-detail-tags-card">
          <BranchDetailSectionHeader icon={Warehouse} eyebrow="Infrastructure" title="Facilities" description="Infrastructure available at this branch." />
          <div className="branch-detail-tags">{facilities.length ? facilities.map((item) => <span key={item}>{item}</span>) : <p>No facilities added.</p>}</div>
        </section>
        <section className="branch-detail-card branch-detail-tags-card">
          <BranchDetailSectionHeader icon={Languages} eyebrow="Communication" title="Languages Spoken" description="Languages supported by the branch team." />
          <div className="branch-detail-tags">{languages.length ? languages.map((item) => <span key={item}><Languages size={13} />{item}</span>) : <p>No languages added.</p>}</div>
        </section>
      </div>
    </div>
  );
};

export default BranchDetail;
