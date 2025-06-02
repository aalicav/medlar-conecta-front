import { useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";

export function usePermissions() {
  const { hasPermission: authHasPermission, hasRole: authHasRole } = useAuth();

  const hasPermission = useCallback(
    (permission: string | string[]): boolean => {
      if (Array.isArray(permission)) {
        return permission.some((p) => authHasPermission(p));
      }
      return authHasPermission(permission);
    },
    [authHasPermission]
  );

  const hasRole = useCallback(
    (role: string | string[]): boolean => {
      if (Array.isArray(role)) {
        return role.some((r) => authHasRole(r));
      }
      return authHasRole(role);
    },
    [authHasRole]
  );

  return {
    hasPermission,
    hasRole,
  };
} 