/**
 * MasterSourceRow — one row in the masters status table.
 * Spec: requirements.md §16.3
 */
import type { SourceEntry } from '../api/useMastersApi';

interface MasterSourceRowProps {
  label: string;
  source: SourceEntry | null;
  refreshable: boolean;
}

function formatTs(iso: string) {
  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function MasterSourceRow({ label, source, refreshable }: MasterSourceRowProps) {
  const cell: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--border-subtle)',
    fontSize: '14px',
    color: 'var(--text-primary)',
    verticalAlign: 'middle',
  };

  return (
    <tr>
      <td style={cell}>{label}</td>
      <td style={cell}>
        {refreshable
          ? <span style={{ color: 'var(--text-secondary)' }}>MSSQL (stub)</span>
          : <span style={{ color: 'var(--text-secondary)' }}>JSON 파일</span>}
      </td>
      <td style={cell}>
        {refreshable
          ? <span style={{ color: 'var(--status-green)', fontWeight: 500 }}>가능</span>
          : <span style={{ color: 'var(--text-tertiary)' }}>불가 (서버 재시작)</span>}
      </td>
      <td style={cell}>
        {source ? (
          <span title={source.loaded_at}>{formatTs(source.loaded_at)}</span>
        ) : (
          <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>미로드</span>
        )}
      </td>
      <td style={cell}>
        {source?.kept_loaded_at ? (
          <span title={source.kept_loaded_at} style={{ color: 'var(--status-yellow)' }}>
            {formatTs(source.kept_loaded_at)}
          </span>
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>—</span>
        )}
      </td>
    </tr>
  );
}
