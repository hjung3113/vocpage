interface Props {
  body: string | null | undefined;
}

export function VocBodySection({ body }: Props) {
  return (
    <div
      data-pcomp="voc-body-section"
      className="rounded-md px-3 py-3 text-sm"
      style={{ background: 'var(--bg-surface)' }}
    >
      {body ? (
        <div
          className="prose prose-sm max-w-none"
          style={{ color: 'var(--text-primary)' }}
          dangerouslySetInnerHTML={{ __html: body }}
        />
      ) : (
        <span style={{ color: 'var(--text-tertiary)' }}>—</span>
      )}
    </div>
  );
}
