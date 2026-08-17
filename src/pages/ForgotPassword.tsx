import { useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { isValidEmail } from "../lib/authValidation";
import "./Auth.css";

export default function ForgotPassword() {
  const { resetPasswordForEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const sendResetLink = async () => {
    setSubmitting(true);
    setEmailError(null);
    setError(null);

    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Enter your email.");
      setSubmitting(false);
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      setSubmitting(false);
      return;
    }

    const { error } = await resetPasswordForEmail(trimmedEmail);

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <main className="auth-page">
        <p className="auth-wordmark">
          li<span className="tilt">b</span>bro
        </p>
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <h1 className="font-serif text-xl font-semibold">Check your email</h1>
          <p className="text-sm text-ink/70">
            If an account exists for {email}, a password reset link is on its
            way.
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
            void sendResetLink();
          }
        }}
        className="auth-form"
        autoComplete="off"
        noValidate
      >
        <div className="auth-row">
          <div className="auth-field">
            <label htmlFor="forgot-password-email">Email</label>
            <input
              id="forgot-password-email"
              type="email"
              name="forgot-password-email"
              autoComplete="username"
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
        </div>

        {error && <p className="auth-form-error">{error}</p>}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => sendResetLink()}
            disabled={submitting}
            className="rounded bg-primary px-7 py-2.5 font-bold text-white disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send reset link"}
          </button>
        </div>
      </form>

      <Link to="/signin" className="text-sm text-ink/55">
        Back to sign in
      </Link>
    </main>
  );
}
