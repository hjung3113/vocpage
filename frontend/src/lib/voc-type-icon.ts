import { Bug, Sparkles, Wrench, MessageCircleQuestion, Tag, type LucideIcon } from 'lucide-react';

export interface VocTypeIconConfig {
  Icon: LucideIcon;
  color: string;
  weight: 400 | 500 | 600 | 700;
  isUnknown?: true;
}

const KNOWN: Record<string, VocTypeIconConfig> = {
  bug: { Icon: Bug, color: 'var(--status-red)', weight: 600 },
  'feature-request': { Icon: Sparkles, color: 'var(--accent)', weight: 500 },
  improvement: { Icon: Wrench, color: 'var(--status-green)', weight: 500 },
  inquiry: { Icon: MessageCircleQuestion, color: 'var(--text-tertiary)', weight: 400 },
};

const FALLBACK: VocTypeIconConfig = {
  Icon: Tag,
  color: 'var(--text-tertiary)',
  weight: 400,
  isUnknown: true,
};

export function getVocTypeIconConfig(slug: string): VocTypeIconConfig {
  return KNOWN[slug] ?? FALLBACK;
}
