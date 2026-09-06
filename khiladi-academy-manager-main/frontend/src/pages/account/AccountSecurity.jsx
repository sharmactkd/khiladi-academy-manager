import { useCallback, useEffect, useState } from "react";
import { Clock3, Laptop2, LogOut, MapPin, ShieldCheck, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi.js";
import useAuth from "../../hooks/useAuth.js";
import styles from "./AccountSecurity.module.css";

const deviceIcon = (agent = "") => /mobile|android|iphone/i.test(agent) ? Smartphone : Laptop2;
const formatDate = (value) => value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Not available";

const AccountSecurity = () => {
  const navigate = useNavigate();
  const { logout, refreshAuth, user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mfaSetup, setMfaSetup] = useState(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaPassword, setMfaPassword] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);

  const load = useCallback(async () => {
    try {
      setError("");
      const response = await authApi.sessions();
      setSessions(response.data?.data?.sessions || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load active sessions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const revoke = async (session) => {
    if (!window.confirm("Sign out this device session?")) return;
    const response = await authApi.revokeSession(session.sessionId);
    if (response.data?.data?.revokedCurrent) {
      await logout();
      navigate("/login", { replace: true });
      return;
    }
    await load();
  };

  const revokeAll = async () => {
    if (!window.confirm("Sign out every device, including this one?")) return;
    await authApi.revokeAllSessions();
    await logout();
    navigate("/login", { replace: true });
  };

  const beginMfa = async () => {
    try {
      const response = await authApi.beginMfaSetup();
      const setup = response.data?.data;
      const qr = await QRCode.toDataURL(setup.otpauthUrl, { width: 220, margin: 1 });
      setMfaSetup({ ...setup, qr });
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not start MFA setup");
    }
  };

  const enableMfa = async () => {
    try {
      const response = await authApi.enableMfa({ secret: mfaSetup.secret, code: mfaCode });
      setRecoveryCodes(response.data?.data?.recoveryCodes || []);
      setMfaSetup(null);
      setMfaCode("");
      await refreshAuth();
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not enable MFA");
    }
  };

  const disableMfa = async () => {
    if (!window.confirm("Disable multi-factor authentication and sign out all devices?")) return;
    try {
      await authApi.disableMfa({ password: mfaPassword, code: mfaCode });
      await logout();
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not disable MFA");
    }
  };

  return <div className={styles.page}>
    <header className={styles.hero}><span><ShieldCheck size={24}/></span><div><small>ACCOUNT PROTECTION</small><h1>Security & Sessions</h1><p>Review devices signed in to {user?.email || user?.name || "your account"}.</p></div><button type="button" onClick={revokeAll}><LogOut size={16}/>Sign out all devices</button></header>
    {error ? <div className={styles.error}>{error}</div> : null}
    <section className={styles.panel}><header><div><small>MULTI-FACTOR AUTHENTICATION</small><h2>Authenticator protection</h2></div><b className={user?.mfaEnabled ? styles.enabled : ""}>{user?.mfaEnabled ? "Enabled" : "Recommended"}</b></header>
      <div className={styles.mfaBody}>{user?.mfaEnabled ? <><p>Your account requires an authenticator or one-time recovery code after the password.</p><div className={styles.mfaForm}><input type="password" placeholder="Current password" value={mfaPassword} onChange={(event) => setMfaPassword(event.target.value)}/><input placeholder="Authenticator / recovery code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)}/><button type="button" onClick={disableMfa}>Disable MFA</button></div></> : mfaSetup ? <div className={styles.setup}><img src={mfaSetup.qr} alt="Authenticator setup QR code"/><div><p>Scan this QR code in Google Authenticator, Microsoft Authenticator or another TOTP app.</p><code>{mfaSetup.secret}</code><div className={styles.mfaForm}><input placeholder="Enter 6-digit code" inputMode="numeric" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)}/><button type="button" onClick={enableMfa}>Confirm & Enable</button></div></div></div> : <><p>Add a second verification step to stop password-only account takeover.</p><button type="button" className={styles.enableButton} onClick={beginMfa}>Set up authenticator</button></>}{recoveryCodes.length ? <div className={styles.recovery}><strong>Save these recovery codes now. Each code works once.</strong><div>{recoveryCodes.map((code) => <code key={code}>{code}</code>)}</div><button type="button" onClick={() => navigator.clipboard.writeText(recoveryCodes.join("\n"))}>Copy codes</button></div> : null}</div>
    </section>
    <section className={styles.panel}><header><div><small>ACTIVE ACCESS</small><h2>Signed-in devices</h2></div><b>{sessions.length} session{sessions.length === 1 ? "" : "s"}</b></header>
      {loading ? <div className={styles.empty}>Loading secure sessions…</div> : sessions.length ? <div className={styles.list}>{sessions.map((session) => { const Icon = deviceIcon(session.userAgent); return <article key={session.sessionId}><span className={styles.device}><Icon size={20}/></span><div><strong>{session.current ? "Current device" : "Signed-in device"}</strong><small>{session.userAgent || "Unknown browser"}</small><p><span><MapPin size={13}/>{session.ip || "IP unavailable"}</span><span><Clock3 size={13}/>Last used {formatDate(session.lastUsedAt)}</span></p></div>{session.current ? <b className={styles.current}>Current</b> : <button type="button" onClick={() => revoke(session)}>Revoke</button>}</article>; })}</div> : <div className={styles.empty}>No active refresh sessions found.</div>}
    </section>
  </div>;
};

export default AccountSecurity;
