import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

export function AuthCard() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-7">
      {/* Mode Selector Tabs */}
      <div className="mb-5 flex rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all sm:text-sm ${
            mode === "login"
              ? "bg-card text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all sm:text-sm ${
            mode === "register"
              ? "bg-card text-foreground shadow-soft"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Create Account
        </button>
      </div>

      {mode === "login" ? (
        <>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Welcome Back</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Sign in to access your research workspace.
          </p>
          <LoginForm />
        </>
      ) : (
        <>
          <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Register Account</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Join the institutional research platform today.
          </p>
          <RegisterForm onSuccess={() => setMode("login")} />
        </>
      )}
    </div>
  );
}
