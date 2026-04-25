import { useCallback, useContext, useEffect, useState } from 'react';
import { tokens } from '../tokens';
import { AuthContext } from '../contexts/AuthContext';
import {
  listAdminSystems,
  createSystem,
  updateSystem,
  listAdminMenus,
  createMenu,
  updateMenu,
  listVocTypes,
  createVocType,
  updateVocType,
  listAdminUsers,
  updateUser,
  type SystemItem,
  type MenuItem,
  type VocType,
  type UserItem,
} from '../api/admin';
import {
  listTagRules,
  createTagRule,
  updateTagRule,
  deleteTagRule,
  listTags,
  type TagRule,
  type Tag,
} from '../api/tags';

function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

// ─── Shared table styles ───────────────────────────────────────────────────

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '13px',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  borderBottom: '2px solid var(--border)',
  color: 'var(--text-muted)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--text-primary)',
  verticalAlign: 'middle',
};

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '13px',
  color: 'var(--text-primary)',
  outline: 'none',
};

const btnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  padding: '3px 10px',
  fontSize: '12px',
  cursor: 'pointer',
  color: 'var(--text-secondary)',
};

const btnPrimaryStyle: React.CSSProperties = {
  background: 'var(--brand)',
  border: '1px solid var(--brand)',
  borderRadius: '4px',
  padding: '3px 10px',
  fontSize: '12px',
  cursor: 'pointer',
  color: 'var(--bg-app)',
};

// ─── Systems & Menus Tab ──────────────────────────────────────────────────

function SystemsTab() {
  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [showAddSystem, setShowAddSystem] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [newSystem, setNewSystem] = useState({ name: '', slug: '' });
  const [newMenu, setNewMenu] = useState({ name: '', slug: '' });
  const [error, setError] = useState('');

  const loadSystems = useCallback(async () => {
    try {
      const data = await listAdminSystems();
      setSystems(data);
    } catch {
      setError('시스템 목록을 불러오지 못했습니다.');
    }
  }, []);

  const loadMenus = useCallback(async (systemId: string) => {
    try {
      const data = await listAdminMenus(systemId);
      setMenus(data);
    } catch {
      setError('메뉴 목록을 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    void loadSystems();
  }, [loadSystems]);

  useEffect(() => {
    if (selectedSystemId) void loadMenus(selectedSystemId);
    else setMenus([]);
  }, [selectedSystemId, loadMenus]);

  const handleArchiveSystem = async (sys: SystemItem) => {
    try {
      const updated = await updateSystem(sys.id, { is_archived: !sys.is_archived });
      setSystems((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } catch {
      setError('시스템 상태 변경 실패');
    }
  };

  const handleAddSystem = async () => {
    if (!newSystem.name || !newSystem.slug) return;
    try {
      const { system } = await createSystem(newSystem);
      setSystems((prev) => [...prev, system]);
      setNewSystem({ name: '', slug: '' });
      setShowAddSystem(false);
    } catch {
      setError('시스템 추가 실패');
    }
  };

  const handleArchiveMenu = async (menu: MenuItem) => {
    try {
      const updated = await updateMenu(menu.id, { is_archived: !menu.is_archived });
      setMenus((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch {
      setError('메뉴 상태 변경 실패');
    }
  };

  const handleAddMenu = async () => {
    if (!selectedSystemId || !newMenu.name || !newMenu.slug) return;
    try {
      const menu = await createMenu({ system_id: selectedSystemId, ...newMenu });
      setMenus((prev) => [...prev, menu]);
      setNewMenu({ name: '', slug: '' });
      setShowAddMenu(false);
    } catch {
      setError('메뉴 추가 실패');
    }
  };

  return (
    <div>
      {error && (
        <p style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '13px' }}>{error}</p>
      )}

      {/* Systems table */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          시스템
        </h3>
        <button style={btnPrimaryStyle} onClick={() => setShowAddSystem(true)}>
          + 시스템 추가
        </button>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>이름</th>
            <th style={thStyle}>슬러그</th>
            <th style={thStyle}>VOC수</th>
            <th style={thStyle}>상태</th>
            <th style={thStyle}>작업</th>
          </tr>
        </thead>
        <tbody>
          {systems.map((sys) => (
            <tr
              key={sys.id}
              onClick={() => setSelectedSystemId(sys.id === selectedSystemId ? null : sys.id)}
              style={{
                cursor: 'pointer',
                background: sys.id === selectedSystemId ? 'var(--bg-surface)' : 'transparent',
              }}
            >
              <td style={tdStyle}>{sys.name}</td>
              <td style={{ ...tdStyle, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {sys.slug}
              </td>
              <td style={tdStyle}>{sys.voc_count}</td>
              <td style={tdStyle}>
                <span style={{ color: sys.is_archived ? 'var(--text-muted)' : 'var(--accent)' }}>
                  {sys.is_archived ? '보관됨' : '활성'}
                </span>
              </td>
              <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                <button style={btnStyle} onClick={() => void handleArchiveSystem(sys)}>
                  {sys.is_archived ? '복원' : '보관'}
                </button>
              </td>
            </tr>
          ))}
          {showAddSystem && (
            <tr>
              <td style={tdStyle}>
                <input
                  style={inputStyle}
                  placeholder="이름"
                  value={newSystem.name}
                  onChange={(e) => setNewSystem((p) => ({ ...p, name: e.target.value }))}
                />
              </td>
              <td style={tdStyle}>
                <input
                  style={inputStyle}
                  placeholder="슬러그"
                  value={newSystem.slug}
                  onChange={(e) => setNewSystem((p) => ({ ...p, slug: e.target.value }))}
                />
              </td>
              <td style={tdStyle} />
              <td style={tdStyle} />
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button style={btnPrimaryStyle} onClick={() => void handleAddSystem()}>
                    확인
                  </button>
                  <button
                    style={btnStyle}
                    onClick={() => {
                      setShowAddSystem(false);
                      setNewSystem({ name: '', slug: '' });
                    }}
                  >
                    취소
                  </button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Menus table — shown when system selected */}
      {selectedSystemId && (
        <div style={{ marginTop: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <h3
              style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}
            >
              메뉴 — {systems.find((s) => s.id === selectedSystemId)?.name}
            </h3>
            <button style={btnPrimaryStyle} onClick={() => setShowAddMenu(true)}>
              + 메뉴 추가
            </button>
          </div>

          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>이름</th>
                <th style={thStyle}>슬러그</th>
                <th style={thStyle}>VOC수</th>
                <th style={thStyle}>상태</th>
                <th style={thStyle}>작업</th>
              </tr>
            </thead>
            <tbody>
              {menus.map((menu) => (
                <tr key={menu.id}>
                  <td style={tdStyle}>{menu.name}</td>
                  <td style={{ ...tdStyle, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {menu.slug}
                  </td>
                  <td style={tdStyle}>{menu.voc_count}</td>
                  <td style={tdStyle}>
                    <span
                      style={{ color: menu.is_archived ? 'var(--text-muted)' : 'var(--accent)' }}
                    >
                      {menu.is_archived ? '보관됨' : '활성'}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <button style={btnStyle} onClick={() => void handleArchiveMenu(menu)}>
                      {menu.is_archived ? '복원' : '보관'}
                    </button>
                  </td>
                </tr>
              ))}
              {showAddMenu && (
                <tr>
                  <td style={tdStyle}>
                    <input
                      style={inputStyle}
                      placeholder="이름"
                      value={newMenu.name}
                      onChange={(e) => setNewMenu((p) => ({ ...p, name: e.target.value }))}
                    />
                  </td>
                  <td style={tdStyle}>
                    <input
                      style={inputStyle}
                      placeholder="슬러그"
                      value={newMenu.slug}
                      onChange={(e) => setNewMenu((p) => ({ ...p, slug: e.target.value }))}
                    />
                  </td>
                  <td style={tdStyle} />
                  <td style={tdStyle} />
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button style={btnPrimaryStyle} onClick={() => void handleAddMenu()}>
                        확인
                      </button>
                      <button
                        style={btnStyle}
                        onClick={() => {
                          setShowAddMenu(false);
                          setNewMenu({ name: '', slug: '' });
                        }}
                      >
                        취소
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── VOC Types Tab ────────────────────────────────────────────────────────

function VocTypesTab() {
  const [types, setTypes] = useState<VocType[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newType, setNewType] = useState<{ name: string; slug: string; color: string }>({
    name: '',
    slug: '',
    color: tokens.defaultTypeColor,
  });
  const [error, setError] = useState('');

  const loadTypes = useCallback(async () => {
    try {
      const data = await listVocTypes();
      setTypes(data);
    } catch {
      setError('유형 목록을 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  const handleArchive = async (t: VocType) => {
    try {
      const updated = await updateVocType(t.id, { is_archived: !t.is_archived });
      setTypes((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    } catch {
      setError('유형 상태 변경 실패');
    }
  };

  const handleAdd = async () => {
    if (!newType.name || !newType.slug) return;
    try {
      const created = await createVocType(newType);
      setTypes((prev) => [...prev, created]);
      setNewType({ name: '', slug: '', color: tokens.defaultTypeColor });
      setShowAdd(false);
    } catch {
      setError('유형 추가 실패');
    }
  };

  return (
    <div>
      {error && (
        <p style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '13px' }}>{error}</p>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          VOC 유형
        </h3>
        <button style={btnPrimaryStyle} onClick={() => setShowAdd(true)}>
          + 유형 추가
        </button>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>이름</th>
            <th style={thStyle}>슬러그</th>
            <th style={thStyle}>색상</th>
            <th style={thStyle}>정렬순서</th>
            <th style={thStyle}>상태</th>
            <th style={thStyle}>작업</th>
          </tr>
        </thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.id}>
              <td style={tdStyle}>{t.name}</td>
              <td style={{ ...tdStyle, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {t.slug}
              </td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* color from DB — direct hex is intentional here */}
                  <span
                    style={{
                      display: 'inline-block',
                      width: '16px',
                      height: '16px',
                      borderRadius: '3px',
                      background: t.color,
                      border: '1px solid var(--border)',
                    }}
                  />
                  <span
                    style={{
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {t.color}
                  </span>
                </div>
              </td>
              <td style={tdStyle}>{t.sort_order}</td>
              <td style={tdStyle}>
                <span style={{ color: t.is_archived ? 'var(--text-muted)' : 'var(--accent)' }}>
                  {t.is_archived ? '보관됨' : '활성'}
                </span>
              </td>
              <td style={tdStyle}>
                <button style={btnStyle} onClick={() => void handleArchive(t)}>
                  {t.is_archived ? '복원' : '보관'}
                </button>
              </td>
            </tr>
          ))}
          {showAdd && (
            <tr>
              <td style={tdStyle}>
                <input
                  style={inputStyle}
                  placeholder="이름"
                  value={newType.name}
                  onChange={(e) => setNewType((p) => ({ ...p, name: e.target.value }))}
                />
              </td>
              <td style={tdStyle}>
                <input
                  style={inputStyle}
                  placeholder="슬러그"
                  value={newType.slug}
                  onChange={(e) => setNewType((p) => ({ ...p, slug: e.target.value }))}
                />
              </td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <input
                    type="color"
                    value={newType.color}
                    onChange={(e) => setNewType((p) => ({ ...p, color: e.target.value }))}
                    style={{
                      width: '32px',
                      height: '28px',
                      padding: '2px',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      background: 'var(--bg-surface)',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {newType.color}
                  </span>
                </div>
              </td>
              <td style={tdStyle} />
              <td style={tdStyle} />
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button style={btnPrimaryStyle} onClick={() => void handleAdd()}>
                    확인
                  </button>
                  <button
                    style={btnStyle}
                    onClick={() => {
                      setShowAdd(false);
                      setNewType({ name: '', slug: '', color: tokens.defaultTypeColor });
                    }}
                  >
                    취소
                  </button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Tag Rules Tab ────────────────────────────────────────────────────────

function TagRulesTab() {
  const [rules, setRules] = useState<TagRule[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', pattern: '', tag_id: '' });
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [rulesData, tagsData] = await Promise.all([listTagRules(), listTags()]);
      setRules(rulesData);
      setTags(tagsData);
    } catch {
      setError('태그 규칙을 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleToggleActive = async (rule: TagRule) => {
    try {
      const updated = await updateTagRule(rule.id, { is_active: !rule.is_active });
      setRules((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {
      setError('규칙 상태 변경 실패');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 태그 규칙을 삭제하시겠습니까?')) return;
    try {
      await deleteTagRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError('규칙 삭제 실패');
    }
  };

  const handleAdd = async () => {
    if (!newRule.name || !newRule.pattern || !newRule.tag_id) return;
    try {
      const created = await createTagRule(newRule);
      setRules((prev) => [...prev, created]);
      setNewRule({ name: '', pattern: '', tag_id: '' });
      setShowAdd(false);
    } catch {
      setError('규칙 추가 실패');
    }
  };

  const tagName = (id: string) => tags.find((t) => t.id === id)?.name ?? id;

  return (
    <div>
      {error && (
        <p style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '13px' }}>{error}</p>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          태그 규칙
        </h3>
        <button style={btnPrimaryStyle} onClick={() => setShowAdd(true)}>
          + 규칙 추가
        </button>
      </div>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>규칙명</th>
            <th style={thStyle}>패턴</th>
            <th style={thStyle}>태그</th>
            <th style={thStyle}>활성 여부</th>
            <th style={thStyle}>작업</th>
          </tr>
        </thead>
        <tbody>
          {rules.map((rule) => (
            <tr key={rule.id}>
              <td style={tdStyle}>{rule.name}</td>
              <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                {rule.pattern}
              </td>
              <td style={tdStyle}>{tagName(rule.tag_id)}</td>
              <td style={tdStyle}>
                <span style={{ color: rule.is_active ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {rule.is_active ? '활성' : '비활성'}
                </span>
              </td>
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button style={btnStyle} onClick={() => void handleToggleActive(rule)}>
                    {rule.is_active ? '비활성화' : '활성화'}
                  </button>
                  <button
                    style={{ ...btnStyle, color: 'var(--danger)', borderColor: 'var(--danger)' }}
                    onClick={() => void handleDelete(rule.id)}
                  >
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {showAdd && (
            <tr>
              <td style={tdStyle}>
                <input
                  style={inputStyle}
                  placeholder="규칙명"
                  value={newRule.name}
                  onChange={(e) => setNewRule((p) => ({ ...p, name: e.target.value }))}
                />
              </td>
              <td style={tdStyle}>
                <input
                  style={inputStyle}
                  placeholder="패턴 (정규식)"
                  value={newRule.pattern}
                  onChange={(e) => setNewRule((p) => ({ ...p, pattern: e.target.value }))}
                />
              </td>
              <td style={tdStyle}>
                <select
                  style={inputStyle}
                  value={newRule.tag_id}
                  onChange={(e) => setNewRule((p) => ({ ...p, tag_id: e.target.value }))}
                >
                  <option value="">태그 선택</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </td>
              <td style={tdStyle} />
              <td style={tdStyle}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button style={btnPrimaryStyle} onClick={() => void handleAdd()}>
                    확인
                  </button>
                  <button
                    style={btnStyle}
                    onClick={() => {
                      setShowAdd(false);
                      setNewRule({ name: '', pattern: '', tag_id: '' });
                    }}
                  >
                    취소
                  </button>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────

function UsersTab({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async () => {
    try {
      const data = await listAdminUsers();
      setUsers(data);
    } catch {
      setError('사용자 목록을 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (user: UserItem, role: string) => {
    try {
      const updated = await updateUser(user.id, { role });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setError('');
    } catch (err) {
      const e = err as Error & { code?: string };
      if (e.code === 'LAST_ADMIN') {
        setError('마지막 관리자는 역할을 변경할 수 없습니다.');
      } else {
        setError('역할 변경 실패');
      }
    }
  };

  const handleToggleActive = async (user: UserItem) => {
    try {
      const updated = await updateUser(user.id, { is_active: !user.is_active });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setError('');
    } catch {
      setError('활성 상태 변경 실패');
    }
  };

  const roleLabel: Record<UserItem['role'], string> = {
    admin: '관리자',
    manager: '매니저',
    user: '사용자',
  };

  return (
    <div>
      {error && (
        <p style={{ color: 'var(--danger)', marginBottom: '12px', fontSize: '13px' }}>{error}</p>
      )}

      <h3
        style={{
          margin: '0 0 8px',
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      >
        사용자 관리
      </h3>

      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>이름</th>
            <th style={thStyle}>이메일</th>
            <th style={thStyle}>AD계정</th>
            <th style={thStyle}>역할</th>
            <th style={thStyle}>활성 여부</th>
            <th style={thStyle}>작업</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              style={{
                background: user.id === currentUserId ? 'var(--bg-surface)' : 'transparent',
              }}
            >
              <td style={tdStyle}>
                {user.name}
                {user.id === currentUserId && (
                  <span style={{ marginLeft: '6px', fontSize: '11px', color: 'var(--brand)' }}>
                    (나)
                  </span>
                )}
              </td>
              <td style={tdStyle}>{user.email}</td>
              <td style={{ ...tdStyle, fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                {user.ad_account}
              </td>
              <td style={tdStyle}>
                <select
                  style={inputStyle}
                  value={user.role}
                  onChange={(e) => void handleRoleChange(user, e.target.value)}
                >
                  <option value="user">{roleLabel.user}</option>
                  <option value="manager">{roleLabel.manager}</option>
                  <option value="admin">{roleLabel.admin}</option>
                </select>
              </td>
              <td style={tdStyle}>
                <span style={{ color: user.is_active ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {user.is_active ? '활성' : '비활성'}
                </span>
              </td>
              <td style={tdStyle}>
                <button style={btnStyle} onClick={() => void handleToggleActive(user)}>
                  {user.is_active ? '비활성화' : '활성화'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────

type TabId = 'systems' | 'types' | 'tags' | 'users' | 'notices' | 'faq';

const TABS: { id: TabId; label: string }[] = [
  { id: 'systems', label: '시스템/메뉴' },
  { id: 'types', label: '유형' },
  { id: 'tags', label: '태그 규칙' },
  { id: 'users', label: '사용자 관리' },
  { id: 'notices', label: '공지사항 관리' },
  { id: 'faq', label: 'FAQ 관리' },
];

export function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('systems');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-app)',
        color: 'var(--text-primary)',
        padding: '32px 24px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 700,
          marginBottom: '24px',
          color: 'var(--text-primary)',
        }}
      >
        관리자 설정
      </h1>

      {/* Tab bar */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          borderBottom: '2px solid var(--border)',
          marginBottom: '24px',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom:
                activeTab === tab.id ? '2px solid var(--brand)' : '2px solid transparent',
              marginBottom: '-2px',
              padding: '10px 16px',
              fontSize: '13px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              color: activeTab === tab.id ? 'var(--brand)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        style={{
          background: 'var(--bg-panel)',
          borderRadius: '8px',
          padding: '24px',
          border: '1px solid var(--border)',
        }}
      >
        {activeTab === 'systems' && <SystemsTab />}
        {activeTab === 'types' && <VocTypesTab />}
        {activeTab === 'tags' && <TagRulesTab />}
        {activeTab === 'users' && user && <UsersTab currentUserId={user.id} />}
        {(activeTab === 'notices' || activeTab === 'faq') && (
          <div style={{ padding: '16px 0' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '14px' }}>
              관리 기능은 해당 페이지에서 사용하세요.
            </p>
            <a
              href={activeTab === 'notices' ? '/notices' : '/faq'}
              style={{
                display: 'inline-block',
                padding: '8px 16px',
                background: 'var(--brand)',
                color: 'var(--bg-app)',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              {activeTab === 'notices' ? '공지사항 페이지로 이동' : 'FAQ 페이지로 이동'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
