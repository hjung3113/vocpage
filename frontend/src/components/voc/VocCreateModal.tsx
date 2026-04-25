import { useState } from 'react';
import { createVoc } from '../../api/vocs';

interface VocCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

// Dummy data — will be replaced with real API in Phase 7-6
const DUMMY_SYSTEMS = [
  { id: 'sys-001', name: '고객지원 시스템' },
  { id: 'sys-002', name: '주문 관리 시스템' },
  { id: 'sys-003', name: '재고 관리 시스템' },
];

const DUMMY_MENUS: Record<string, Array<{ id: string; name: string }>> = {
  'sys-001': [
    { id: 'menu-001', name: '문의 접수' },
    { id: 'menu-002', name: '반품/교환' },
  ],
  'sys-002': [
    { id: 'menu-003', name: '주문 조회' },
    { id: 'menu-004', name: '주문 취소' },
  ],
  'sys-003': [
    { id: 'menu-005', name: '재고 조회' },
    { id: 'menu-006', name: '입출고 관리' },
  ],
};

const DUMMY_TYPES = [
  { id: 'type-001', name: '버그 신고' },
  { id: 'type-002', name: '기능 개선' },
  { id: 'type-003', name: '사용 문의' },
];

export function VocCreateModal({ isOpen, onClose, onCreated }: VocCreateModalProps) {
  const [title, setTitle] = useState('');
  const [systemId, setSystemId] = useState('');
  const [menuId, setMenuId] = useState('');
  const [vocTypeId, setVocTypeId] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const menus = systemId ? (DUMMY_MENUS[systemId] ?? []) : [];

  function handleSystemChange(value: string) {
    setSystemId(value);
    setMenuId('');
  }

  function resetForm() {
    setTitle('');
    setSystemId('');
    setMenuId('');
    setVocTypeId('');
    setBody('');
    setError(null);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }
    if (!systemId) {
      setError('시스템을 선택해주세요.');
      return;
    }
    if (!menuId) {
      setError('메뉴를 선택해주세요.');
      return;
    }
    if (!vocTypeId) {
      setError('유형을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await createVoc({
        title: title.trim(),
        body,
        system_id: systemId,
        menu_id: menuId,
        voc_type_id: vocTypeId,
      });
      resetForm();
      onCreated();
      onClose();
    } catch {
      setError('VOC 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--overlay-bg)',
          zIndex: 60,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '560px',
          maxWidth: 'calc(100vw - 32px)',
          maxHeight: 'calc(100vh - 64px)',
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          zIndex: 70,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="voc-create-title"
      >
        {/* Modal header */}
        <div
          className="flex items-center justify-between px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2
            id="voc-create-title"
            className="text-base font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            새 VOC 등록
          </h2>
          <button
            onClick={handleClose}
            className="px-2 py-1 rounded text-sm"
            style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 px-6 py-4 overflow-auto flex-1"
        >
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              제목 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VOC 제목을 입력하세요"
              className="px-3 py-2 rounded text-sm"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            />
          </div>

          {/* System */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              시스템 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              value={systemId}
              onChange={(e) => handleSystemChange(e.target.value)}
              className="px-3 py-2 rounded text-sm"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              <option value="">시스템 선택</option>
              {DUMMY_SYSTEMS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Menu */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              메뉴 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              value={menuId}
              onChange={(e) => setMenuId(e.target.value)}
              disabled={!systemId}
              className="px-3 py-2 rounded text-sm"
              style={{
                background: 'var(--bg-surface)',
                color: systemId ? 'var(--text-primary)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              <option value="">{systemId ? '메뉴 선택' : '시스템을 먼저 선택하세요'}</option>
              {menus.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* VOC Type */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              유형 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              value={vocTypeId}
              onChange={(e) => setVocTypeId(e.target.value)}
              className="px-3 py-2 rounded text-sm"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
              }}
            >
              <option value="">유형 선택</option>
              {DUMMY_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              내용
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="VOC 내용을 입력하세요"
              rows={5}
              className="px-3 py-2 rounded text-sm resize-y"
              style={{
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <p className="text-sm" role="alert" style={{ color: 'var(--danger)' }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 rounded text-sm"
              style={{
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{
                background: isSubmitting ? 'var(--text-muted)' : 'var(--brand)',
                color: 'var(--text-on-brand)',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
