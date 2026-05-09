/**
 * Barrel for Admin contract Zod schemas (Wave 3 Phase A · W3-3).
 * Domains: tag (Tag Master) · trash (Soft-delete restore) · master (External Masters)
 *          · user (Users + role audit).
 * Detailed permission matrix and endpoint listing live in each module.
 */
export * from './tag';
export * from './trash';
export * from './master';
export * from './user';
