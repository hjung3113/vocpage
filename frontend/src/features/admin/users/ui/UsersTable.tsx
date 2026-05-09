/**
 * UsersTable — Admin Users screen table (W3-7 Phase E).
 * Features:
 *  - Paginated user list with role filter + search
 *  - Role inline-edit + is_active toggle (via UserRow)
 *  - Last-admin guard: 409 → toast error
 *  - "사용자 초대" button is on the page (AdminUsersPage), not here
 * Spec: requirements.md §15.2
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Users } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { UserRow } from './UserRow';
import { useUserList, usePatchUser } from '../api/useUsersApi';
import type { UserRole } from '../../../../../../shared/contracts/admin/user';

const TABLE_HEADERS = ['사용자', '이메일', '역할', '상태', '가입일', '작업'];
const ROLE_OPTIONS: UserRole[] = ['user', 'dev', 'manager', 'admin'];

export function UsersTable() {
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [activeFilter, setActiveFilter] = useState<'' | 'true' | 'false'>('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);

  const params = {
    ...(roleFilter ? { role: roleFilter as UserRole } : {}),
    ...(activeFilter !== '' ? { is_active: activeFilter === 'true' } : {}),
    ...(query ? { q: query } : {}),
    page,
    per_page: 20,
  };

  const { data, isPending: isLoading, isError, refetch } = useUserList(params);
  const patchUser = usePatchUser();

  async function handleRoleChange(id: string, role: UserRole) {
    try {
      await patchUser.mutateAsync({ id, patch: { role } });
      toast.success('역할이 변경되었습니다.');
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        toast.error('마지막 Admin은 강등할 수 없습니다.');
      } else {
        toast.error('역할 변경에 실패했습니다. 다시 시도해주세요.');
      }
    }
  }

  async function handleActiveToggle(id: string, is_active: boolean) {
    try {
      await patchUser.mutateAsync({ id, patch: { is_active } });
      toast.success(is_active ? '사용자가 활성화되었습니다.' : '사용자가 비활성화되었습니다.');
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status === 409) {
        toast.error('마지막 Admin은 비활성화할 수 없습니다.');
      } else {
        toast.error('상태 변경에 실패했습니다. 다시 시도해주세요.');
      }
    }
  }

  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);
  const isPending = patchUser.isPending;

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="이름 / 이메일 / 계정 검색"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          style={{
            fontSize: '13px', padding: '6px 10px', borderRadius: '6px',
            border: '1px solid var(--border-standard)', background: 'var(--bg-elevated)',
            color: 'var(--text-primary)', minWidth: '200px',
          }}
          aria-label="사용자 검색"
        />
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value as UserRole | ''); setPage(1); }}
          aria-label="역할 필터"
          style={{ fontSize: '13px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-standard)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
        >
          <option value="">전체 역할</option>
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select
          value={activeFilter}
          onChange={(e) => { setActiveFilter(e.target.value as '' | 'true' | 'false'); setPage(1); }}
          aria-label="활성 상태 필터"
          style={{ fontSize: '13px', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-standard)', background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
        >
          <option value="">전체 상태</option>
          <option value="true">활성</option>
          <option value="false">비활성</option>
        </select>
      </div>

      {isLoading && (
        <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>불러오는 중…</div>
      )}

      {isError && (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <p style={{ color: 'var(--status-red)', fontSize: '14px', marginBottom: '12px' }}>데이터를 불러오지 못했습니다.</p>
          <Button variant="outline" onClick={() => void refetch()}>다시 시도</Button>
        </div>
      )}

      {!isLoading && !isError && rows.length === 0 && (
        <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' }}>
          <Users size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
          <p>사용자가 없습니다.</p>
        </div>
      )}

      {!isLoading && !isError && rows.length > 0 && (
        <>
          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid var(--border-standard)', background: 'var(--bg-panel)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }} aria-label="사용자 목록">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-standard)', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  {TABLE_HEADERS.map((h) => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    onRoleChange={(id, role) => void handleRoleChange(id, role)}
                    onActiveToggle={(id, is_active) => void handleActiveToggle(id, is_active)}
                    isPending={isPending}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{total}명 · {page}/{totalPages} 페이지</span>
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>다음</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
