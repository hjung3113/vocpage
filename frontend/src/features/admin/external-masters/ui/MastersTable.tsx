/**
 * MastersTable — external masters status table + refresh action.
 * Spec: requirements.md §16.3, external-masters.md §0/§6/§8
 *
 * Shows:
 *  - ModeBadge (live / snapshot / cold)
 *  - Per-source loaded_at / kept_loaded_at
 *  - Refresh button (Manager+ only; cooldown UX)
 */
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { ModeBadge } from './ModeBadge';
import { MasterSourceRow } from './MasterSourceRow';
import { useMasterStatus, useRefreshMasters } from '../api/useMastersApi';
import type { RefreshError } from '../api/useMastersApi';

const HEADERS = ['마스터', '원천', 'Refresh', '최종 로드', '이전 로드 (유지)'];

interface MastersTableProps {
  canRefresh: boolean; // admin or manager
}

export function MastersTable({ canRefresh }: MastersTableProps) {
  const { data, isPending, isError, refetch } = useMasterStatus();
  const refresh = useRefreshMasters();

  async function handleRefresh() {
    try {
      const result = await refresh.mutateAsync();
      if (result.swapped) {
        toast.success('마스터 데이터 갱신 완료', {
          description: `로드 시각: ${result.loaded_at}`,
        });
      }
    } catch (err: unknown) {
      const e = err as RefreshError;
      if (e.status === 429) {
        const until = e.details?.cooldown_until
          ? ` (${new Date(e.details.cooldown_until).toLocaleTimeString('ko-KR')}까지)`
          : '';
        toast.warning(`쿨다운 중입니다${until}`, {
          description: '5분 후 다시 시도하세요.',
        });
      } else if (e.status === 503) {
        toast.error('외부 마스터 로드 실패', {
          description: '기존 데이터를 유지합니다. 시스템 상태를 확인하세요.',
        });
      } else {
        toast.error('갱신 실패', { description: e.message ?? '알 수 없는 오류' });
      }
    }
  }

  if (isPending) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
        불러오는 중…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <p style={{ color: 'var(--status-red)', fontSize: '14px', marginBottom: '12px' }}>
          마스터 상태를 불러오지 못했습니다.
        </p>
        <Button variant="outline" onClick={() => void refetch()}>다시 시도</Button>
      </div>
    );
  }

  const isWithinCooldown = data.cooldown_until
    ? new Date(data.cooldown_until).getTime() > Date.now()
    : false;

  const cooldownLabel = isWithinCooldown && data.cooldown_until
    ? `쿨다운 (${new Date(data.cooldown_until).toLocaleTimeString('ko-KR')}까지)`
    : undefined;

  return (
    <div>
      {/* Header row: mode badge + refresh button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <ModeBadge mode={data.mode} />
        {data.mode === 'cold' && (
          <span style={{ fontSize: '13px', color: 'var(--status-red)' }}>
            스냅샷 파일이 없습니다. 수동 Refresh 후 정상화됩니다.
          </span>
        )}
        {data.mode === 'snapshot' && (
          <span style={{ fontSize: '13px', color: 'var(--status-yellow)' }}>
            디스크 스냅샷에서 로드 중입니다. Refresh로 최신 데이터를 가져오세요.
          </span>
        )}
        {canRefresh && (
          <Button
            variant="outline"
            size="sm"
            disabled={refresh.isPending || isWithinCooldown}
            onClick={() => void handleRefresh()}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}
            title={cooldownLabel}
          >
            <RefreshCw size={14} className={refresh.isPending ? 'animate-spin' : ''} />
            {refresh.isPending ? '갱신 중…' : cooldownLabel ?? '전체 Refresh'}
          </Button>
        )}
      </div>

      {/* Status table */}
      <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--surface-subtle)' }}>
              {HEADERS.map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    borderBottom: '1px solid var(--border-subtle)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <MasterSourceRow
              label="설비 마스터"
              source={data.sources.equipment}
              refreshable={true}
            />
            <MasterSourceRow
              label="DB 마스터"
              source={data.sources.db}
              refreshable={true}
            />
            <MasterSourceRow
              label="프로그램 마스터"
              source={data.sources.program}
              refreshable={false}
            />
          </tbody>
        </table>
      </div>

      {/* Global loaded_at */}
      {data.loaded_at && (
        <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          전체 최종 로드: {new Date(data.loaded_at).toLocaleString('ko-KR')}
        </p>
      )}
    </div>
  );
}
