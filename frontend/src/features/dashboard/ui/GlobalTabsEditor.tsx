/**
 * GlobalTabsEditor.tsx — Wave 2 Phase E (admin scope only)
 *
 * Native HTML5 drag-and-drop reorder of `globaltabs_order` items + per-row
 * visibility toggle + add / remove. Visible only when the dialog is in
 * scope=admin mode.
 */
import { useRef, useState } from 'react';
import { GripVertical, X, Plus } from 'lucide-react';
import type { GlobalTabsOrderItem } from '@contracts/dashboard';

interface GlobalTabsEditorProps {
  value: GlobalTabsOrderItem[] | null;
  onChange: (next: GlobalTabsOrderItem[]) => void;
}

export function GlobalTabsEditor({ value, onChange }: GlobalTabsEditorProps) {
  const items = value ?? [];
  const [draftId, setDraftId] = useState('');
  const dragIndexRef = useRef<number | null>(null);

  const setItems = (next: GlobalTabsOrderItem[]) => onChange(next);

  const handleDragStart = (idx: number) => {
    dragIndexRef.current = idx;
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (idx: number) => {
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    if (from === null || from === idx) return;
    const next = items.slice();
    const moved = next[from];
    if (!moved) return;
    next.splice(from, 1);
    next.splice(idx, 0, moved);
    setItems(next);
  };

  const toggleVisible = (idx: number, visible: boolean) => {
    const cur = items[idx];
    if (!cur) return;
    const next = items.slice();
    next[idx] = { systemId: cur.systemId, visible };
    setItems(next);
  };

  const remove = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const add = () => {
    const id = draftId.trim();
    if (!id) return;
    if (items.some((it) => it.systemId === id)) return;
    setItems([...items, { systemId: id, visible: true }]);
    setDraftId('');
  };

  return (
    <fieldset className="mb-6">
      <legend className="mb-2 text-sm font-semibold text-[var(--text-primary)]">
        GlobalTabs 순서 / 표시 (Admin)
      </legend>
      <p className="mb-3 text-xs text-[var(--text-secondary)]">
        드래그로 순서 변경, 체크박스로 표시 토글, × 로 제거. 시스템 ID 를 입력해 추가하세요.
      </p>

      {items.length === 0 ? (
        <div className="mb-3 rounded border border-dashed border-[var(--border)] px-3 py-4 text-center text-xs text-[var(--text-secondary)]">
          저장된 GlobalTabs 순서가 없습니다. 아래에서 시스템 ID를 추가하세요.
        </div>
      ) : (
        <ul className="mb-3 space-y-1" data-testid="globaltabs-list">
          {items.map((it, idx) => (
            <li
              key={it.systemId}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(idx)}
              data-testid={`globaltabs-row-${it.systemId}`}
              className="flex cursor-move items-center gap-2 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1.5"
            >
              <GripVertical className="h-4 w-4 text-[var(--text-secondary)]" aria-hidden />
              <span className="flex-1 text-sm text-[var(--text-primary)]">{it.systemId}</span>
              <label className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                <input
                  type="checkbox"
                  role="switch"
                  aria-label={`${it.systemId} 표시`}
                  checked={it.visible}
                  onChange={(e) => toggleVisible(idx, e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer accent-[var(--brand)]"
                />
                표시
              </label>
              <button
                type="button"
                onClick={() => remove(idx)}
                aria-label={`${it.systemId} 제거`}
                className="rounded p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-app)] hover:text-[var(--text-primary)]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={draftId}
          onChange={(e) => setDraftId(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="새 systemId"
          aria-label="새 systemId"
          className="flex-1 rounded border border-[var(--border)] bg-[var(--bg-surface)] px-2 py-1 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:border-[var(--brand)] focus:outline-none"
        />
        <button
          type="button"
          onClick={add}
          aria-label="systemId 추가"
          className="inline-flex items-center gap-1 rounded border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-app)]"
        >
          <Plus className="h-3.5 w-3.5" />
          추가
        </button>
      </div>
    </fieldset>
  );
}
