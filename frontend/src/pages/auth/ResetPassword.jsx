import {
  useMemo,
  useState,
} from "react";
import { ArrowLeft } from "lucide-react";
import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { authApi } from "../../api/authApi.js";
import AuthLayout from "../../layouts/AuthLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = useMemo(
    () => searchParams.get("token") || "",
    [searchParams]
  );

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      setError(
        "Reset token missing. Please use the link from your email."
      );

      return;
    }

    setError("");
    setLoading(true);

    try {
      await authApi.resetPassword({
        token,
        password,
      });

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Password reset failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Create a strong new password for your KHILADI account."
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

        {!token && !error && (
          <div
            className="alert alert-error"
            role="alert"
          >
            Reset token missing. Please use the link
            from your email.
          </div>
        )}

        <Input
          label="New Password"
          name="password"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="Enter your new password"
          autoComplete="new-password"
          helperText="Use uppercase, lowercase, number and special character."
          required
        />

        <Button
          type="submit"
          variant="primary"
          className="auth-submit-button"
          loading={loading}
          disabled={!token}
        >
          {loading
            ? "Resetting password..."
            : "Reset Password"}
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

export default ResetPassword;