import { useEffect, useState } from 'react';
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
          width: '480px',
          background: 'var(--bg-panel)',
          borderLeft: '1px solid var(--border)',
          zIndex: 50,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex flex-col gap-1 flex-1 min-w-0 pr-4">
            {voc && (
              <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                {voc.issue_code ?? '—'}
              </span>
            )}
            <h2
              className="text-base font-semibold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {isLoading ? '불러오는 중...' : (voc?.title ?? '—')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 px-2 py-1 rounded text-sm"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto px-6 py-4">
          {error && (
            <p className="text-sm" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          {!isLoading && voc && (
            <>
              {/* Meta section */}
              <div
                className="flex flex-col gap-3 mb-6 p-4 rounded-lg"
                style={{ background: 'var(--bg-surface)' }}
              >
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: 'var(--text-muted)', width: '64px', flexShrink: 0 }}>
                    상태
                  </span>
                  {canChangeStatus ? (
                    <div className="flex items-center gap-2">
                      <StatusDot status={voc.status} />
                      <select
                        value={voc.status}
                        onChange={(e) => {
                          void handleStatusChange(e.target.value);
                        }}
                        style={{
                          background: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          border: '1px solid var(--border)',
                          borderRadius: '4px',
                          padding: '2px 6px',
                          fontSize: 'inherit',
                          cursor: 'pointer',
                        }}
                      >
                        <option value={voc.status}>{voc.status}</option>
                        {(STATUS_TRANSITIONS[voc.status] ?? []).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <StatusDot status={voc.status} />
                      <span style={{ color: 'var(--text-primary)' }}>{voc.status}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: 'var(--text-muted)', width: '64px', flexShrink: 0 }}>
                    우선순위
                  </span>
                  <PriorityBadge priority={voc.priority} />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span style={{ color: 'var(--text-muted)', width: '64px', flexShrink: 0 }}>
                    등록일
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {formatDate(voc.created_at)}
                  </span>
                </div>
                {voc.due_date && (
                  <div className="flex items-center gap-2 text-sm">
                    <span style={{ color: 'var(--text-muted)', width: '64px', flexShrink: 0 }}>
                      기한
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(voc.due_date)}
                    </span>
                  </div>
                )}
              </div>

              {/* Tabs */}
              <div
                className="flex gap-0 mb-4 shrink-0"
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="px-4 py-2 text-sm font-medium"
                    style={{
                      color: activeTab === tab.key ? 'var(--brand)' : 'var(--text-secondary)',
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
                <div>
                  <pre
                    className="text-sm whitespace-pre-wrap break-words"
                    style={{
                      color: 'var(--text-primary)',
                      fontFamily: 'inherit',
                      lineHeight: '1.6',
                    }}
                  >
                    {voc.body}
                  </pre>

                  <div className="mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                        태그
                      </span>
                      {canEditTags && (
                        <button
                          onClick={() => setShowTagSelect((v) => !v)}
                          className="text-xs px-2 py-0.5 rounded"
                          style={{
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
                    <div className="flex flex-wrap gap-1">
                      {vocTags.map((t) => (
                        <TagChip
                          key={t.tag_id}
                          name={t.name}
                          source={t.source}
                          onRemove={canEditTags ? () => handleRemoveTag(t.tag_id) : undefined}
                        />
                      ))}
                    </div>
                    {showTagSelect && canEditTags && (
                      <select
                        className="mt-2 text-sm px-2 py-1 rounded"
                        style={{
                          border: '1px solid var(--border)',
                          background: 'var(--bg-surface)',
                          color: 'var(--text-primary)',
                          width: '100%',
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
