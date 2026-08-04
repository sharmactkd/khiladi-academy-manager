import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import useAuth from "../../hooks/useAuth.js";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "academy_owner",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await register(form);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Start managing your martial arts academy professionally."
    >
      <form
        className="form auth-form auth-register-form"
        onSubmit={handleSubmit}
      >
        {error && (
          <div
            className="alert alert-error"
            role="alert"
          >
            {error}
          </div>
        )}

        <Input
          label="Full Name"
          name="name"
          type="text"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter your full name"
          autoComplete="name"
          required
        />

        <div className="auth-form-grid">
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="name@example.com"
            autoComplete="email"
            inputMode="email"
          />

          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="9876543210"
            autoComplete="tel"
            inputMode="tel"
          />
        </div>

        <Input
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Create a strong password"
          autoComplete="new-password"
          helperText="Use uppercase, lowercase, number and special character."
          required
        />

        <label className="form-field">
          <span className="form-field__label">
            Account Role

            <span
              className="form-field__required"
              aria-hidden="true"
            >
              *
            </span>
          </span>

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="academy_owner">
              Academy Owner
            </option>

            <option value="assistant_coach">
              Assistant Coach
            </option>

            <option value="parent">
              Parent
            </option>

            <option value="student">
              Student
            </option>
          </select>
        </label>

        <p className="auth-form-note">
          By creating an account, you agree to use
          KHILADI Academy Manager responsibly and
          provide accurate account information.
        </p>

        <Button
          type="submit"
          variant="primary"
          className="auth-submit-button"
          loading={loading}
        >
          {loading
            ? "Creating account..."
            : "Create Account"}
        </Button>

        <p className="auth-links">
          Already have an account?{" "}

          <Link to="/login">
            Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;