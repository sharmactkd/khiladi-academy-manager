import { ShieldCheck, Users } from "lucide-react";

import academyLoginBackground from "../assets/auth/academy-login-background.webp";
import khiladiLogo from "../assets/images/branding/khiladi-logo.png";
import "../pages/auth/Login.css";

const AcademyAuthLayout = ({ children, panelClassName = "" }) => (
  <main className="academy-login" style={{ "--academy-login-bg": `url(${academyLoginBackground})` }}>
    <div className="academy-login__backdrop" aria-hidden="true" />

    <section className="academy-login__showcase" aria-label="KHILADI Academy Manager">
      <header className="academy-login__brand">
        <img src={khiladiLogo} alt="KHILADI" />
        <span className="academy-login__brand-divider" aria-hidden="true" />
        <div><strong>KHILADI</strong><span>ACADEMY</span><b>MANAGER</b></div>
      </header>

      <div className="academy-login__message">
        <h1>BUILD CHAMPIONS.<span>RUN YOUR ACADEMY.</span></h1>
        <p>Students, attendance, fees and progress — managed from one secure platform.</p>
      </div>

      <div className="academy-login__benefits" aria-label="Platform benefits">
        <article><span className="academy-login__benefit-icon"><Users size={24} /></span><div><strong>Unified Academy Operations</strong><p>Manage students, batches, attendance, fees and more.</p></div></article>
        <article><span className="academy-login__benefit-icon academy-login__cloud-icon" /><div><strong>Secure Cloud Records</strong><p>Your data is safe, backed up and always accessible.</p></div></article>
        <article><span className="academy-login__benefit-icon"><ShieldCheck size={24} /></span><div><strong>Built for Martial Arts</strong><p>Designed by people who understand the journey.</p></div></article>
      </div>

      <footer className="academy-login__tagline"><span /> PEOPLE <i /> PROGRESS <i /> PURPOSE <i /> A STRONGER TOMORROW</footer>
    </section>

    <section className={`academy-login__panel ${panelClassName}`.trim()}>
      <div className="academy-login__panel-inner">{children}</div>
    </section>
  </main>
);

export default AcademyAuthLayout;
