import { useState } from "react";
import { Navigate, useNavigate } from "react-router";
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
    return null;
  }

  if (!user) {
    return <Navigate to="/forgot-password" replace />;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold">Set a new password</h1>
      <form
        onSubmit={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            void savePassword();
          }
        }}
        className="flex flex-col gap-3"
        noValidate
      >
        <input
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
          className={`auth-secret-input rounded border bg-white px-3 py-2${
            password && isValidPassword(password) ? " border-[#7da57b]" : ""
          }${passwordError ? " border-[#d99b9b]" : ""}`}
        />
        {passwordError && <p className="auth-error">{passwordError}</p>}
        <div className="password-checklist" aria-label="Password requirements">
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
        {error && <p className="auth-form-error">{error}</p>}
        <button
          type="button"
          onClick={() => savePassword()}
          disabled={submitting}
          className="rounded bg-primary px-3 py-2 text-white disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save new password"}
        </button>
      </form>
    </main>
  );
}
