import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import {
  PASSWORD_REQUIREMENT_CHECKS,
  isValidPassword,
} from "../lib/authValidation";
import "./Auth.css";

export default function ResetPassword() {
  const { user, isLoading, signOut, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const savePassword = async () => {
    setSubmitting(true);
    setPasswordError(null);
    setError(null);

    if (!password) {
      setPasswordError("Enter a new password.");
      setSubmitting(false);
      return;
    }

    if (!isValidPassword(password)) {
      setPasswordError("Password must meet all requirements.");
      setSubmitting(false);
      return;
    }

    const { error } = await updatePassword(password);

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    await signOut();
    navigate("/signin");
  };

  if (isLoading) {
    return (
      <main className="auth-page">
        <p className="auth-wordmark">
          li<span className="tilt">b</span>bro
        </p>
        <p className="text-sm text-ink/55">Verifying your reset link...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="auth-page">
        <p className="auth-wordmark">
          li<span className="tilt">b</span>bro
        </p>
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <h1 className="font-serif text-xl font-semibold">
            Link expired or already used
          </h1>
          <p className="text-sm text-ink/70">
            This password reset link is no longer valid — reset links only work
            once. Request a new one and use it just once to set your password.
          </p>
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-primary"
          >
            Request a new reset link
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
            void savePassword();
          }
        }}
        className="auth-form"
        noValidate
      >
        <div className="auth-row">
          <div className="auth-field">
            <label htmlFor="reset-password-passphrase">New password</label>
            <input
              id="reset-password-passphrase"
              type="text"
              name="replacement-passphrase"
              autoComplete="new-password"
              data-1p-ignore="true"
              data-bwignore="true"
              data-lpignore="true"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="New password"
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
            onClick={() => savePassword()}
            disabled={submitting}
            className="rounded bg-primary px-7 py-2.5 font-bold text-white disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save new password"}
          </button>
        </div>
      </form>
    </main>
  );
}
