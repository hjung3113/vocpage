// Moved to features/auth (Step 4)
export type { AuthUser } from '@entities/user/api/userApi';
export type { AuthRole } from '@entities/user/api/userApi';
export { getMe } from '@entities/user/api/userApi';
export { mockLogin, logout } from '@features/auth/api/authApi';
