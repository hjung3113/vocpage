import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const REASONS: Record<string, { title: string; description: string }> = {
  role: { title: '권한이 없습니다', description: '담당자 또는 관리자만 접근할 수 있습니다.' },
  ownership: { title: '담당자 전용', description: '본인이 담당한 VOC만 수정할 수 있습니다.' },
  deleted: { title: '삭제된 항목', description: '이 VOC는 삭제되었습니다.' },
};

export function VocPermissionGate({ reason }: { reason: 'role' | 'ownership' | 'deleted' }) {
  const r = REASONS[reason]!;
  return (
    <Alert data-testid="voc-permission-gate">
      <AlertTitle>{r.title}</AlertTitle>
      <AlertDescription>{r.description}</AlertDescription>
    </Alert>
  );
}
