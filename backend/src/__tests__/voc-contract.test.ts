import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';

// Contract guard: VocInput / Voc must keep voc_type_id, system_id, menu_id required
// (DB columns are NOT NULL — see backend/migrations/003_vocs.sql).
// If openapi.yaml drifts the required[] list, this jest test fails immediately.

interface SchemaShape {
  required?: string[];
}
interface OpenApiShape {
  components?: { schemas?: Record<string, SchemaShape> };
}

const yamlPath = join(__dirname, '../../../shared/openapi.yaml');
const doc = yaml.load(readFileSync(yamlPath, 'utf8')) as OpenApiShape;

describe('OpenAPI contract — VocInput/Voc required FK 컬럼 (DB NOT NULL 정합)', () => {
  const required = ['voc_type_id', 'system_id', 'menu_id'] as const;

  test.each(['Voc', 'VocInput'] as const)(
    '%s.required 에 voc_type_id+system_id+menu_id 포함',
    (name) => {
      const schema = doc.components?.schemas?.[name];
      expect(schema).toBeDefined();
      for (const key of required) {
        expect(schema!.required).toContain(key);
      }
    },
  );
});
