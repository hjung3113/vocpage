import { useEffect, useState, type FormEvent } from 'react';
import { listSubtasks, createSubtask, type VocDetail } from '../../api/vocs';
import { listVocTypes, type VocType } from '../../api/admin';

interface SubtaskSectionProps {
  voc: Pick<VocDetail, 'id' | 'parent_id' | 'issue_code'>;
  onOpenVoc?: (id: string) => void;
  onUpdate?: () => void;
}

const PRIORITIES: { value: string; label: string }[] = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export function SubtaskSection({ voc, onOpenVoc, onUpdate }: SubtaskSectionProps) {
  const isSubtask = !!voc.parent_id;
  const [subtasks, setSubtasks] = useState<VocDetail[]>([]);
  const [vocTypes, setVocTypes] = useState<VocType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [vocTypeId, setVocTypeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    if (isSubtask) return;
    listSubtasks(voc.id)
      .then(setSubtasks)
      .catch(() => {});
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voc.id, isSubtask]);

  useEffect(() => {
    if (isSubtask) return;
    listVocTypes()
      .then((types) => {
        const active = types.filter((t) => !t.is_archived);
        setVocTypes(active);
        if (active.length > 0 && !vocTypeId) setVocTypeId(active[0].id);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSubtask]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !vocTypeId) return;
    setSubmitting(true);
    setError(null);
    try {
      await createSubtask(voc.id, { title: title.trim(), priority, voc_type_id: vocTypeId });
      setTitle('');
      setPriority('medium');
      setShowForm(false);
      refresh();
      onUpdate?.();
    } catch {
      setError('Sub-task 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        paddingTop: '16px',
        marginTop: '16px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <h4
          style={{
            color: 'var(--text-primary)',
            margin: 0,
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          Sub-task{!isSubtask && ` (${subtasks.length})`}
        </h4>
        {!isSubtask && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            style={{
              color: 'var(--brand)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {showForm ? '취소' : '+ 추가'}
          </button>
        )}
      </div>

      {isSubtask && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
          Sub-task는 1레벨만 지원합니다.
        </p>
      )}

      {!isSubtask && subtasks.length === 0 && !showForm && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '12px', margin: 0 }}>
          등록된 Sub-task가 없습니다.
        </p>
      )}

      {!isSubtask &&
        subtasks.map((st) => (
          <div
            key={st.id}
            onClick={() => onOpenVoc?.(st.id)}
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
              padding: '8px',
              cursor: onOpenVoc ? 'pointer' : 'default',
              borderRadius: '4px',
              background: 'var(--bg-surface)',
              marginTop: '6px',
            }}
          >
            <span
              style={{
                color: 'var(--text-muted)',
                fontSize: '11px',
                fontFamily: 'D2Coding, monospace',
              }}
            >
              {st.issue_code}
            </span>
            <span
              style={{
                color: 'var(--text-primary)',
                flex: 1,
                fontSize: '13px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {st.title}
            </span>
            <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>{st.status}</span>
          </div>
        ))}

      {!isSubtask && showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginTop: '12px',
            padding: '12px',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sub-task 제목"
            required
            style={{
              padding: '6px 8px',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              background: 'var(--bg-panel)',
              color: 'var(--text-primary)',
              fontSize: '13px',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              style={{
                flex: 1,
                padding: '6px 8px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: 'var(--bg-panel)',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            >
              {PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            <select
              value={vocTypeId}
              onChange={(e) => setVocTypeId(e.target.value)}
              required
              style={{
                flex: 1,
                padding: '6px 8px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: 'var(--bg-panel)',
                color: 'var(--text-primary)',
                fontSize: '13px',
              }}
            >
              <option value="" disabled>
                유형 선택
              </option>
              {vocTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '12px', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setTitle('');
                setError(null);
              }}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                background: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: '12px',
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !vocTypeId}
              style={{
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                background: 'var(--brand)',
                color: 'var(--text-on-brand)',
                cursor: submitting ? 'wait' : 'pointer',
                fontSize: '12px',
                opacity: submitting || !title.trim() || !vocTypeId ? 0.6 : 1,
              }}
            >
              {submitting ? '생성 중...' : '생성'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
