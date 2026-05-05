import { Maximize2, Minimize2, Link2, Trash2, X } from 'lucide-react';
import { Button } from '@shared/ui/button';

const LABEL_FULLSCREEN_OPEN = '큰 화면으로 보기';
const LABEL_FULLSCREEN_CLOSE = '이전 크기로';
const LABEL_COPY_LINK = '링크 복사';
const LABEL_DELETE = '삭제';
const LABEL_CLOSE = '닫기';

export interface DrawerActionButtonsProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onCopyLink: () => void;
  onDelete?: () => void;
  onClose: () => void;
}

function IconBtn({
  label,
  onClick,
  children,
  'data-testid': testId,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  'data-testid'?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7"
      style={{ color: 'var(--text-secondary)' }}
      onClick={onClick}
      aria-label={label}
      title={label}
      data-testid={testId}
    >
      {children}
    </Button>
  );
}

export function DrawerActionButtons({
  isFullscreen,
  onToggleFullscreen,
  onCopyLink,
  onDelete,
  onClose,
}: DrawerActionButtonsProps) {
  return (
    <div className="flex items-center gap-0.5" data-testid="drawer-action-buttons">
      <IconBtn
        label={isFullscreen ? LABEL_FULLSCREEN_CLOSE : LABEL_FULLSCREEN_OPEN}
        onClick={onToggleFullscreen}
        data-testid="drawer-btn-fullscreen"
      >
        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </IconBtn>

      <IconBtn label={LABEL_COPY_LINK} onClick={onCopyLink} data-testid="drawer-btn-copy-link">
        <Link2 className="h-4 w-4" />
      </IconBtn>

      {onDelete !== undefined && (
        <IconBtn label={LABEL_DELETE} onClick={onDelete} data-testid="drawer-btn-delete">
          <Trash2 className="h-4 w-4" />
        </IconBtn>
      )}

      <IconBtn label={LABEL_CLOSE} onClick={onClose} data-testid="drawer-btn-close">
        <X className="h-4 w-4" />
      </IconBtn>
    </div>
  );
}

export default DrawerActionButtons;
