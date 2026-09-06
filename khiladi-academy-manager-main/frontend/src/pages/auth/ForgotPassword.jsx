import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { authApi } from "../../api/authApi.js";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (event) => {
    setEmail(event.target.value);

    if (error) {
      setError("");
    }

    if (message) {
      setMessage("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const response =
        await authApi.forgotPassword({
          email,
        });

      setMessage(
        response.data?.message ||
          "Reset instructions sent"
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Request failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your registered email and we will send you password reset instructions."
    >
      <form
        className="form auth-form"
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

        {message && (
          <div
            className="alert alert-success"
            role="status"
          >
            {message}
          </div>
        )}

        <Input
          label="Registered Email"
          name="email"
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="name@example.com"
          autoComplete="email"
          inputMode="email"
          required
        />

        <Button
          type="submit"
          variant="primary"
          className="auth-submit-button"
          loading={loading}
        >
          {loading
            ? "Sending reset link..."
            : "Send Reset Link"}
        </Button>

        <p className="auth-links">
          <Link
            to="/login"
            className="auth-back-link"
          >
            <ArrowLeft
              size={16}
              aria-hidden="true"
            />

            Back to Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;