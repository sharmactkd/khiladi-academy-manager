import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

const AcademyLogoModal = ({ academyName, logoUrl, onClose, open }) => {
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    closeButtonRef.current?.focus();
    const handleKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [onClose, open]);

  if (!open || !logoUrl) return null;

  return (
    <div className="owner-logo-modal" onClick={onClose} role="presentation">
      <div onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Academy logo preview">
        <header><div><span>Academy identity</span><h2>{academyName}</h2></div><button ref={closeButtonRef} type="button" onClick={onClose}>Close</button></header>
        <img src={logoUrl} alt={`${academyName} logo`} />
        <Link className="btn btn-primary" to="/academy/profile">Change logo</Link>
      </div>
    </div>
  );
};

export default AcademyLogoModal;
