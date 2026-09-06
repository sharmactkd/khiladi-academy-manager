import { Link } from "react-router-dom";
import { Building2, Crown, Mail, MapPin, Pencil, Phone, Power, UserRound } from "lucide-react";
import { joinAddressParts } from "../branch.utils.js";
import "./BranchCard.module.css";

const value = (input, fallback = "Not added") => String(input ?? "").trim() || fallback;
const phone = (code, number) => String(number || "").trim() ? `${code || "+91"} ${number}` : "Not added";

const BranchCard = ({ branch, canManage = false, busy = false, onDeactivate, onOpen }) => {
  const active = branch?.isActive !== false;
  const address = joinAddressParts([branch?.address, branch?.city || branch?.district, branch?.state, branch?.country]);
  const open = () => onOpen?.(branch);
  const onKeyDown = (event) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); }
  };

  return (
    <article className="branch-list-card" role="link" tabIndex={0} aria-label={`View ${branch?.branchName || "branch"} details`} onClick={open} onKeyDown={onKeyDown}>
      <header className="branch-list-card__header">
        <span className="branch-list-card__icon"><Building2 size={27} /></span>
        <div className="branch-list-card__identity">
          <small>Academy branch</small><h2>{value(branch?.branchName, "Unnamed Branch")}</h2>
          <p><MapPin size={13} />{value(branch?.city || branch?.district)}<i />{value(branch?.state)}</p>
        </div>
        <div className="branch-list-card__badges">
          <code>{value(branch?.branchCode, "No code")}</code>
          {branch?.isMainBranch ? <b><Crown size={12} /> Main Branch</b> : null}
          <span className={active ? "is-active" : "is-inactive"}>{active ? "Active" : "Inactive"}</span>
        </div>
      </header>

      <div className="branch-list-card__body">
        <section className="branch-list-card__section branch-list-card__location">
          <small className="branch-list-card__eyebrow"><MapPin size={14} /> Location &amp; contact</small>
          <dl>
            <div className="is-wide"><dt>Complete Address</dt><dd>{address || "Not added"}</dd></div>
            <div><dt>Branch Phone</dt><dd><Phone size={13} />{phone(branch?.countryCode, branch?.phone)}</dd></div>
            <div><dt>Email</dt><dd><Mail size={13} />{value(branch?.email)}</dd></div>
          </dl>
        </section>

        <section className="branch-list-card__section branch-list-card__team">
          <small className="branch-list-card__eyebrow"><UserRound size={14} /> Leadership</small>
          <div><span><UserRound size={16} /></span><p><small>Director</small><strong>{value(branch?.directorName)}</strong></p></div>
          <div><span><UserRound size={16} /></span><p><small>Head Coach</small><strong>{value(branch?.headCoachName)}</strong><em>{phone(branch?.headCoachCountryCode, branch?.headCoachPhone)}</em></p></div>
        </section>

        {canManage ? <div className="branch-list-card__actions" onClick={(event) => event.stopPropagation()}>
          <Link to={`/branches/${branch._id}/edit`}><Pencil size={15} /> Edit</Link>
          {active ? <button type="button" onClick={() => onDeactivate?.(branch)} disabled={busy}><Power size={15} />{busy ? "Working…" : "Deactivate"}</button> : <span>Branch is inactive</span>}
        </div> : null}
      </div>
    </article>
  );
};

export default BranchCard;
