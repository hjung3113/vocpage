export interface VocSectionProps {
  title: string;
  testId: string;
  children: React.ReactNode;
}

export function VocSection({ title, testId, children }: VocSectionProps) {
  return (
    <section data-testid={testId} className="flex flex-col gap-2">
      <h3 className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
        {title}
      </h3>
      {children}
    </section>
  );
}
