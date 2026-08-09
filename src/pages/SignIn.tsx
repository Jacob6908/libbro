import { useState } from "react";
import type { MouseEvent } from "react";
import { flushSync } from "react-dom";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { isValidEmail } from "../lib/authValidation";
import "./Auth.css";

export default function SignIn() {
  const { signInWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const signIn = async () => {
    setSubmitting(true);
    setEmailError(null);
    setPasswordError(null);
    setError(null);

    const trimmedEmail = email.trim();
    let hasValidationError = false;

    if (!trimmedEmail) {
      setEmailError("Enter your email.");
      hasValidationError = true;
    } else if (!isValidEmail(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      hasValidationError = true;
    }

    if (!password) {
      setPasswordError("Enter your password.");
      hasValidationError = true;
    }

    if (hasValidationError) {
      setSubmitting(false);
      return;
    }

    const { error } = await signInWithEmail(trimmedEmail, password);

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    navigate("/");
  };

  const clearForm = () => {
    flushSync(() => {
      setEmail("");
      setPassword("");
      setEmailError(null);
      setPasswordError(null);
      setError(null);
    });
  };

  const handleCreateAccountClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    clearForm();
    navigate("/signup");
  };

  return (
    <main className="auth-page">
      <p className="auth-wordmark">
        li<span className="tilt">b</span>bro
      </p>

      <form
        onSubmit={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void signIn();
          }
        }}
        className="auth-form"
        autoComplete="off"
        noValidate
      >
        <div className="auth-row">
          <div className="auth-field">
            <label htmlFor="signin-email">Email</label>
            <input
              id="signin-email"
              type="email"
              name="signin-email"
              autoComplete="username"
              data-1p-ignore="true"
              data-bwignore="true"
              data-lpignore="true"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError(null);
                setError(null);
              }}
              className={`auth-input${emailError ? " invalid" : ""}`}
            />
            {emailError && <p className="auth-error">{emailError}</p>}
          </div>
          <div className="auth-field">
            <label htmlFor="signin-password">Password</label>
            <input
              id="signin-password"
              type="password"
              name="signin-password"
              autoComplete="current-password"
              data-1p-ignore="true"
              data-bwignore="true"
              data-lpignore="true"
              placeholder="Password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError(null);
                setError(null);
              }}
              className={`auth-input${passwordError ? " invalid" : ""}`}
            />
            {passwordError && <p className="auth-error">{passwordError}</p>}
          </div>
        </div>

        {error && <p className="auth-form-error">{error}</p>}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => signIn()}
            disabled={submitting}
            className="rounded bg-primary px-7 py-2.5 font-bold text-white disabled:opacity-50"
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </form>

      <div className="flex justify-center gap-6 text-sm">
        <Link to="/forgot-password" className="text-ink/55">
          Forgot password?
        </Link>
        <Link
          to="/signup"
          onClick={handleCreateAccountClick}
          className="text-ink/55"
        >
          Create an account
        </Link>
      </div>
    </main>
  );
}
