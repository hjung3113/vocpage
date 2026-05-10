/**
 * EditModeToggle.tsx — Wave 2 Phase D
 * Edit mode on/off toggle using shadcn/ui Toggle (Radix).
 */
import { Toggle } from '@shared/ui/toggle';
import { Pencil } from 'lucide-react';

interface EditModeToggleProps {
  isEditing: boolean;
  isDirty: boolean;
  isSaving?: boolean;
  onToggle: (value: boolean) => void;
  onSave: () => void;
  onDiscard: () => void;
}

export function EditModeToggle({
  isEditing,
  isDirty,
  isSaving = false,
  onToggle,
  onSave,
  onDiscard,
}: EditModeToggleProps) {
  return (
    <div className="flex items-center gap-2">
      {isEditing && isDirty && (
        <>
          <button
            type="button"
            onClick={onDiscard}
            className="rounded px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="rounded bg-[var(--brand)] px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-[var(--accent)] disabled:opacity-50 transition-colors"
          >
            {isSaving ? '저장 중…' : '저장'}
          </button>
        </>
      )}
      <Toggle
        pressed={isEditing}
        onPressedChange={onToggle}
        aria-label="편집 모드 전환"
        size="sm"
      >
        <Pencil className="h-4 w-4" />
        <span className="ml-1.5 text-sm">{isEditing ? '편집 중' : '편집 모드'}</span>
      </Toggle>
    </div>
  );
}
