import { useRole } from '@entities/user/model/useRole';

export function useVocPermissions() {
  const { role, isDev, isManager, isAdmin } = useRole();
  return {
    canWrite: role !== 'user',
    canUpload: isManager || isAdmin,
    canSeeInternal: isDev || isManager || isAdmin,
  };
}
