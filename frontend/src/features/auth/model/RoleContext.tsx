import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { Role } from '@contracts/common';

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
}

export const RoleContext = createContext<RoleContextValue>({
  role: 'user',
  setRole: () => {},
});

function getRoleFromURL(): Role {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  if (mode === 'admin') return 'admin';
  if (mode === 'manager') return 'manager';
  if (mode === 'dev') return 'dev';
  return 'user';
}

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>(getRoleFromURL);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const current = params.get('mode');
    if (current !== role) {
      if (role === 'user') {
        params.delete('mode');
      } else {
        params.set('mode', role);
      }
      const search = params.toString();
      const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;
      window.history.replaceState(null, '', url);
    }
  }, [role]);

  const setRole = useCallback((next: Role) => {
    setRoleState(next);
  }, []);

  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>;
}
