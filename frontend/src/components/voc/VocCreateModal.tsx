import { useState, useEffect, useRef } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';
import { createVoc } from '../../api/vocs';
import {
  listAdminSystems,
  listAdminMenus,
  listVocTypes,
  type SystemItem,
  type MenuItem,
  type VocType,
} from '../../api/admin';

interface VocCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function VocCreateModal({ isOpen, onClose, onCreated }: VocCreateModalProps) {
  const [title, setTitle] = useState('');
  const [systemId, setSystemId] = useState('');
  const [menuId, setMenuId] = useState('');
  const [vocTypeId, setVocTypeId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [systems, setSystems] = useState<SystemItem[]>([]);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [vocTypes, setVocTypes] = useState<VocType[]>([]);

  const editorRef = useRef<Editor>(null);

  useEffect(() => {
    if (!isOpen) return;
    listAdminSystems()
      .then(setSystems)
      .catch(() => {});
    listVocTypes()
      .then(setVocTypes)
      .catch(() => {});
  }, [isOpen]);

  useEffect(() => {
    if (!systemId) {
      setMenus([]);
      setMenuId('');
      return;
    }
    listAdminMenus(systemId)
      .then(setMenus)
      .catch(() => setMenus([]));
    setMenuId('');
  }, [systemId]);

  function resetForm() {
    setTitle('');
    setSystemId('');
    setMenuId('');
    setVocTypeId('');
    setError(null);
    editorRef.current?.getInstance().reset();
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

    const body = editorRef.current?.getInstance().getMarkdown() ?? '';

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

  const selectStyle = {
    background: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '13px',
    width: '100%',
  };

  return (
    <>
      <div
        onClick={handleClose}
        style={{ position: 'fixed', inset: 0, background: 'var(--overlay-bg)', zIndex: 60 }}
      />
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '640px',
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
        {/* Header */}
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
            style={{ color: 'var(--text-tertiary)', lineHeight: 1, fontSize: '18px' }}
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 px-6 py-5 overflow-y-auto"
          style={{ flex: 1 }}
        >
          {/* 제목 */}
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

          {/* 시스템 + 메뉴 */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                시스템 <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                value={systemId}
                onChange={(e) => setSystemId(e.target.value)}
                style={selectStyle}
              >
                <option value="">시스템 선택</option>
                {systems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                메뉴 <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <select
                value={menuId}
                onChange={(e) => setMenuId(e.target.value)}
                style={selectStyle}
                disabled={!systemId}
              >
                <option value="">메뉴 선택</option>
                {menus.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* VOC 유형 */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              유형 <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              value={vocTypeId}
              onChange={(e) => setVocTypeId(e.target.value)}
              style={selectStyle}
            >
              <option value="">유형 선택</option>
              {vocTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* 내용 — Toast UI Editor */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              내용
            </label>
            <div
              style={{ border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}
            >
              <Editor
                ref={editorRef}
                initialEditType="wysiwyg"
                previewStyle="tab"
                height="220px"
                placeholder="VOC 내용을 입력하세요 (Markdown 지원)"
                hideModeSwitch={false}
              />
            </div>
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
              style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
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
