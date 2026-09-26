import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Home, MessageCircle, Sparkles, X } from "lucide-react";
import { useParams, useSearchParams } from "react-router-dom";
import publicAcademyApi from "../../api/publicAcademyApi.js";
import AcademyEnquiryForm from "./AcademyEnquiryForm.jsx";
import PublicShell from "./PublicShell.jsx";
import {
  PublicAcademyOverview,
  PublicAcademyHero,
  PublicBatchCard,
  PublicBatchProfile,
  PublicBranchCard,
  PublicBranchProfile,
} from "./PublicReadOnlyProfiles.jsx";
import "./PublicProfileVisibility.css";
import Seo from "../../components/seo/Seo.jsx";

export default function PublicAcademyDetails() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [enquiryMode, setEnquiryMode] = useState(null);

  useEffect(() => {
    publicAcademyApi.get(slug).then((response) => {
      const item = response.data?.data?.profile;
      setProfile(item);
    }).catch((requestError) => setError(requestError.response?.data?.message || "Academy not found"));
  }, [slug]);

  const selectedBranch = useMemo(() => profile?.branches?.find((branch) => branch.id === searchParams.get("branch")) || null, [profile, searchParams]);
  const branchBatches = useMemo(() => selectedBranch ? (profile?.batches || []).filter((batch) => batch.branchId === selectedBranch.id) : [], [profile, selectedBranch]);
  const selectedBatch = useMemo(() => branchBatches.find((batch) => batch.id === searchParams.get("batch")) || null, [branchBatches, searchParams]);
  const batchesVisible = searchParams.get("view") === "batches";

  const seo = useMemo(() => {
    if (!profile) return null;
    const origin = String(import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin).replace(/\/$/, "");
    const location = [profile.location?.city, profile.location?.state, profile.location?.country].filter(Boolean).join(", ");
    const sports = (profile.martialArts || []).slice(0, 5).join(", ");
    const title = `${profile.academyName}${profile.location?.city ? ` in ${profile.location.city}` : ""} | Martial Arts Academy`;
    const description = String(
      profile.tagline ||
      `Explore ${profile.academyName}${location ? ` in ${location}` : ""}. View ${sports || "martial arts"} training, branches, batches, facilities and trial class availability.`
    ).slice(0, 160);
    const url = `${origin}/academies/${encodeURIComponent(profile.slug)}`;
    const socialLinks = Object.values(profile.socialLinks || {}).filter((value) => /^https:\/\//i.test(String(value || "")));
    const address = profile.location && Object.values(profile.location).some(Boolean) ? {
      "@type": "PostalAddress",
      streetAddress: profile.location.address || undefined,
      addressLocality: profile.location.city || undefined,
      addressRegion: profile.location.state || undefined,
      addressCountry: profile.location.country || "India",
    } : undefined;
    const business = {
      "@context": "https://schema.org",
      "@type": ["LocalBusiness", "SportsActivityLocation"],
      "@id": `${url}#academy`,
      name: profile.academyName,
      description,
      url,
      image: profile.coverImage || profile.logo || undefined,
      logo: profile.logo || undefined,
      foundingDate: profile.since ? String(profile.since) : undefined,
      address,
      telephone: profile.contact?.phone ? `${profile.contact.countryCode || ""}${profile.contact.phone}` : undefined,
      email: profile.contact?.email || undefined,
      sameAs: socialLinks.length ? socialLinks : undefined,
      knowsAbout: profile.martialArts?.length ? profile.martialArts : undefined,
      amenityFeature: (profile.facilities || []).map((name) => ({ "@type": "LocationFeatureSpecification", name, value: true })),
      department: (profile.branches || []).map((branch) => ({
        "@type": "SportsActivityLocation",
        name: `${profile.academyName} - ${branch.name}`,
        address: branch.location && Object.values(branch.location).some(Boolean) ? {
          "@type": "PostalAddress",
          streetAddress: branch.location.address || undefined,
          addressLocality: branch.location.city || undefined,
          addressRegion: branch.location.state || undefined,
          addressCountry: branch.location.country || profile.location?.country || "India",
        } : undefined,
      })),
    };
    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Academy Directory", item: `${origin}/academies` },
        { "@type": "ListItem", position: 2, name: profile.academyName, item: url },
      ],
    };
    return { title, description, url, business, breadcrumb };
  }, [profile]);

  useEffect(() => {
    if (!enquiryMode) return undefined;
    const close = (event) => { if (event.key === "Escape") setEnquiryMode(null); };
    document.addEventListener("keydown", close);
    document.body.classList.add("public-modal-open");
    return () => { document.removeEventListener("keydown", close); document.body.classList.remove("public-modal-open"); };
  }, [enquiryMode]);

  const showHome = () => setSearchParams({});
  const chooseBranch = (branch) => { setSearchParams({ branch: branch.id }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const chooseBatch = (batch) => { setSearchParams({ branch: selectedBranch.id, batch: batch.id }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const showBranchBatches = () => {
    setSearchParams({ branch: selectedBranch.id, view: "batches" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) return <PublicShell><Seo title="Academy Not Found | KHILADI" description="This academy profile is unavailable." path={`/academies/${slug}`} robots="noindex,follow" /><div className="pa-state"><h1>{error}</h1></div></PublicShell>;
  if (!profile) return <PublicShell><Seo title="Loading Academy | KHILADI" description="Loading academy profile." path={`/academies/${slug}`} robots="noindex,follow" /><div className="pa-state">Loading academy…</div></PublicShell>;

  return <PublicShell>
    <Seo title={seo.title} description={seo.description} path={`/academies/${profile.slug}`} image={profile.coverImage || profile.logo} type="business.business" structuredData={[seo.business, seo.breadcrumb]} />
    <main className="pa-wrap public-profile-parity">
      {!selectedBranch && <>
        <PublicAcademyOverview profile={profile} />
        {!!profile.branches?.length && <section className="public-profile-group" id="branches">
          <header className="public-profile-group__header"><span>Academy Locations</span><h2>Explore Our Branches</h2><p>Select a branch to open its complete profile and available training batches.</p></header>
          <div className="public-branch-list" role="list">{profile.branches.map((branch) => <PublicBranchCard branch={branch} batchCount={(profile.batches || []).filter((batch) => batch.branchId === branch.id).length} onClick={() => chooseBranch(branch)} key={branch.id} />)}</div>
        </section>}
      </>}

      {selectedBranch && !selectedBatch && <section className="public-selection-page">
        <PublicAcademyHero profile={profile} />
        <nav className="public-profile-breadcrumb" aria-label="Profile path"><button type="button" onClick={showHome}><Home size={14} />{profile.academyName}</button><ChevronRight size={14} />{batchesVisible ? <><button type="button" onClick={() => chooseBranch(selectedBranch)}>{selectedBranch.name}</button><ChevronRight size={14} /><strong>Active Batches</strong></> : <strong>{selectedBranch.name}</strong>}</nav>
        {!batchesVisible && <PublicBranchProfile branch={selectedBranch} batchCount={branchBatches.length} onShowBatches={showBranchBatches} />}
        {batchesVisible && <section className="public-nested-section public-batches-page" id="branch-batches">
          <header className="public-profile-group__header"><span>Training Programs</span><h2>Batches at {selectedBranch.name}</h2><p>Select a batch to open its complete schedule, eligibility and coaching details.</p></header>
          {branchBatches.length ? <div className="public-batch-list" role="list">{branchBatches.map((batch) => <PublicBatchCard batch={batch} onClick={() => chooseBatch(batch)} key={batch.id} />)}</div> : <div className="public-empty-record">No public batches are currently available at this branch.</div>}
        </section>}
      </section>}

      {selectedBatch && <section className="public-selection-page">
        <PublicAcademyHero profile={profile} />
        <nav className="public-profile-breadcrumb" aria-label="Profile path"><button type="button" onClick={showHome}><Home size={14} />{profile.academyName}</button><ChevronRight size={14} /><button type="button" onClick={() => chooseBranch(selectedBranch)}>{selectedBranch.name}</button><ChevronRight size={14} /><strong>{selectedBatch.name}</strong></nav>
        <PublicBatchProfile batch={selectedBatch} />
      </section>}

      <div className="public-profile-actions" aria-label="Academy enquiry actions">
        <button type="button" className="public-question-button" onClick={() => setEnquiryMode("question")}><MessageCircle size={17} />Ask a Question</button>
        {profile.trialAvailable && <button type="button" className="public-trial-button" onClick={() => setEnquiryMode("trial")}><Sparkles size={17} />Book a Trial Class</button>}
      </div>
    </main>

    {enquiryMode && <div className="public-enquiry-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEnquiryMode(null); }}>
      <section className="public-enquiry-dialog" role="dialog" aria-modal="true" aria-label={enquiryMode === "trial" ? "Book a trial class" : "Ask a question"}>
        <button type="button" className="public-enquiry-close" onClick={() => setEnquiryMode(null)} aria-label="Close form"><X size={21} /></button>
        <AcademyEnquiryForm profile={profile} selectedBranch={selectedBranch} selectedBatch={selectedBatch} mode={enquiryMode} />
      </section>
    </div>}
  </PublicShell>;
}
