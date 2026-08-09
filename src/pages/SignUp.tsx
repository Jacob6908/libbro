import { useState } from "react";
import type { MouseEvent } from "react";
import { flushSync } from "react-dom";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import {
  PASSWORD_REQUIREMENT_CHECKS,
  isValidEmail,
  isValidPassword,
} from "../lib/authValidation";
import "./Auth.css";

export default function SignUp() {
  const { signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const createAccount = async () => {
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
      setPasswordError("Create a password.");
      hasValidationError = true;
    } else if (!isValidPassword(password)) {
      setPasswordError("Password must meet all requirements.");
      hasValidationError = true;
    }

    if (hasValidationError) {
      setSubmitting(false);
      return;
    }

    const { data, error } = await signUpWithEmail(trimmedEmail, password);

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    // If a session came back immediately, email confirmation is off for
    // this project - the user is already signed in, no need to wait on email.
    if (data.session) {
      navigate("/");
      return;
    }

    setConfirmationSent(true);
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

  const handleSignInClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    clearForm();
    navigate("/signin");
  };

  if (confirmationSent) {
    return (
      <main className="auth-page">
        <p className="auth-wordmark">
          li<span className="tilt">b</span>bro
        </p>
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <h1 className="font-serif text-xl font-semibold">Check your email</h1>
          <p className="text-sm text-ink/70">
            We sent a confirmation link to {email}. Follow it to finish creating
            your account.
          </p>
          <Link to="/signin" className="text-sm font-semibold text-primary">
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

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
            void createAccount();
          }
        }}
        className="auth-form"
        autoComplete="off"
        noValidate
      >
        <div className="auth-row">
          <div className="auth-field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              type="email"
              name="new-account-email"
              autoComplete="off"
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
            <label htmlFor="signup-passphrase">Password</label>
            <input
              id="signup-passphrase"
              type="text"
              name="account-secret"
              autoComplete="off"
              data-1p-ignore="true"
              data-bwignore="true"
              data-lpignore="true"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Create a password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setPasswordError(null);
                setError(null);
              }}
              className={`auth-input auth-secret-input${
                password && isValidPassword(password) ? " valid" : ""
              }${passwordError ? " invalid" : ""}`}
            />
            {passwordError && <p className="auth-error">{passwordError}</p>}
            <div
              className="password-checklist"
              aria-label="Password requirements"
            >
              {PASSWORD_REQUIREMENT_CHECKS.map((requirement) => {
                const isComplete = requirement.isMet(password);

                return (
                  <span
                    key={requirement.label}
                    className={`password-check${isComplete ? " complete" : ""}`}
                  >
                    {requirement.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {error && <p className="auth-form-error">{error}</p>}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => createAccount()}
            disabled={submitting}
            className="rounded bg-primary px-7 py-2.5 font-bold text-white disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </div>
      </form>

      <Link
        to="/signin"
        onClick={handleSignInClick}
        className="text-sm text-ink/55"
      >
        Already have an account?{" "}
        <span className="font-semibold text-primary">Sign in</span>
      </Link>
    </main>
  );
}
