import { VocSection } from './VocSection';
import { SafeHtml } from '@shared/ui/safe-html/SafeHtml';

interface Props {
  body: string | null | undefined;
}

export function VocBodySection({ body }: Props) {
  return (
    <VocSection title="본문" testId="drawer-body">
      <div
        data-testid="voc-body-section"
        className="rounded px-3 py-3"
        style={{ background: 'var(--bg-surface)' }}
      >
        {body ? (
          <SafeHtml
            html={body}
            className="prose prose-sm max-w-none text-sm"
          />
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>—</span>
        )}
      </div>
    </VocSection>
  );
}
