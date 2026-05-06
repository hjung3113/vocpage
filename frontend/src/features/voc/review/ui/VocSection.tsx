export interface VocSectionProps {
  title: string;
  testId: string;
  children: React.ReactNode;
}

export function VocSection({ testId, children }: VocSectionProps) {
  return (
    <section data-testid={testId} className="flex flex-col gap-2 @container">
      {children}
    </section>
  );
}
