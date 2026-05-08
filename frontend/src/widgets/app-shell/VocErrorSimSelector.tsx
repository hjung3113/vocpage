import { useEffect, useState } from 'react';
import { useRole } from '@entities/user/model/useRole';
import {
  setErrorSimMode,
  getErrorSimMode,
  subscribeErrorSimMode,
  type ErrorSimMode,
} from '../../shared/dev/errorSim';

const OPTIONS: { value: ErrorSimMode; label: string }[] = [
  { value: 'off', label: '오류 시뮬: 없음' },
  { value: 'network-fail', label: '네트워크 실패' },
  { value: 'http-500', label: 'HTTP 500' },
  { value: 'slow', label: '3초 지연' },
  { value: 'partial', label: '부분 응답(1건)' },
];

/**
 * Dev-only error simulation selector — only renders for `dev` / `admin` roles.
 * Toggles the global MSW handler error mode (see `frontend/src/shared/dev/errorSim.ts`).
 *
 * FU L-1: subscribes to cross-tab + same-tab mode changes so a select in one
 * tab/window propagates to all instances of this component.
 */
export function VocErrorSimSelector() {
  const { role } = useRole();
  const [mode, setMode] = useState<ErrorSimMode>(() => getErrorSimMode());

  useEffect(() => subscribeErrorSimMode(setMode), []);

  if (role !== 'dev' && role !== 'admin') return null;

  return (
    <label
      className="flex items-center gap-1 rounded border border-[color:var(--border-standard)] bg-[color:var(--bg-surface)] px-2 py-1 text-xs"
      style={{ color: 'var(--text-secondary)' }}
      data-testid="voc-error-sim-selector"
    >
      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SIM</span>
      <select
        aria-label="MSW 오류 시뮬레이션"
        value={mode}
        onChange={(e) => {
          const next = e.target.value as ErrorSimMode;
          setErrorSimMode(next);
        }}
        className="bg-transparent outline-none"
        style={{ fontSize: '12px', color: 'var(--text-primary)' }}
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
