import { OutlineChip } from '../../shared/ui/badge';

export interface VocTagPillProps {
  name: string;
}

export function VocTagPill({ name }: VocTagPillProps) {
  return (
    <span data-testid="voc-tag-pill" data-tag-name={name} aria-label={`태그 ${name}`}>
      <OutlineChip label={name} icon="#" />
    </span>
  );
}
