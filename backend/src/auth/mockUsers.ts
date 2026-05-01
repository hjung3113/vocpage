import { AuthUser } from './types.js';
import { FIXTURE_USERS } from '../../../shared/fixtures/voc.fixtures';

// Mock users now reference the same UUID space as `shared/fixtures/voc.fixtures`
// (v4-compliant). This unifies BE/FE auth ids with the fixture assignee_id used
// for permission tests (Wave 1 §U3=A).
export const MOCK_USERS: AuthUser[] = [
  {
    id: FIXTURE_USERS.admin,
    email: 'admin@company.com',
    name: 'Mock Admin',
    role: 'admin',
  },
  {
    id: FIXTURE_USERS.manager,
    email: 'manager@company.com',
    name: 'Mock Manager',
    role: 'manager',
  },
  {
    id: FIXTURE_USERS.user,
    email: 'user@company.com',
    name: 'Mock User',
    role: 'user',
  },
  {
    id: FIXTURE_USERS.devSelf,
    email: 'dev@company.com',
    name: 'Mock Dev',
    role: 'dev',
  },
];
