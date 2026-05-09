/**
 * WidgetPlaceholder.tsx — Wave 2 Phase D
 * Slot-only widget placeholder. Widget content is out of scope.
 */
import type { WidgetId } from '../defaultLayouts';

interface WidgetPlaceholderProps {
  widgetId: WidgetId | string;
  isEditing?: boolean;
}

export function WidgetPlaceholder({ widgetId, isEditing = false }: WidgetPlaceholderProps) {
  return (
    <div
      data-testid={`widget-placeholder-${widgetId}`}
      className="relative flex h-full w-full flex-col rounded-lg border border-[var(--border-standard)] bg-[var(--bg-panel)]"
    >
      {/* Drag handle — visible only in edit mode */}
      <div
        className={[
          'dashboard-widget-handle',
          'absolute right-2 top-2 z-10',
          'flex cursor-grab items-center justify-center',
          'rounded',
          'transition-opacity duration-150',
          isEditing ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        style={{
          width: 'var(--dashboard-handle-size)',
          height: 'var(--dashboard-handle-size)',
        }}
        aria-hidden="true"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="currentColor"
          className="text-[var(--text-tertiary)]"
        >
          <circle cx="2" cy="2" r="1" />
          <circle cx="5" cy="2" r="1" />
          <circle cx="8" cy="2" r="1" />
          <circle cx="2" cy="5" r="1" />
          <circle cx="5" cy="5" r="1" />
          <circle cx="8" cy="5" r="1" />
          <circle cx="2" cy="8" r="1" />
          <circle cx="5" cy="8" r="1" />
          <circle cx="8" cy="8" r="1" />
        </svg>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <span className="text-sm text-[var(--text-quaternary)]">{widgetId}</span>
      </div>
    </div>
  );
}
