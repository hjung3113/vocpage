# visual-diff harness

Playwright-driven dual-render harness that compares the static prototype
(`prototype/prototype.html`) against the React `/voc` route and writes a
prioritized markdown diff report.

## Installation (one-time)

After `npm install` in the repo root, install Playwright's Chromium binary:

```sh
npx -w frontend playwright install chromium
```

> Note: this downloads ~250 MB of browser binaries. Run once per machine.
> Binaries are stored in `~/.cache/ms-playwright` and are NOT committed to git.

## Usage

```sh
# Run full comparison (all 12 components)
npm run visual-diff

# Run for a single component
npm run visual-diff -- --component=voc-topbar

# Run with headed Chromium for debugging
npm run visual-diff -- --headed

# Override report output path
npm run visual-diff -- --out=./my-report.md

# Keep servers running after the run (debugging)
npm run visual-diff -- --keep-server

# Filter report to HIGH severity only
npm run visual-diff -- --severity=HIGH
```

## Options

| Option               | Default                                                           | Description                               |
| -------------------- | ----------------------------------------------------------------- | ----------------------------------------- |
| `--component=<id>`   | all 12                                                            | Run only one componentId. Repeatable.     |
| `--out=<path>`       | `docs/specs/reviews/wave1.5-followup-a/voc-visual-diff-report.md` | Report output path.                       |
| `--keep-server`      | false                                                             | Don't kill spawned dev servers after run. |
| `--proto-port=<n>`   | 4174                                                              | Port for prototype http-server.           |
| `--react-port=<n>`   | 5173                                                              | Port for Vite dev server.                 |
| `--headed`           | false                                                             | Run Playwright with headed Chromium.      |
| `--severity=<level>` | LOW                                                               | Filter report to >= level (HIGH/MED/LOW). |

## Report output

`docs/specs/reviews/wave1.5-followup-a/voc-visual-diff-report.md`

Sections:

- **Summary** — HIGH/MED/LOW counts per component
- **Per-component tables** — property-level diff with severity and suggestion
- **Token Mapping Hints** — nearest design token for each observed React color
- Banners for `[NOT MEASURABLE]` and `[SELECTOR FALLBACK]` components

## Stage notes

- **Stage 1** (this): structural CSS selectors used as fallbacks; all components emit `[SELECTOR FALLBACK]` warnings.
- **Stage 2**: `data-pcomp` attribute markers land on both prototype and React roots, eliminating fallback selectors.

## Browser provisioning exemption

This tool is a dev-only utility (never deployed to production). Playwright's
bundled Chromium is used rather than vendoring. This is documented as an
exemption from the phase-8 §7.2 closed-network vendoring discipline in
`docs/specs/plans/phase-8-mirror-check.md`.
