import { BrainCircuit } from "lucide-react";
import illustration from "@/assets/research-illustration.jpg";
import { Toaster } from "@/components/ui/sonner";
import { AuthCard } from "../components/AuthCard";

export function AuthPage() {
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
            <AuthCard />

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
