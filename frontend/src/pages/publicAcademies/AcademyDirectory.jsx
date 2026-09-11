import { useEffect, useState } from "react";
import { ArrowRight, Building2, CalendarDays, Dumbbell, Globe2, MapPin, Search, ShieldCheck, Sparkles, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import PhoneLocationFields from "../../components/common/PhoneLocationFields.jsx";
import publicAcademyApi from "../../api/publicAcademyApi.js";
import directoryHero from "../../assets/public-academy-directory-hero.webp";
import PublicShell from "./PublicShell.jsx";

export default function AcademyDirectory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ search: "", country: "India", state: "", city: "", martialArt: "", trialAvailable: false });

  useEffect(() => {
    const id = setTimeout(async () => {
      setLoading(true); setError("");
      try { const response = await publicAcademyApi.list({ ...filters, trialAvailable: filters.trialAvailable || undefined }); setItems(response.data?.data?.items || []); }
      catch (requestError) { setError(requestError.response?.data?.message || "Academies could not be loaded"); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(id);
  }, [filters]);

  const change = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));
  const changeLocation = (field, value) => setFilters((current) => ({ ...current, [field]: value }));

  return <PublicShell>
    <header className="pa-hero pa-directory-hero">
      <div className="pa-directory-hero__content"><div className="pa-eyebrow">Train better. Grow stronger.</div><h1>Find the right martial arts academy for you.</h1><p>Explore trusted academies, training programs, facilities and branches—all in one professional directory.</p>
        <div className="pa-directory-trust" aria-label="Directory benefits"><span><ShieldCheck size={21} /><strong>Verified Academies</strong></span><span><UsersRound size={21} /><strong>Active Batches</strong></span><span><CalendarDays size={21} /><strong>Trial Classes</strong></span></div>
        <div className="pa-directory-hero__actions"><a className="pa-directory-primary" href="#academy-directory-results">Explore Academies <ArrowRight size={18} /></a><Link className="pa-directory-secondary" to="/register">List your academy <ArrowRight size={16} /></Link></div>
      </div>
      <div className="pa-directory-hero__media" aria-hidden="true"><img src={directoryHero} alt="" /></div>
    </header>
    <main className="pa-wrap pa-directory" id="academy-directory-results">
      <section className="pa-filters pa-directory-filters" aria-label="Academy filters">
        <label className="pa-directory-search"><Search size={18} /><input name="search" value={filters.search} onChange={change} placeholder="Search academy or martial art" aria-label="Search academy or martial art" /></label>
        <div className="pa-directory-location"><PhoneLocationFields showPhone={false} showLocation country={filters.country} state={filters.state} city={filters.city} cityLabel="City" onChange={changeLocation} /></div>
        <label><span>Sport / Martial art</span><input className="pa-input" name="martialArt" value={filters.martialArt} onChange={change} placeholder="e.g. Taekwondo" /></label>
        <label className="pa-trial-filter"><input type="checkbox" name="trialAvailable" checked={filters.trialAvailable} onChange={change} /><Sparkles size={17} /><span>Trial available</span></label>
      </section>

      <div className="pa-directory-heading"><div><span>Academy Directory</span><h2>{loading ? "Finding academies…" : `${items.length} ${items.length === 1 ? "academy" : "academies"} found`}</h2></div></div>
      {error && <div className="pa-error">{error}</div>}
      {loading ? <div className="pa-state">Loading academies…</div> : items.length ? <div className="pa-directory-list">{items.map((academy) => {
        const academyLocation = [academy.location?.city, academy.location?.state, academy.location?.country].filter(Boolean).join(", ") || "Location not published";
        return <Link className="pa-academy-card" to={`/academies/${academy.slug}`} key={academy.slug}>
          <span className="pa-academy-card__visual" style={academy.coverImage ? { backgroundImage: `linear-gradient(135deg, rgba(185,0,7,.82), rgba(20,32,56,.58)), url(${academy.coverImage})` } : undefined}>
            <span className="pa-academy-card__logo">{academy.logo ? <img src={academy.logo} alt="" /> : <Building2 size={34} />}</span>
            {academy.trialAvailable && <strong><Sparkles size={14} />Trial Available</strong>}
          </span>
          <span className="pa-academy-card__content">
            <span className="pa-academy-card__title"><span><small>Professional Academy</small><b>{academy.academyName}</b><em><MapPin size={15} />{academyLocation}</em></span><ArrowRight size={22} /></span>
            {academy.tagline && <span className="pa-academy-card__tagline">{academy.tagline}</span>}
            <span className="pa-academy-card__facts">
              <span><CalendarDays size={17} /><small>Established</small><strong>{academy.since || "Not published"}</strong></span>
              <span><Building2 size={17} /><small>Public Branches</small><strong>{academy.branchCount || 0}</strong></span>
              <span><UsersRound size={17} /><small>Active Batches</small><strong>{academy.batchCount || 0}</strong></span>
              <span><Globe2 size={17} /><small>Training Mode</small><strong>{academy.onlineTraining ? "On-site & Online" : "On-site"}</strong></span>
            </span>
            {!!academy.martialArts?.length && <span className="pa-academy-card__sports"><small><Dumbbell size={14} />Sports / Martial Arts</small><span>{academy.martialArts.slice(0, 5).map((item) => <b key={item}>{item}</b>)}{academy.martialArts.length > 5 && <b>+{academy.martialArts.length - 5} more</b>}</span></span>}
            <span className="pa-academy-card__footer">View complete academy profile <ArrowRight size={16} /></span>
          </span>
        </Link>;
      })}</div> : <div className="pa-state"><h2>No academies found</h2><p>Try changing your search or filters.</p></div>}
    </main>
  </PublicShell>;
}
