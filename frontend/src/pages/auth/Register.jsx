import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../components/common/Button.jsx";
import useAuth from "../../hooks/useAuth.js";
import AcademyAuthLayout from "../../layouts/AcademyAuthLayout.jsx";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "academy_owner" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await register(form);
      navigate(data?.requiresEmailVerification ? "/verify-email" : "/dashboard", {
        replace: true,
        state: data?.requiresEmailVerification ? { email: form.email } : undefined,
      });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AcademyAuthLayout panelClassName="academy-login__panel--register">
      <header className="academy-login__heading">
        <h2 id="academy-register-title">Create Account</h2>
        <p>Start managing your martial arts academy professionally</p>
      </header>

      {error && <div className="academy-login__alert" role="alert">{error}</div>}

      <form className="academy-login__form academy-login__form--register" onSubmit={handleSubmit} aria-labelledby="academy-register-title">
        <label className="academy-login__field">
          <span>Full name</span>
          <div className="academy-login__input-wrap"><UserRound size={19} /><input name="name" type="text" value={form.name} onChange={handleChange} placeholder="Enter your full name" autoComplete="name" required /></div>
        </label>

        <div className="academy-login__field-grid">
          <label className="academy-login__field">
            <span>Email address</span>
            <div className="academy-login__input-wrap"><Mail size={19} /><input name="email" type="email" value={form.email} onChange={handleChange} placeholder="name@example.com" autoComplete="email" inputMode="email" /></div>
          </label>
          <label className="academy-login__field">
            <span>Phone number</span>
            <div className="academy-login__input-wrap"><Phone size={19} /><input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="9876543210" autoComplete="tel" inputMode="tel" /></div>
          </label>
        </div>

        <label className="academy-login__field">
          <span>Password</span>
          <div className="academy-login__input-wrap">
            <LockKeyhole size={19} />
            <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="Create a strong password" autoComplete="new-password" required />
            <button type="button" className="academy-login__password-toggle" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
          </div>
          <small className="academy-login__helper">Use uppercase, lowercase, number and special character.</small>
        </label>

        <div className="academy-login__policy"><ShieldCheck size={18} /><p>By creating an account, you agree to use KHILADI Academy Manager responsibly and provide accurate information.</p></div>

        <Button type="submit" variant="primary" className="academy-login__submit" loading={loading}>{loading ? "Creating account..." : "Create Account"}</Button>
      </form>

      <p className="academy-login__register">Already have an account? <Link to="/login">Sign in</Link></p>
      <footer className="academy-login__security"><ShieldCheck size={18} /> Secure • Private • Protected</footer>
    </AcademyAuthLayout>
  );
};

export default Register;
