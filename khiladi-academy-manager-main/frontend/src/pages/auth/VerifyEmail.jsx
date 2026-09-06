import { useEffect, useMemo, useState } from "react";
import { MailCheck } from "lucide-react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import { authApi } from "../../api/authApi.js";
import useAuth from "../../hooks/useAuth.js";

const VerifyEmail = () => {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const token = useMemo(() => params.get("token") || "", [params]);
  const [email, setEmail] = useState(location.state?.email || "");
  const [status, setStatus] = useState(token ? "verifying" : "waiting");
  const [message, setMessage] = useState(
    token ? "Verifying your secure link…" : "Check your inbox and open the verification link."
  );
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!token) return;
    let active = true;
    verifyEmail(token)
      .then(() => {
        if (!active) return;
        setStatus("success");
        setMessage("Email verified. Redirecting to your dashboard…");
        window.setTimeout(() => navigate("/dashboard", { replace: true }), 700);
      })
      .catch((error) => {
        if (!active) return;
        setStatus("error");
        setMessage(error.response?.data?.message || "Verification failed");
      });
    return () => { active = false; };
  }, [navigate, token, verifyEmail]);

  const resend = async (event) => {
    event.preventDefault();
    setSending(true);
    try {
      const response = await authApi.resendVerification({ email });
      setStatus("waiting");
      setMessage(response.data?.message || "A new verification link has been sent");
    } catch (error) {
      setStatus("error");
      setMessage(error.response?.data?.message || "Could not resend verification link");
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout title="Verify Email" subtitle="Secure your academy account before continuing.">
      <div className="form auth-form">
        <div className={`alert ${status === "error" ? "alert-error" : "alert-success"}`} role="status">
          <MailCheck size={18} aria-hidden="true" /> {message}
        </div>
        {!token || status === "error" ? (
          <form className="form" onSubmit={resend}>
            <Input label="Registered Email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            <Button type="submit" variant="primary" loading={sending}>Resend Verification Link</Button>
          </form>
        ) : null}
        <p className="auth-links"><Link to="/login">Back to Login</Link></p>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
