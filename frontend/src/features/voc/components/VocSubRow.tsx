import React from 'react';
import type { VocStatus } from '../../../../../shared/contracts/voc';
import { VocStatusBadge } from '../../../components/voc/VocStatusBadge';

export interface VocSubRowProps {
  status: VocStatus;
  title: string;
  onClick?: () => void;
  trailing?: React.ReactNode;
}

export function VocSubRow({ status, title, onClick, trailing }: VocSubRowProps) {
  return (
    <button
      type="button"
      data-testid="voc-sub-row"
      data-pcomp="voc-sub-row"
      onClick={onClick}
      aria-label={`서브태스크 ${title} 열기`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 0',
        border: 'none',
        borderBottom: '1px solid var(--border-subtle)',
        fontSize: '12.5px',
        color: 'var(--text-secondary)',
        cursor: 'pointer',
        width: '100%',
        background: 'none',
        textAlign: 'left',
      }}
    >
      <VocStatusBadge status={status} />
      <span
        data-testid="voc-sub-row-title"
        style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {title}
      </span>
      {trailing}
    </button>
  );
}
