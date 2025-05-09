import { useSession } from '@/app/hooks/auth';

type PermissionCheckFunction = (permission: string | string[]) => boolean;

/**
 * Custom hook to check user permissions
 */
export function usePermissions(): {
  hasPermission: PermissionCheckFunction;
  hasRole: (role: string | string[]) => boolean;
  isLoading: boolean;
} {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';

  /**
   * Check if user has the specified permission
   */
  const hasPermission: PermissionCheckFunction = (permission) => {
    if (!session?.user?.permissions) return false;
    
    const userPermissions = session.user.permissions as string[];
    
    if (Array.isArray(permission)) {
      // Check if user has ANY of the specified permissions
      return permission.some(p => userPermissions.includes(p));
    }
    
    return userPermissions.includes(permission);
  };
  
  /**
   * Check if user has the specified role
   */
  const hasRole = (role: string | string[]): boolean => {
    if (!session?.user?.roles) return false;
    
    const userRoles = session.user.roles as string[];
    
    if (Array.isArray(role)) {
      // Check if user has ANY of the specified roles
      return role.some(r => userRoles.includes(r));
    }
    
    return userRoles.includes(role);
  };

  return { hasPermission, hasRole, isLoading };
} 