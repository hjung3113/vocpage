import { AlertCircle } from 'lucide-react';
import { Button } from '@shared/ui/button';
import { StatusLayout } from '@shared/ui/status-layout';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  message = '오류가 발생했습니다.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <StatusLayout role="alert" className={className}>
      <AlertCircle
        size={36}
        className="text-[color:var(--status-red,var(--danger,red))]"
        aria-hidden
      />
      <p className="text-sm text-[color:var(--text-primary)]">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      )}
    </StatusLayout>
  );
}
