import { TextMark } from '../../shared/ui/badge';
import { getVocTypeIconConfig } from '../../lib/voc-type-icon';

export interface VocTypeBadgeProps {
  slug: string;
  name: string;
  color?: string;
}

export function VocTypeBadge({ slug, name }: VocTypeBadgeProps) {
  const { Icon, color, weight, isUnknown } = getVocTypeIconConfig(slug);
  const variant = isUnknown ? 'unknown' : slug;

  return (
    <TextMark
      variant={variant}
      iconMode="icon-only"
      icon={Icon}
      label={name}
      color={color}
      weight={weight}
      extraTestId={`voc-type-badge-${slug}`}
      ariaLabelOverride={`유형 ${name}`}
    />
  );
}
