import { mockAuthMiddleware } from './mockAuth';
import { oidcAuthMiddleware } from './oidcAuth';

export function createAuthMiddleware() {
  const mode = process.env.AUTH_MODE;
  if (mode === 'mock') return mockAuthMiddleware;
  if (mode === 'oidc') return oidcAuthMiddleware;
  throw new Error(`Invalid AUTH_MODE: "${mode}". Expected "mock" or "oidc".`);
}
