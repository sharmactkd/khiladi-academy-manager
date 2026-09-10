import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, Users } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import Button from "../../components/common/Button.jsx";
import useAuth from "../../hooks/useAuth.js";
import academyLoginBackground from "../../assets/auth/academy-login-background.webp";
import khiladiLogo from "../../assets/images/branding/khiladi-logo.png";
import { getRoleLandingPath } from "../../utils/authLanding.js";
import { beginCentralSso } from "../../utils/centralSso.js";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, googleLogin, completeGoogleMfa } = useAuth();
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [error, setError] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleMfaChallenge, setGoogleMfaChallenge] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const requestedPath = location.state?.from?.pathname;
  const destinationFor = (user) => requestedPath || getRoleLandingPath(user?.role);

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = googleMfaChallenge
        ? await completeGoogleMfa(googleMfaChallenge, form.mfaCode || "")
        : await login(form);
      navigate(destinationFor(data?.user), { replace: true });
    } catch (err) {
      const code = err.response?.data?.data?.code;
      if (code === "MFA_REQUIRED" || code === "MFA_INVALID") setMfaRequired(true);
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (response) => {
    setError("");
    if (!response?.credential) return setError("Google token not received");
    try {
      setGoogleLoading(true);
      const data = await googleLogin(response.credential, "academy_owner");
      if (data?.requiresMfa && data?.challengeToken) {
        setGoogleMfaChallenge(data.challengeToken);
        setMfaRequired(true);
        setForm((current) => ({ ...current, mfaCode: "" }));
        return;
      }
      navigate(destinationFor(data?.user), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Google login failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const resetGoogleMfa = () => {
    setGoogleMfaChallenge("");
    setMfaRequired(false);
    setForm((current) => ({ ...current, mfaCode: "" }));
    setError("");
  };

  return (
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

      <section className="academy-login__panel" aria-labelledby="academy-login-title">
        <div className="academy-login__panel-inner">
          <header className="academy-login__heading">
            <h2 id="academy-login-title">Welcome Back</h2>
            <p>Sign in to continue to your academy workspace</p>
          </header>

          {error && <div className="academy-login__alert" role="alert">{error}</div>}

          {!googleMfaChallenge && <>
            <button type="button" className="academy-login__sso" onClick={beginCentralSso}><ShieldCheck size={23} />Continue with KHILADI</button>
            <p className="academy-login__sso-note">One secure account across KHILADI products</p>
            <div className="academy-login__divider" role="separator"><span>or continue with email</span></div>
          </>}

          <form className="academy-login__form" onSubmit={handleSubmit}>
            {!googleMfaChallenge && <label className="academy-login__field">
              <span>Email or phone</span>
              <div className="academy-login__input-wrap"><Mail size={19} /><input name="identifier" type="text" value={form.identifier} onChange={handleChange} placeholder="you@academy.com" autoComplete="username" inputMode="email" required /></div>
            </label>}

            {mfaRequired && <label className="academy-login__field">
              <span>Authenticator or Recovery Code</span>
              <div className="academy-login__input-wrap"><LockKeyhole size={19} /><input name="mfaCode" type="text" value={form.mfaCode || ""} onChange={handleChange} placeholder="6-digit code" autoComplete="one-time-code" inputMode="numeric" required /></div>
            </label>}

            {!googleMfaChallenge && <label className="academy-login__field">
              <span>Password</span>
              <div className="academy-login__input-wrap">
                <LockKeyhole size={19} />
                <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="Enter your password" autoComplete="current-password" required />
                <button type="button" className="academy-login__password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
              </div>
            </label>}

            {!googleMfaChallenge && <div className="academy-login__options">
              <label className="academy-login__remember"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} /><span>Remember me</span></label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>}

            <Button type="submit" variant="primary" className="academy-login__submit" loading={loading} disabled={googleLoading}>{loading ? "Verifying..." : mfaRequired ? "Verify & Login" : "Sign In"}</Button>
            {googleMfaChallenge && <button type="button" className="academy-login__secondary" onClick={resetGoogleMfa}>Use another login method</button>}
          </form>

          {!googleMfaChallenge && <div className="academy-login__google">
            {googleLoading ? <button type="button" disabled><span className="btn-spinner" /> Google login...</button> : <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google login failed. Please try again.")} useOneTap={false} theme="outline" size="large" text="signin_with" shape="rectangular" width="320" />}
          </div>}

          <p className="academy-login__register">New to KHILADI? <Link to="/register">Create an account</Link></p>
          <footer className="academy-login__security"><ShieldCheck size={18} /> Secure • Private • Protected</footer>
        </div>
      </section>
    </main>
  );
};

export default Login;
