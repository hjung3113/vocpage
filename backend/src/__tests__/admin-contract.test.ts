/**
 * Wave 3 Phase A · W3-3 — admin contract zod ↔ openapi parity guard.
 *
 * Mirrors `voc-contract.test.ts` (U2 guard pattern). For each admin domain
 * (tag / trash / master / user), verifies:
 *  - OpenAPI required[] is a subset of zod's non-optional shape keys.
 *  - OpenAPI nullable=true keys are nullable in zod.
 *  - Enum equality between zod schema and openapi enum array.
 *
 * Drift in either direction fails this test, blocking merge before W3-4..W3-7.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { ZodObject, ZodOptional, ZodDefault } from 'zod';
import * as Admin from '../../../shared/contracts/admin';

type AnyZodObject = ZodObject<Record<string, never>>;

interface SchemaShape {
  required?: string[];
  properties?: Record<string, { enum?: readonly string[]; nullable?: boolean; $ref?: string }>;
  enum?: readonly string[];
  nullable?: boolean;
}
interface OpenApiShape {
  components?: { schemas?: Record<string, SchemaShape> };
}

const yamlPath = join(__dirname, '../../../shared/openapi.yaml');
const doc = yaml.load(readFileSync(yamlPath, 'utf8')) as OpenApiShape;
const schemas = doc.components?.schemas ?? {};

function zodRequiredKeys(obj: AnyZodObject): Set<string> {
  const out = new Set<string>();
  const shape = (obj as unknown as { shape: Record<string, unknown> }).shape;
  for (const [key, value] of Object.entries(shape)) {
    if (value instanceof ZodOptional || value instanceof ZodDefault) continue;
    out.add(key);
  }
  return out;
}

function zodNullableKeys(obj: AnyZodObject): Set<string> {
  const out = new Set<string>();
  const shape = (
    obj as unknown as {
      shape: Record<string, { safeParse(v: unknown): { success: boolean } }>;
    }
  ).shape;
  for (const [key, value] of Object.entries(shape)) {
    if (value.safeParse(null).success) out.add(key);
  }
  return out;
}

function enumOptions(schema: unknown): string[] {
  return Object.values((schema as { options: Record<string, string> }).options ?? {});
}

function expectRequiredSubset(yamlName: string, zodSchema: AnyZodObject) {
  const yamlSchema = schemas[yamlName];
  expect(yamlSchema).toBeDefined();
  const zodKeys = zodRequiredKeys(zodSchema);
  for (const k of yamlSchema!.required ?? []) {
    expect(zodKeys.has(k)).toBe(true);
  }
}

function expectNullableSubset(yamlName: string, zodSchema: AnyZodObject) {
  const yamlSchema = schemas[yamlName];
  expect(yamlSchema).toBeDefined();
  const zodNullable = zodNullableKeys(zodSchema);
  const missing: string[] = [];
  for (const [key, prop] of Object.entries(yamlSchema!.properties ?? {})) {
    if (prop.nullable && !zodNullable.has(key)) missing.push(key);
  }
  expect(missing).toEqual([]);
}

function expectEnumEqual(yamlName: string, zodSchema: unknown) {
  const yamlEnum = (schemas[yamlName]?.enum ?? []) as string[];
  expect(yamlEnum.length).toBeGreaterThan(0);
  const zodEnum = enumOptions(zodSchema);
  expect([...zodEnum].sort()).toEqual([...yamlEnum].sort());
}

describe('admin contract — tag domain', () => {
  test('TagMasterItem required ⊆ zod', () => {
    expectRequiredSubset('TagMasterItem', Admin.TagMasterItem as unknown as AnyZodObject);
  });
  test('TagMasterItem nullable ⊆ zod', () => {
    expectNullableSubset('TagMasterItem', Admin.TagMasterItem as unknown as AnyZodObject);
  });
  test('TagMasterListResponse required ⊆ zod', () => {
    expectRequiredSubset(
      'TagMasterListResponse',
      Admin.TagMasterListResponse as unknown as AnyZodObject,
    );
  });
  test('TagMasterCreate required ⊆ zod', () => {
    expectRequiredSubset('TagMasterCreate', Admin.TagMasterCreate as unknown as AnyZodObject);
  });
  test('TagMasterPatch required ⊆ zod', () => {
    expectRequiredSubset('TagMasterPatch', Admin.TagMasterPatch as unknown as AnyZodObject);
  });
  test('TagMasterMergeInput required ⊆ zod', () => {
    expectRequiredSubset(
      'TagMasterMergeInput',
      Admin.TagMasterMergeInput as unknown as AnyZodObject,
    );
  });
  test('TagExternalToggle required ⊆ zod', () => {
    expectRequiredSubset('TagExternalToggle', Admin.TagExternalToggle as unknown as AnyZodObject);
  });
  test('TagRuleSuspendInput required ⊆ zod + nullable parity', () => {
    expectRequiredSubset(
      'TagRuleSuspendInput',
      Admin.TagRuleSuspendInput as unknown as AnyZodObject,
    );
    expectNullableSubset(
      'TagRuleSuspendInput',
      Admin.TagRuleSuspendInput as unknown as AnyZodObject,
    );
  });

  // Phase 01 Plan 03 — TagRule consolidation (D-05/D-06/D-07/D-08/D-12 + OQ-R5).
  test('TagRule required ⊆ zod + nullable parity', () => {
    expectRequiredSubset('TagRule', Admin.TagRule as unknown as AnyZodObject);
    expectNullableSubset('TagRule', Admin.TagRule as unknown as AnyZodObject);
  });
  test('TagRuleCreate required ⊆ zod', () => {
    expectRequiredSubset('TagRuleCreate', Admin.TagRuleCreate as unknown as AnyZodObject);
  });
  test('TagRulePatch all-optional parity', () => {
    expectRequiredSubset('TagRulePatch', Admin.TagRulePatch as unknown as AnyZodObject);
  });
  test('TagRuleListQuery defaults parity', () => {
    expectRequiredSubset('TagRuleListQuery', Admin.TagRuleListQuery as unknown as AnyZodObject);
  });
  test('TagRuleListResponse required ⊆ zod', () => {
    expectRequiredSubset(
      'TagRuleListResponse',
      Admin.TagRuleListResponse as unknown as AnyZodObject,
    );
  });
});

describe('admin contract — trash domain', () => {
  test('TrashListItem required ⊆ zod', () => {
    expectRequiredSubset('TrashListItem', Admin.TrashListItem as unknown as AnyZodObject);
  });
  test('TrashListItem nullable ⊆ zod', () => {
    expectNullableSubset('TrashListItem', Admin.TrashListItem as unknown as AnyZodObject);
  });
  test('TrashListResponse required ⊆ zod', () => {
    expectRequiredSubset('TrashListResponse', Admin.TrashListResponse as unknown as AnyZodObject);
  });
  test('VocRestoreLogEntry required ⊆ zod + nullable parity', () => {
    expectRequiredSubset('VocRestoreLogEntry', Admin.VocRestoreLogEntry as unknown as AnyZodObject);
    expectNullableSubset('VocRestoreLogEntry', Admin.VocRestoreLogEntry as unknown as AnyZodObject);
  });
  test('VocRestoreResponse required ⊆ zod', () => {
    expectRequiredSubset('VocRestoreResponse', Admin.VocRestoreResponse as unknown as AnyZodObject);
  });
  test('TrashRestoreAction enum equality', () => {
    const yamlEnum = (schemas.VocRestoreLogEntry?.properties?.action?.enum ?? []) as string[];
    const zodEnum = enumOptions(Admin.TrashRestoreAction);
    expect([...zodEnum].sort()).toEqual([...yamlEnum].sort());
  });
});

describe('admin contract — master domain', () => {
  test('MasterStatus required ⊆ zod + nullable parity', () => {
    expectRequiredSubset('MasterStatus', Admin.MasterStatus as unknown as AnyZodObject);
    expectNullableSubset('MasterStatus', Admin.MasterStatus as unknown as AnyZodObject);
  });
  test('MasterRefreshResult required ⊆ zod', () => {
    expectRequiredSubset(
      'MasterRefreshResult',
      Admin.MasterRefreshResult as unknown as AnyZodObject,
    );
  });
});

describe('admin contract — user domain', () => {
  test('UserRole enum equality', () => {
    expectEnumEqual('UserRole', Admin.UserRole);
  });
  test('AdminUserItem required ⊆ zod', () => {
    expectRequiredSubset('AdminUserItem', Admin.AdminUserItem as unknown as AnyZodObject);
  });
  test('AdminUserListResponse required ⊆ zod', () => {
    expectRequiredSubset(
      'AdminUserListResponse',
      Admin.AdminUserListResponse as unknown as AnyZodObject,
    );
  });
  test('UserRoleLogEntry required ⊆ zod + nullable parity', () => {
    expectRequiredSubset('UserRoleLogEntry', Admin.UserRoleLogEntry as unknown as AnyZodObject);
    expectNullableSubset('UserRoleLogEntry', Admin.UserRoleLogEntry as unknown as AnyZodObject);
  });
  test('AdminUserPatch openapi anyOf constraint mirrors zod refine (at least one of role/is_active)', () => {
    // If this fails, openapi allows {} which zod .refine() rejects at runtime.
    const schema = doc.components?.schemas?.['AdminUserPatch'] as SchemaShape & {
      anyOf?: Array<{ required?: string[] }>;
    };
    expect(schema).toBeDefined();
    expect(schema.anyOf).toBeDefined();
    const covered = (schema.anyOf ?? []).flatMap((s) => s.required ?? []);
    expect(covered).toContain('role');
    expect(covered).toContain('is_active');
  });
});
