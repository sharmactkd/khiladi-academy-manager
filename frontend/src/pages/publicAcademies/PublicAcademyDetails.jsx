import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import publicAcademyApi from "../../api/publicAcademyApi.js";
import AcademyEnquiryForm from "./AcademyEnquiryForm.jsx";
import PublicShell from "./PublicShell.jsx";

export default function PublicAcademyDetails() {
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    publicAcademyApi.get(slug)
      .then((response) => {
        const item = response.data?.data?.profile;
        setProfile(item);
        document.title = `${item?.academyName || "Academy"} | KHILADI`;
      })
      .catch((requestError) => setError(requestError.response?.data?.message || "Academy not found"));
  }, [slug]);

  if (error) return <PublicShell><div className="pa-state"><h1>{error}</h1></div></PublicShell>;
  if (!profile) return <PublicShell><div className="pa-state">Loading academy…</div></PublicShell>;

  const location = [profile.location?.address, profile.location?.city, profile.location?.state].filter(Boolean).join(", ");
  return <PublicShell>
    <header className="pa-detail-hero" style={profile.coverImage ? { backgroundImage: `linear-gradient(90deg,#111827e8,#11182770),url(${profile.coverImage})` } : undefined}>
      <div className="pa-detail-copy">
        {profile.logo && <img className="pa-detail-logo" src={profile.logo} alt="" />}
        <div className="pa-eyebrow">{profile.trialAvailable ? "Trial classes available" : "KHILADI Academy"}</div>
        <h1>{profile.academyName}</h1>
        <p>{profile.tagline || location}</p>
      </div>
    </header>
    <main className="pa-wrap">
      <div className="pa-detail-grid">
        <section>
          <div className="pa-panel"><h2>About the academy</h2><p>{profile.about}</p><div className="pa-tags">{profile.martialArts?.map((item) => <span className="pa-tag" key={item}>{item}</span>)}</div></div>
          <div className="pa-panel"><h2>Branches</h2>{profile.branches?.length ? profile.branches.map((branch, index) => <div className="pa-branch" key={`${branch.name}-${index}`}><strong>{branch.name}</strong><p>{[branch.address, branch.city, branch.state].filter(Boolean).join(", ")}</p><div className="pa-tags">{branch.martialArts?.map((item) => <span className="pa-tag" key={item}>{item}</span>)}</div></div>) : <p>Contact the academy for branch information.</p>}</div>
        </section>
        <aside>
          <div className="pa-panel"><h2>Quick facts</h2>{profile.since && <p>Established {profile.since}</p>}{profile.onlineTraining && <p>Online training available</p>}{profile.girlsOnlyBatches && <p>Girls-only batches available</p>}<p>{profile.feeDisplay === "starting" && profile.startingFee ? `Fees from ₹${profile.startingFee}` : "Contact for fee details"}</p></div>
          <div className="pa-panel"><h2>Contact</h2><p>{location}</p>{profile.contact?.phone && <a className="pa-button" href={`tel:${profile.contact.countryCode || ""}${profile.contact.phone}`}>Call academy</a>}{profile.contact?.email && <p><a href={`mailto:${profile.contact.email}`}>{profile.contact.email}</a></p>}{profile.contact?.website && <p><a href={profile.contact.website} target="_blank" rel="noreferrer">Visit website</a></p>}</div>
        </aside>
      </div>
      <AcademyEnquiryForm profile={profile} />
    </main>
  </PublicShell>;
}
