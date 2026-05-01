import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { ZodObject, ZodOptional, ZodDefault } from 'zod';
import * as VocSchemas from '../../../shared/contracts/voc';

type AnyZodObject = ZodObject<Record<string, never>>;

// U2 contract guard (Wave 1) — zod ↔ openapi 양방향 정합 가드.
// required[] 뿐 아니라 enum 값과 nullable 분기까지 비교한다.
// drift 가 생기면 본 jest 테스트가 즉시 실패하여 Source-of-Truth 분기를 막는다.

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

describe('OpenAPI contract — VocInput/Voc required FK 컬럼 (DB NOT NULL 정합)', () => {
  const required = ['voc_type_id', 'system_id', 'menu_id'] as const;

  test.each(['Voc', 'VocInput'] as const)(
    '%s.required 에 voc_type_id+system_id+menu_id 포함',
    (name) => {
      const schema = schemas[name];
      expect(schema).toBeDefined();
      for (const key of required) {
        expect(schema!.required).toContain(key);
      }
    },
  );
});

describe('U2 guard — zod ↔ openapi voc 정합 (Wave 1)', () => {
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

  test('Voc.required 매트릭스 (zod 의 비-옵셔널 키 ⊇ openapi.required)', () => {
    const yamlVoc = schemas.Voc!;
    const zodKeys = zodRequiredKeys(VocSchemas.Voc as unknown as AnyZodObject);
    for (const k of yamlVoc.required ?? []) {
      expect(zodKeys.has(k)).toBe(true);
    }
  });

  test('Voc nullable 키 정합 (yaml.nullable=true ⊆ zod nullable)', () => {
    const yamlVoc = schemas.Voc!;
    const zodNullable = zodNullableKeys(VocSchemas.Voc as unknown as AnyZodObject);
    const missing: string[] = [];
    for (const [key, prop] of Object.entries(yamlVoc.properties ?? {})) {
      if (prop.nullable && !zodNullable.has(key)) missing.push(key);
    }
    expect(missing).toEqual([]);
  });

  test('VocStatus enum 정합', () => {
    const yamlEnum = (schemas.VocStatus?.enum ?? []) as string[];
    const zodEnum = enumOptions(VocSchemas.VocStatus);
    expect([...zodEnum].sort()).toEqual([...yamlEnum].sort());
  });

  test('VocPriority enum 정합', () => {
    const yamlEnum = (schemas.VocPriority?.enum ?? []) as string[];
    const zodEnum = enumOptions(VocSchemas.VocPriority);
    expect([...zodEnum].sort()).toEqual([...yamlEnum].sort());
  });

  test('VocSource enum 정합', () => {
    const yamlEnum = (schemas.VocSource?.enum ?? []) as string[];
    const zodEnum = enumOptions(VocSchemas.VocSource);
    expect([...zodEnum].sort()).toEqual([...yamlEnum].sort());
  });

  test('VocInput.required 매트릭스', () => {
    const yamlInput = schemas.VocInput!;
    const zodKeys = zodRequiredKeys(VocSchemas.VocCreate as unknown as AnyZodObject);
    const expected = new Set(yamlInput.required ?? []);
    expected.delete('status');
    expected.delete('priority');
    for (const k of expected) {
      expect(zodKeys.has(k)).toBe(true);
    }
  });

  test('VocListItem.required 매트릭스 (zod 비-옵셔널 키 ⊇ openapi.required)', () => {
    const yamlListItem = schemas.VocListItem!;
    expect(yamlListItem).toBeDefined();
    const zodKeys = zodRequiredKeys(VocSchemas.VocListItem as unknown as AnyZodObject);
    for (const k of yamlListItem.required ?? []) {
      expect(zodKeys.has(k)).toBe(true);
    }
  });

  test('VocListItem 키 셋 정합 (yaml properties === zod shape keys)', () => {
    const yamlListItem = schemas.VocListItem!;
    const yamlKeys = new Set(Object.keys(yamlListItem.properties ?? {}));
    const zodShape = (VocSchemas.VocListItem as unknown as { shape: Record<string, unknown> })
      .shape;
    const zodKeys = new Set(Object.keys(zodShape));
    expect([...zodKeys].sort()).toEqual([...yamlKeys].sort());
  });

  test('VocListItem nullable 키 정합 (yaml.nullable=true ⊆ zod nullable)', () => {
    const yamlListItem = schemas.VocListItem!;
    const zodNullable = zodNullableKeys(VocSchemas.VocListItem as unknown as AnyZodObject);
    const missing: string[] = [];
    for (const [key, prop] of Object.entries(yamlListItem.properties ?? {})) {
      if (prop.nullable && !zodNullable.has(key)) missing.push(key);
    }
    expect(missing).toEqual([]);
  });

  test('fixture 50건 모두 Voc.parse 통과', async () => {
    const { VOC_FIXTURES } = await import('../../../shared/fixtures/voc.fixtures');
    expect(VOC_FIXTURES.length).toBeGreaterThanOrEqual(50);
    for (const row of VOC_FIXTURES) {
      expect(() => VocSchemas.Voc.parse(row)).not.toThrow();
    }
  });
});
