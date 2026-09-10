import { useState } from "react";
import { ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

import { authApi } from "../../api/authApi.js";
import Button from "../../components/common/Button.jsx";
import AcademyAuthLayout from "../../layouts/AcademyAuthLayout.jsx";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (error) setError("");
    if (message) setMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const response = await authApi.forgotPassword({ email });
      setMessage(response.data?.message || "Reset instructions sent");
    } catch (err) {
      setError(err.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AcademyAuthLayout panelClassName="academy-login__panel--forgot">
      <div className="academy-login__purpose-icon" aria-hidden="true"><KeyRound size={28} /></div>
      <header className="academy-login__heading">
        <h2 id="academy-forgot-title">Forgot Password?</h2>
        <p>Enter your registered email and we’ll send secure password reset instructions.</p>
      </header>

      {error && <div className="academy-login__alert" role="alert">{error}</div>}
      {message && <div className="academy-login__success" role="status"><ShieldCheck size={19} />{message}</div>}

      <form className="academy-login__form" onSubmit={handleSubmit} aria-labelledby="academy-forgot-title">
        <label className="academy-login__field">
          <span>Registered email</span>
          <div className="academy-login__input-wrap"><Mail size={19} /><input name="email" type="email" value={email} onChange={handleEmailChange} placeholder="name@example.com" autoComplete="email" inputMode="email" required /></div>
        </label>

        <Button type="submit" variant="primary" className="academy-login__submit" loading={loading}>{loading ? "Sending reset link..." : "Send Reset Link"}</Button>
      </form>

      <p className="academy-login__register"><Link to="/login" className="academy-login__back-link"><ArrowLeft size={16} /> Back to Sign In</Link></p>
      <footer className="academy-login__security"><ShieldCheck size={18} /> Secure • Private • Protected</footer>
    </AcademyAuthLayout>
  );
};

export default ForgotPassword;
