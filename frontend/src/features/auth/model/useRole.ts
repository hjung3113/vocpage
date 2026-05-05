import { useContext } from 'react';
import { RoleContext } from './RoleContext';
import type { Role } from '@contracts/common';

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
