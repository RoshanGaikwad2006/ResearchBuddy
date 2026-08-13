import type { ReactNode } from "react";
import type { UserRole } from "../types/auth.types";
import { useAuth } from "../hooks/useAuth";

interface RoleGuardProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { role, isAuthenticated } = useAuth();

  if (!isAuthenticated || !role) {
    return <>{fallback}</>;
  }

  if (!roles.includes(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
