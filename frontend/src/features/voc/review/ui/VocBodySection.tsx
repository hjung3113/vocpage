import { VocSection } from './VocSection';

interface Props {
  body: string | null | undefined;
}

export function VocBodySection({ body }: Props) {
  return (
    <VocSection testId="drawer-body">
      <span
        className="text-[11px] font-semibold tracking-[0.07em] uppercase"
        style={{ color: 'var(--text-secondary)' }}
      >
        본문
      </span>
      <div
        data-pcomp="voc-body-section"
        className="rounded px-3 py-3"
        style={{ background: 'var(--bg-surface)' }}
      >
        {body ? (
          <div
            className="prose prose-sm max-w-none text-sm"
            style={{ color: 'var(--text-primary)' }}
            dangerouslySetInnerHTML={{ __html: body }}
          />
        ) : (
          <span style={{ color: 'var(--text-tertiary)' }}>—</span>
        )}
      </div>
    </VocSection>
  );
}
