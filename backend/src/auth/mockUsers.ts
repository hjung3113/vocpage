import { AuthUser } from './types.js';

export const MOCK_USERS: AuthUser[] = [
  {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'admin@company.com',
    name: 'Mock Admin',
    role: 'admin',
  },
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'manager@company.com',
    name: 'Mock Manager',
    role: 'manager',
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'user@company.com',
    name: 'Mock User',
    role: 'user',
  },
  {
    id: '00000000-0000-0000-0000-000000000004',
    email: 'dev@company.com',
    name: 'Mock Dev',
    role: 'dev',
  },
];
