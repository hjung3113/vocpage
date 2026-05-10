/**
 * dashboard-contract.test.ts — P1-5 + P2-1 contract guard.
 *
 * Verifies that the shared dashboard Zod schemas align with openapi.yaml:
 *   P1-5: RglLayouts breakpoints are all optional (partial record), not required.
 *         BE zero-state returns `widget_sizes: {}` which must parse without error.
 *   P2-1: RglLayoutItem uses .strict() (no extra properties).
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import { DashboardSettings, RglLayouts, RglLayoutItem } from '../../../shared/contracts/dashboard';

const yamlPath = join(__dirname, '../../../shared/openapi.yaml');
interface RglLayoutsSchema {
  type: string;
  required?: string[];
  properties?: Record<string, unknown>;
}
interface OpenApiShape {
  components?: { schemas?: Record<string, RglLayoutsSchema> };
}
const doc = yaml.load(readFileSync(yamlPath, 'utf8')) as OpenApiShape;
const schemas = doc.components?.schemas ?? {};

// ---------------------------------------------------------------------------
// P1-5: RglLayouts — empty object must parse; openapi has no required[] breakpoints
// ---------------------------------------------------------------------------

describe('P1-5: RglLayouts partial record', () => {
  it('RglLayouts.parse({}) succeeds (BE zero-state is valid)', () => {
    expect(() => RglLayouts.parse({})).not.toThrow();
  });

  it('RglLayouts.parse({ lg: [] }) succeeds (partial — only lg provided)', () => {
    expect(() => RglLayouts.parse({ lg: [] })).not.toThrow();
  });

  it('RglLayouts does not require all breakpoints to be present', () => {
    const result = RglLayouts.safeParse({});
    expect(result.success).toBe(true);
  });

  it('openapi RglLayouts schema has no required[] (all breakpoints optional)', () => {
    const rglLayoutsSchema = schemas['RglLayouts'];
    expect(rglLayoutsSchema).toBeDefined();
    // openapi required[] should be absent or empty — no breakpoint is mandatory
    const required = rglLayoutsSchema?.required ?? [];
    expect(required).toHaveLength(0);
  });

  it('DashboardSettings with widget_sizes:{} parses without error', () => {
    const raw = {
      user_id: null,
      widget_order: [],
      widget_visibility: {},
      widget_sizes: {},
      locked_fields: [],
      default_date_range: '1m',
      heatmap_default_x_axis: 'status',
      globaltabs_order: null,
      updated_at: '2026-01-01T00:00:00.000Z',
    };
    expect(() => DashboardSettings.parse(raw)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// P2-1: RglLayoutItem.strict() — reject unknown extra properties
// ---------------------------------------------------------------------------

describe('P2-1: RglLayoutItem strict', () => {
  it('RglLayoutItem.parse with valid fields succeeds', () => {
    expect(() =>
      RglLayoutItem.parse({ i: 'kpi', x: 0, y: 0, w: 2, h: 2 }),
    ).not.toThrow();
  });

  it('RglLayoutItem.parse with unknown extra field is rejected', () => {
    const result = RglLayoutItem.safeParse({ i: 'kpi', x: 0, y: 0, w: 2, h: 2, unknownProp: 'oops' });
    expect(result.success).toBe(false);
  });
});
