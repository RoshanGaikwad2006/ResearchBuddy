import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthPage } from "@/features/auth/pages/AuthPage";
import { useAuth } from "@/features/auth/hooks/useAuth";

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
  component: IndexPage,
});

function IndexPage() {
  const { isAuthenticated, isInitialized } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isInitialized, isAuthenticated, navigate]);

  return <AuthPage />;
}
