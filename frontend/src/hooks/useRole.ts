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
  isAdmin: boolean;
  isReviewer: boolean;
  isReporter: boolean;
  isDev: boolean;
} {
  const { role, setRole } = useContext(RoleContext);
  return {
    role,
    setRole,
    isAdmin: role === 'admin',
    isReviewer: role === 'reviewer',
    isReporter: role === 'reporter',
    isDev: role === 'dev',
  };
}
