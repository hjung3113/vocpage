import { useEffect, useState } from 'react';
import { tokens } from '../../tokens';
import { Maximize2, Minimize2, Link2, Trash2, X } from 'lucide-react';
import { getVoc, updateVocStatus, getIncompleteSubtaskCount, type VocDetail } from '../../api/vocs';
import {
  listVocTags,
  listTags,
  addVocTag,
  removeVocTag,
  type VocTag,
  type Tag,
} from '../../api/tags';
import { useAuth } from '../../hooks/useAuth';
import { StatusDot } from '../common/StatusDot';
import { PriorityBadge } from '../common/PriorityBadge';
import { CommentList } from './CommentList';
import { AttachmentList } from './AttachmentList';
import { InternalNotesSection } from './InternalNotesSection';
import { PayloadSection } from './PayloadSection';
import { SubtaskSection } from './SubtaskSection';
import { TagChip } from './TagChip';

interface VocDrawerProps {
  vocId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenVoc?: (id: string) => void;
}

type Tab = 'body' | 'subtasks' | 'comments' | 'attachments' | 'notes';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export function VocDrawer({ vocId, isOpen, onClose, onOpenVoc }: VocDrawerProps) {
  const { user } = useAuth();
  const [voc, setVoc] = useState<VocDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('body');
  const [vocTags, setVocTags] = useState<VocTag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [showTagSelect, setShowTagSelect] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const role = user?.role?.toLowerCase();
  const canEditTags = role === 'manager' || role === 'admin';
  const canChangeStatus = role === 'manager' || role === 'admin';

  const STATUS_TRANSITIONS: Record<string, string[]> = {
    접수: ['검토중', '드랍'],
    검토중: ['처리중', '드랍'],
    처리중: ['완료', '드랍'],
    완료: ['처리중'],
    드랍: ['검토중', '처리중'],
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!voc) return;
    if (newStatus === '완료' && !voc.parent_id) {
      try {
        const count = await getIncompleteSubtaskCount(voc.id);
        if (count > 0) {
          const confirmed = window.confirm(
            `미완료 Sub-task가 ${count}건 있습니다.\n계속 진행하시겠습니까?`,
          );
          if (!confirmed) return;
        }
      } catch {
        // warning fetch failure does not block status change
      }
    }
    try {
      const updated = await updateVocStatus(voc.id, newStatus);
      setVoc(updated);
    } catch {
      // status change error — silently ignore for now
    }
  };

  const refreshVoc = () => {
    if (!vocId) return;
    getVoc(vocId)
      .then(setVoc)
      .catch(() => setError('VOC를 불러오지 못했습니다.'));
  };

  useEffect(() => {
    if (!vocId) {
      setVoc(null);
      setVocTags([]);
      return;
    }
    let ignored = false;
    setIsLoading(true);
    setError(null);
    setActiveTab('body');
    setShowTagSelect(false);
    getVoc(vocId)
      .then((data) => {
        if (!ignored) setVoc(data);
      })
      .catch(() => {
        if (!ignored) setError('VOC를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!ignored) setIsLoading(false);
      });
    listVocTags(vocId)
      .then((data) => {
        if (!ignored) setVocTags(data);
      })
      .catch(() => {});
    return () => {
      ignored = true;
    };
  }, [vocId]);

  useEffect(() => {
    if (canEditTags) {
      listTags()
        .then(setAllTags)
        .catch(() => {});
    }
  }, [canEditTags]);

  function handleRemoveTag(tagId: string) {
    if (!vocId) return;
    removeVocTag(vocId, tagId)
      .then(() => setVocTags((prev) => prev.filter((t) => t.tag_id !== tagId)))
      .catch(() => {});
  }

  function handleAddTag(tagId: string) {
    if (!vocId) return;
    addVocTag(vocId, tagId)
      .then((added) => {
        setVocTags((prev) => [...prev, added]);
        setShowTagSelect(false);
      })
      .catch(() => {});
  }

  const canSeeNotes = role === 'manager' || role === 'admin';
  const tabs: { key: Tab; label: string }[] = [
    { key: 'body', label: '본문' },
    { key: 'subtasks', label: '서브태스크' },
    { key: 'comments', label: '댓글' },
    { key: 'attachments', label: '첨부파일' },
    ...(canSeeNotes ? [{ key: 'notes' as Tab, label: '내부노트' }] : []),
  ];

  const metaSelectStyle: React.CSSProperties = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '6px',
    padding: '5px 9px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-ui)',
    fontSize: '12.5px',
    cursor: 'pointer',
    outline: 'none',
  };

  const metaLabelStyle: React.CSSProperties = {
    fontSize: '10.5px',
    fontWeight: 600,
    color: 'var(--text-quaternary)',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
  };

  const metaValueStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const AVATAR_COLORS = [
    tokens.chartBlue,
    tokens.chartSky,
    tokens.chartEmerald,
    tokens.chartAmber,
    tokens.chartRed,
    tokens.chartTeal,
    tokens.chartIndigo,
    tokens.brand,
  ];
  function avatarColor(name: string): string {
    let h = 0;
    for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
  }
  function InitialsAvatar({ name }: { name: string }) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: avatarColor(name),
          color: 'white',
          fontSize: '11px',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {name.charAt(0)}
      </span>
    );
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--overlay-bg)',
            zIndex: 40,
          }}
        />
      )}

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          height: '100vh',
          width: isFullscreen ? '100vw' : '528px',
          left: isFullscreen ? 0 : undefined,
          background: 'var(--bg-panel)',
          borderLeft: isFullscreen ? 'none' : '1px solid var(--border)',
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease, width 0.2s ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              flex: 1,
              minWidth: 0,
              paddingRight: '16px',
            }}
          >
            {voc && (
              <span
                style={{
                  fontFamily: 'var(--font-code)',
                  fontSize: '11px',
                  color: 'var(--accent)',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                }}
              >
                {voc.issue_code ?? '—'}
              </span>
            )}
            <h2
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: 0,
              }}
            >
              {isLoading ? '불러오는 중...' : (voc?.title ?? '—')}
            </h2>
          </div>
          {/* Header action icons */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexShrink: 0 }}>
            {/* Expand */}
            <button
              aria-label={isFullscreen ? '드로어로 보기' : '전체화면으로 보기'}
              onClick={() => setIsFullscreen((p) => !p)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-quaternary)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-quaternary)';
              }}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
            {/* Copy link */}
            <button
              aria-label="링크 복사"
              onClick={() => {
                if (voc) {
                  void navigator.clipboard.writeText(
                    `${window.location.href.split('?')[0]}?voc=${voc.id}`,
                  );
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-quaternary)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-quaternary)';
              }}
            >
              <Link2 size={15} />
            </button>
            {/* Delete */}
            <button
              aria-label="삭제"
              onClick={() => {
                /* TODO: delete handler */
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-quaternary)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-quaternary)';
              }}
            >
              <Trash2 size={15} />
            </button>
            {/* Close */}
            <button
              onClick={onClose}
              aria-label="닫기"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-tertiary)',
                cursor: 'pointer',
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {error && (
            <p
              style={{ padding: '16px 24px', fontSize: '14px', color: 'var(--danger)', margin: 0 }}
            >
              {error}
            </p>
          )}

          {!isLoading && voc && (
            <>
              {/* Meta grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  padding: '16px 24px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                {/* 상태 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={metaLabelStyle}>상태</div>
                  <div style={metaValueStyle}>
                    {canChangeStatus ? (
                      <select
                        value={voc.status}
                        onChange={(e) => {
                          void handleStatusChange(e.target.value);
                        }}
                        style={metaSelectStyle}
                      >
                        <option value={voc.status}>{voc.status}</option>
                        {(STATUS_TRANSITIONS[voc.status] ?? []).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <StatusDot status={voc.status} />
                        <span>{voc.status}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 우선순위 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={metaLabelStyle}>우선순위</div>
                  <div style={metaValueStyle}>
                    {role === 'manager' || role === 'admin' ? (
                      <select
                        value={voc.priority}
                        style={metaSelectStyle}
                        onChange={(e) => {
                          if (!voc) return;
                          fetch(`/api/vocs/${voc.id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({ priority: e.target.value }),
                          })
                            .then((r) => r.json())
                            .then((updated: VocDetail) => setVoc(updated))
                            .catch(() => {});
                        }}
                      >
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    ) : (
                      <PriorityBadge priority={voc.priority} />
                    )}
                  </div>
                </div>

                {/* 담당자 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={metaLabelStyle}>담당자</div>
                  <div style={metaValueStyle}>
                    {voc.assignee_name ? (
                      <>
                        <InitialsAvatar name={voc.assignee_name} />
                        {voc.assignee_name}
                      </>
                    ) : (
                      <span style={{ color: 'var(--text-quaternary)' }}>미배정</span>
                    )}
                  </div>
                </div>

                {/* 시스템 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={metaLabelStyle}>시스템</div>
                  <div style={metaValueStyle}>{voc.system_name ?? '—'}</div>
                </div>

                {/* 메뉴 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={metaLabelStyle}>메뉴</div>
                  <div style={metaValueStyle}>{voc.menu_name ?? '—'}</div>
                </div>

                {/* 유형 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={metaLabelStyle}>유형</div>
                  <div style={metaValueStyle}>
                    {voc.voc_type_name ? (
                      <>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'var(--accent)',
                            flexShrink: 0,
                          }}
                        />
                        {voc.voc_type_name}
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                {/* 작성자 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={metaLabelStyle}>작성자</div>
                  <div style={metaValueStyle}>
                    {voc.author_name ? (
                      <>
                        <InitialsAvatar name={voc.author_name} />
                        {voc.author_name}
                      </>
                    ) : (
                      '—'
                    )}
                  </div>
                </div>

                {/* 등록일 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={metaLabelStyle}>등록일</div>
                  <div style={metaValueStyle}>{formatDate(voc.created_at)}</div>
                </div>

                {/* 기한 (conditional) */}
                {voc.due_date && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={metaLabelStyle}>기한</div>
                    <div style={metaValueStyle}>{formatDate(voc.due_date)}</div>
                  </div>
                )}
              </div>

              {/* Tags section — always visible, outside tabs */}
              <div
                style={{
                  padding: '12px 24px',
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Left: label + chips + add button */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                      flex: 1,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 600,
                        color: 'var(--text-quaternary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.07em',
                        flexShrink: 0,
                      }}
                    >
                      태그
                    </span>
                    {vocTags.map((t) => (
                      <TagChip
                        key={t.tag_id}
                        name={t.name}
                        source={t.source}
                        onRemove={canEditTags ? () => handleRemoveTag(t.tag_id) : undefined}
                      />
                    ))}
                    {canEditTags && (
                      <button
                        onClick={() => setShowTagSelect((v) => !v)}
                        style={{
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid var(--border)',
                          color: 'var(--text-secondary)',
                          background: 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        + 태그 추가
                      </button>
                    )}
                  </div>
                  {/* Right: auto-tag button */}
                  <button
                    style={{
                      fontSize: '11px',
                      color: 'var(--accent)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      flexShrink: 0,
                    }}
                    onClick={() => {
                      /* TODO: auto-tag action */
                    }}
                  >
                    ⚡ 자동 태깅
                  </button>
                </div>
                {showTagSelect && canEditTags && (
                  <select
                    style={{
                      fontSize: '13px',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-surface)',
                      color: 'var(--text-primary)',
                      width: '100%',
                      marginTop: '4px',
                    }}
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) handleAddTag(e.target.value);
                    }}
                  >
                    <option value="" disabled>
                      태그 선택
                    </option>
                    {allTags
                      .filter((t) => !vocTags.some((vt) => vt.tag_id === t.id))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>

              {/* Tab bar */}
              <div
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  padding: '0 24px',
                  display: 'flex',
                  flexShrink: 0,
                }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      padding: '10px 12px',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: activeTab === tab.key ? 'var(--brand)' : 'var(--text-tertiary)',
                      background: 'transparent',
                      border: 'none',
                      borderBottom:
                        activeTab === tab.key ? '2px solid var(--brand)' : '2px solid transparent',
                      cursor: 'pointer',
                      marginBottom: '-1px',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {activeTab === 'body' && (
                <div style={{ padding: '16px 24px' }}>
                  <pre
                    style={{
                      fontSize: '14px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                      lineHeight: '1.6',
                      margin: 0,
                    }}
                  >
                    {voc.body}
                  </pre>
                </div>
              )}

              {activeTab === 'subtasks' && (
                <SubtaskSection voc={voc} onOpenVoc={onOpenVoc} onUpdate={refreshVoc} />
              )}

              {activeTab === 'comments' && user && (
                <CommentList vocId={voc.id} currentUserId={user.id} currentUserRole={user.role} />
              )}

              {activeTab === 'attachments' && user && (
                <AttachmentList
                  vocId={voc.id}
                  currentUserId={user.id}
                  currentUserRole={user.role}
                />
              )}

              {activeTab === 'notes' && user && canSeeNotes && (
                <InternalNotesSection
                  vocId={voc.id}
                  currentUserId={user.id}
                  currentUserRole={user.role}
                />
              )}

              {/* Payload section — only shown on body tab when VOC is in 완료 or 드랍 status */}
              {activeTab === 'body' && user && (
                <PayloadSection voc={voc} userRole={user.role} onUpdate={refreshVoc} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
