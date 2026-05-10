import type { VocStatus } from '@contracts/voc';
import { VOC_STATUS_SLUG } from '../model/vocStatus';
import { SolidChip } from '@shared/ui/badge';
import { StatusGlyph, type StatusGlyphVariant } from '@shared/ui/status-glyph';

type StatusSlug = 'received' | 'reviewing' | 'processing' | 'done' | 'drop';

const SLUG_TO_GLYPH: Record<StatusSlug, StatusGlyphVariant> = {
  received: 'todo',
  reviewing: 'review',
  processing: 'progress',
  done: 'done',
  drop: 'canceled',
};

export function VocStatusBadge({
  status,
  iconOnly = false,
}: {
  status: VocStatus;
  iconOnly?: boolean;
}) {
  const slug = VOC_STATUS_SLUG[status];
  const glyph = SLUG_TO_GLYPH[slug];

  if (iconOnly) {
    return (
      <span
        data-testid={`status-badge-${status}`}
        aria-label={`상태 ${status}`}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        <StatusGlyph variant={glyph} />
      </span>
    );
  }

  return (
    <span
      data-testid={`status-badge-${status}`}
      aria-label={`상태 ${status}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
    >
      <StatusGlyph variant={glyph} />
      <SolidChip
        variant={slug}
        label={status}
        extraTestId={`status-badge-chip-${status}`}
      />
    </span>
  );
}
