// Re-export shim: keeps `npm run visual-diff` working from repo root.
// Delegates to the modular harness in scripts/visual-diff/index.ts
import('./visual-diff/index.js').then((m) => m.main(process.argv.slice(2)));
