import { useCallback } from 'react';
import { useAuth } from './useAuth';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;

    // Check if user has the required permission
    // This is a simplified version, you should adapt it based on your actual permission structure
    return user.permissions?.includes(permission) || false;
  }, [user]);

  return { hasPermission };
}; 