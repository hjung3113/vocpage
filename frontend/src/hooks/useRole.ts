import { useContext } from 'react';
import { RoleContext } from '../contexts/RoleContext';
import type { Role } from '../../../shared/contracts/common';

/**
 * Returns the current role and derived helpers.
 *
 * Role-aware query keys (queryKeys.ts) already embed `role`, so TanStack Query
 * automatically re-fetches under the new key when the role changes — no manual
 * `queryClient.invalidateQueries` is needed here.
 */
export function useRole(): {
  role: Role;
  setRole: (role: Role) => void;
  isUser: boolean;
  isDev: boolean;
  isManager: boolean;
  isAdmin: boolean;
} {
  const { role, setRole } = useContext(RoleContext);
  return {
    role,
    setRole,
    isUser: role === 'user',
    isDev: role === 'dev',
    isManager: role === 'manager',
    isAdmin: role === 'admin',
  };
}
