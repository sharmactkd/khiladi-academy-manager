import {
  BarChart3,
  CheckCircle2,
  ShieldCheck,
  Users,
} from "lucide-react";

const AuthLayout = ({
  title,
  subtitle,
  children,
}) => {
  return (
    <main className="auth-page">
      <section
        className="auth-card"
        aria-labelledby="auth-page-title"
      >
        <aside className="brand-block">
          <div className="auth-brand-header">
            <img
              src="/khiladi-logo.png"
              alt="KHILADI"
              className="auth-brand-logo"
            />

            <div className="auth-product-name">
              <strong>KHILADI</strong>
              <span>Academy Manager</span>
            </div>
          </div>

          <div className="auth-brand-copy">
            <span className="auth-brand-eyebrow">
              KHILADI SOFTWARE ECOSYSTEM
            </span>

            <h1>
              Manage your academy with confidence.
            </h1>

            <p>
              Students, attendance, fees, performance
              and communication—organized in one
              professional workspace.
            </p>

            <ul className="auth-feature-list">
              <li>
                <span className="auth-feature-icon">
                  <Users
                    size={17}
                    aria-hidden="true"
                  />
                </span>

                <span>
                  Student and academy management
                </span>
              </li>

              <li>
                <span className="auth-feature-icon">
                  <CheckCircle2
                    size={17}
                    aria-hidden="true"
                  />
                </span>

                <span>
                  Attendance and fee tracking
                </span>
              </li>

              <li>
                <span className="auth-feature-icon">
                  <BarChart3
                    size={17}
                    aria-hidden="true"
                  />
                </span>

                <span>
                  Reports and performance analytics
                </span>
              </li>

              <li>
                <span className="auth-feature-icon">
                  <ShieldCheck
                    size={17}
                    aria-hidden="true"
                  />
                </span>

                <span>
                  Secure role-based access
                </span>
              </li>
            </ul>
          </div>

          <p className="auth-brand-footer">
            One platform. Every academy operation.
          </p>
        </aside>

        <div className="auth-content">
          <div className="auth-mobile-brand">
            <img
              src="/khiladi-logo.png"
              alt=""
              aria-hidden="true"
            />

            <div>
              <strong>KHILADI</strong>
              <span>Academy Manager</span>
            </div>
          </div>

          <div className="auth-heading">
            <h2 id="auth-page-title">
              {title}
            </h2>

            {subtitle && (
              <p>{subtitle}</p>
            )}
          </div>

          <div className="auth-form-container">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
};

export default AuthLayout;