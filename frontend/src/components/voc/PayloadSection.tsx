import { useEffect, useState } from 'react';
import {
  submitPayload,
  savePayloadDraft,
  getPayloadHistory,
  requestPayloadDeletion,
  type StructuredPayload,
  type VocPayloadHistoryItem,
} from '../../api/payload';

interface PayloadSectionProps {
  voc: {
    id: string;
    status: string;
    review_status: string | null;
    structured_payload: Record<string, unknown> | null;
    structured_payload_draft?: Record<string, unknown> | null;
  };
  userRole: string;
  onUpdate: () => void;
}

const FIELDS: Array<{ key: keyof StructuredPayload; label: string; required: boolean }> = [
  { key: 'equipment', label: '설비', required: false },
  { key: 'maker', label: '제조사', required: false },
  { key: 'model', label: '모델', required: false },
  { key: 'process', label: '공정', required: false },
  { key: 'symptom', label: '증상', required: true },
  { key: 'root_cause', label: '근본원인', required: true },
  { key: 'resolution', label: '조치', required: true },
];

function statusLabel(rs: string | null): { text: string; bg: string; color: string } | null {
  switch (rs) {
    case 'unverified':
      return { text: '검토 대기 중', bg: 'var(--status-amber-bg)', color: 'var(--status-amber)' };
    case 'approved':
      return { text: '승인됨', bg: 'var(--status-green-bg)', color: 'var(--status-green)' };
    case 'rejected':
      return { text: '반려됨', bg: 'var(--status-red-bg)', color: 'var(--status-red)' };
    case 'pending_deletion':
      return {
        text: '삭제 검토 중',
        bg: 'var(--status-purple-bg)',
        color: 'var(--status-purple)',
      };
    default:
      return null;
  }
}

const finalStateLabel: Record<string, string> = {
  approved: '승인됨',
  rejected: '반려됨',
  deleted: '삭제됨',
  active: '검토 대기',
};

function readField(src: Record<string, unknown> | null | undefined, key: string): string {
  if (!src) return '';
  const v = src[key];
  return typeof v === 'string' ? v : '';
}

export function PayloadSection({ voc, userRole, onUpdate }: PayloadSectionProps) {
  const canEdit = userRole === 'manager' || userRole === 'admin';
  const isFinalStatus = voc.status === '완료' || voc.status === '드랍';

  const initialSource = voc.structured_payload ?? voc.structured_payload_draft ?? null;

  const [form, setForm] = useState<Record<string, string>>(() => {
    const obj: Record<string, string> = {};
    for (const f of FIELDS) obj[f.key] = readField(initialSource, f.key);
    return obj;
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<VocPayloadHistoryItem[]>([]);

  useEffect(() => {
    const src = voc.structured_payload ?? voc.structured_payload_draft ?? null;
    const next: Record<string, string> = {};
    for (const f of FIELDS) next[f.key] = readField(src, f.key);
    setForm(next);
  }, [voc.id, voc.structured_payload, voc.structured_payload_draft]);

  if (!isFinalStatus) return null;

  const badge = statusLabel(voc.review_status);
  const unverifiedFields = Array.isArray(
    (voc.structured_payload as { unverified_fields?: unknown } | null)?.unverified_fields,
  )
    ? ((voc.structured_payload as { unverified_fields?: string[] }).unverified_fields ?? [])
    : [];

  async function handleSubmit() {
    setError(null);
    if (!form.symptom || !form.root_cause || !form.resolution) {
      setError('증상, 근본원인, 조치는 필수입니다.');
      return;
    }
    setBusy(true);
    try {
      await submitPayload(voc.id, form as unknown as StructuredPayload);
      onUpdate();
    } catch {
      setError('제출 실패');
    } finally {
      setBusy(false);
    }
  }

  async function handleDraftSave() {
    setError(null);
    setBusy(true);
    try {
      await savePayloadDraft(voc.id, form as unknown as Partial<StructuredPayload>);
    } catch {
      setError('임시저장 실패');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteRequest() {
    if (!window.confirm('이 결과의 삭제를 신청하시겠습니까?')) return;
    setBusy(true);
    try {
      await requestPayloadDeletion(voc.id);
      onUpdate();
    } catch {
      setError('삭제 신청 실패');
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenHistory() {
    setHistoryOpen(true);
    try {
      const items = await getPayloadHistory(voc.id);
      setHistory(items);
    } catch {
      setError('이력 조회 실패');
    }
  }

  function handleApplyHistory(item: VocPayloadHistoryItem) {
    const src = item.payload as Record<string, unknown>;
    const next: Record<string, string> = {};
    for (const f of FIELDS) next[f.key] = readField(src, f.key);
    setForm(next);
    setHistoryOpen(false);
  }

  return (
    <div
      style={{
        marginTop: '24px',
        padding: '16px',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
          처리 결과 (Structured Payload)
        </h3>
        {badge && (
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '999px',
              background: badge.bg,
              color: badge.color,
              fontWeight: 600,
            }}
          >
            {badge.text}
          </span>
        )}
      </div>

      {unverifiedFields.length > 0 && (
        <div
          style={{
            fontSize: '11px',
            padding: '6px 10px',
            marginBottom: '8px',
            borderRadius: '4px',
            background: 'var(--status-amber-bg)',
            color: 'var(--status-amber)',
          }}
        >
          미검증 필드: {unverifiedFields.join(', ')}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {FIELDS.map((f) => (
          <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {f.label}
              {f.required && <span style={{ color: 'var(--danger)' }}> *</span>}
            </span>
            <textarea
              value={form[f.key] ?? ''}
              disabled={!canEdit || busy}
              rows={f.key === 'symptom' || f.key === 'root_cause' || f.key === 'resolution' ? 2 : 1}
              onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                padding: '6px 8px',
                fontSize: '13px',
                color: 'var(--text-primary)',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </label>
        ))}
      </div>

      {error && (
        <p style={{ color: 'var(--danger)', fontSize: '12px', marginTop: '8px' }}>{error}</p>
      )}

      {canEdit && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => void handleDraftSave()}
            disabled={busy}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 12px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            임시저장
          </button>
          <button
            onClick={() => void handleSubmit()}
            disabled={busy}
            style={{
              background: 'var(--brand)',
              border: '1px solid var(--brand)',
              borderRadius: '4px',
              padding: '4px 12px',
              fontSize: '12px',
              color: 'var(--bg-app)',
              fontWeight: 600,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            제출
          </button>
          <button
            onClick={() => void handleOpenHistory()}
            disabled={busy}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              padding: '4px 12px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
          >
            이전 이력
          </button>
          {voc.review_status === 'approved' && (
            <button
              onClick={() => void handleDeleteRequest()}
              disabled={busy}
              style={{
                background: 'transparent',
                border: '1px solid var(--danger)',
                borderRadius: '4px',
                padding: '4px 12px',
                fontSize: '12px',
                color: 'var(--danger)',
                cursor: busy ? 'not-allowed' : 'pointer',
              }}
            >
              삭제 신청
            </button>
          )}
        </div>
      )}

      {historyOpen && (
        <div
          onClick={() => setHistoryOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--overlay-bg)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              width: '560px',
              maxHeight: '70vh',
              overflow: 'auto',
              padding: '20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '14px', color: 'var(--text-primary)' }}>
                제출 이력
              </h4>
              <button
                onClick={() => setHistoryOpen(false)}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            {history.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>이력이 없습니다.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {history.map((item) => (
                  <li
                    key={item.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      padding: '10px 0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(item.submitted_at).toLocaleString()} —{' '}
                        {finalStateLabel[item.final_state ?? ''] ?? item.final_state ?? '—'}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                          marginTop: '4px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {readField(item.payload, 'symptom') || '(증상 없음)'}
                      </div>
                    </div>
                    <button
                      onClick={() => handleApplyHistory(item)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--border)',
                        borderRadius: '4px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        height: 'fit-content',
                      }}
                    >
                      불러오기
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
