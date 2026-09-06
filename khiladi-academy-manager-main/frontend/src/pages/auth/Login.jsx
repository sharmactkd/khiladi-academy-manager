import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import AuthLayout from "../../layouts/AuthLayout.jsx";
import Button from "../../components/common/Button.jsx";
import Input from "../../components/common/Input.jsx";
import useAuth from "../../hooks/useAuth.js";
import { getRoleLandingPath } from "../../utils/authLanding.js";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    googleLogin,
    completeGoogleMfa,
  } = useAuth();

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] =
    useState(false);
  const [googleMfaChallenge, setGoogleMfaChallenge] = useState("");

  const requestedPath = location.state?.from?.pathname;
  const destinationFor = (user) => requestedPath || getRoleLandingPath(user?.role);

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
      let data;
      if (googleMfaChallenge) {
        data = await completeGoogleMfa(googleMfaChallenge, form.mfaCode || "");
      } else {
        data = await login(form);
      }

      navigate(destinationFor(data?.user), {
        replace: true,
      });
    } catch (err) {
      const code = err.response?.data?.data?.code;
      if (code === "MFA_REQUIRED" || code === "MFA_INVALID") {
        setMfaRequired(true);
      }
      setError(
        err.response?.data?.message ||
          "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (
    credentialResponse
  ) => {
    setError("");

    if (!credentialResponse?.credential) {
      setError("Google token not received");
      return;
    }

    try {
      setGoogleLoading(true);

      const data = await googleLogin(
        credentialResponse.credential,
        "academy_owner"
      );

      if (data?.requiresMfa && data?.challengeToken) {
        setGoogleMfaChallenge(data.challengeToken);
        setMfaRequired(true);
        setForm((current) => ({ ...current, mfaCode: "" }));
        return;
      }

      navigate(destinationFor(data?.user), {
        replace: true,
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Google login failed"
      );
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError(
      "Google login failed. Please try again."
    );
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to continue to your KHILADI Academy Manager account."
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

        {!googleMfaChallenge ? <Input
          label="Email or Phone"
          name="identifier"
          type="text"
          value={form.identifier}
          onChange={handleChange}
          placeholder="Enter email or phone number"
          autoComplete="username"
          inputMode="email"
          required
        /> : null}

        {mfaRequired ? (
          <Input
            label="Authenticator or Recovery Code"
            name="mfaCode"
            type="text"
            value={form.mfaCode || ""}
            onChange={handleChange}
            placeholder="6-digit code"
            autoComplete="one-time-code"
            inputMode="numeric"
            required
          />
        ) : null}

        {!googleMfaChallenge ? <div className="auth-password-heading">
          <span>Password</span>

          <Link to="/forgot-password">
            Forgot Password?
          </Link>
        </div> : null}

        {!googleMfaChallenge ? <Input
          label=""
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        /> : null}

        <Button
          type="submit"
          variant="primary"
          className="auth-submit-button"
          loading={loading}
          disabled={googleLoading}
        >
          {loading ? "Verifying..." : mfaRequired ? "Verify & Login" : "Login"}
        </Button>

        {googleMfaChallenge ? (
          <button
            type="button"
            className="btn btn-outline auth-submit-button"
            onClick={() => {
              setGoogleMfaChallenge("");
              setMfaRequired(false);
              setForm((current) => ({ ...current, mfaCode: "" }));
              setError("");
            }}
          >
            Use another login method
          </button>
        ) : null}

        {!googleMfaChallenge ? <div
          className="auth-divider"
          role="separator"
        >
          <span>or continue with</span>
        </div> : null}

        {!googleMfaChallenge ? <div className="google-login-container">
          {googleLoading ? (
            <button
              type="button"
              className="btn btn-google"
              disabled
              aria-busy="true"
            >
              <span
                className="btn-spinner"
                aria-hidden="true"
              />

              Google login...
            </button>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="outline"
              size="large"
              text="signin_with"
              shape="rectangular"
              width="320"
            />
          )}
        </div> : null}

        <p className="auth-links">
          Don&apos;t have an account?{" "}

          <Link to="/register">
            Create Account
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;
