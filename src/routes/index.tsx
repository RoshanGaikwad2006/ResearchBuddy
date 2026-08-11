import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  BrainCircuit,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

import illustration from "@/assets/research-illustration.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign In | AI-Powered Institutional Research Platform" },
      {
        name: "description",
        content:
          "Sign in to the AI-Powered Institutional Research Platform to manage publications, track research contributions and generate insights.",
      },
      { property: "og:title", content: "Sign In | AI-Powered Institutional Research Platform" },
      {
        property: "og:description",
        content:
          "Secure access for faculty, students and administrators to the institutional research workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("faculty");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Signed in", {
        description: `Welcome back to your ${role} research workspace.`,
      });
      navigate({ to: "/dashboard" });
    }, 900);
  };

  return (
    <>
      <Toaster />
      <div className="min-h-screen lg:grid lg:grid-cols-[1.05fr_1fr]">
        {/* Branding panel */}
        <section className="relative isolate flex min-h-[420px] flex-col justify-center overflow-hidden bg-gradient-navy px-6 py-6 text-navy-foreground sm:px-10 lg:min-h-screen lg:px-14 lg:py-8">
          <div className="pointer-events-none absolute inset-0 grid-pattern opacity-70" aria-hidden />
          <div
            className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-40 right-0 h-[26rem] w-[26rem] rounded-full bg-primary-glow/20 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-4 text-center lg:items-start lg:text-left">
            <header className="flex min-w-0 items-center gap-3 animate-rise">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary shadow-soft">
                <BrainCircuit className="h-6 w-6 text-primary-foreground" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-[0.18em] uppercase text-primary-glow">
                  IRP
                </p>
                <h1 className="truncate text-base font-semibold sm:text-lg">
                  AI-Powered Institutional Research Platform
                </h1>
              </div>
            </header>

            <div className="animate-rise [animation-delay:80ms]">
              <span className="inline-flex items-center rounded-full border border-navy-foreground/10 bg-navy-foreground/5 px-3 py-1 text-xs font-semibold tracking-wider text-primary-glow uppercase backdrop-blur-sm">
                AI-Driven Research Management
              </span>
              <p className="mt-3 text-2xl leading-snug font-semibold sm:text-3xl">
                Transforming Research Management Through AI
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-navy-foreground/70 lg:mx-0 sm:text-base">
                Centralize publications, automate DOI-based metadata retrieval, and gain meaningful
                research insights through a unified platform.
              </p>
            </div>

            <div className="relative w-full max-w-lg animate-rise [animation-delay:140ms]">
              <img
                src={illustration}
                alt="Illustration of research dashboards, publications and an AI citation network"
                width={1200}
                height={912}
                className="animate-float w-full rounded-3xl border border-navy-foreground/10 shadow-card"
              />
            </div>
          </div>
        </section>

        {/* Auth panel */}
        <section className="flex min-h-screen flex-col justify-center bg-background px-5 py-8 sm:px-10 lg:min-h-0 lg:px-14 lg:py-10">
          <div className="mx-auto w-full max-w-md animate-rise">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-7">
              <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Welcome Back</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sign in to access your research workspace.
              </p>

              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@university.edu"
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="h-11 pr-11"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role" className="h-11 w-full">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="faculty">Faculty</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <Checkbox id="remember" />
                    <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                      Remember me
                    </Label>
                  </div>
                  <a
                    href="#"
                    className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
                  >
                    Forgot password?
                  </a>
                </div>

                <Button type="submit" disabled={loading} className="h-11 w-full text-base">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Sign In
                </Button>
              </form>
            </div>

            <footer className="mt-5 text-center text-xs text-muted-foreground">
              <p className="font-medium text-foreground/70">
                AI-Powered Institutional Research Platform
              </p>
              <p className="mt-1">Version 1.0</p>
            </footer>
          </div>
        </section>
      </div>
    </>
  );
}
