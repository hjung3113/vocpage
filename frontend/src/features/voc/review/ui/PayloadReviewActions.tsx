import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { vocApi } from '@entities/voc/api/vocApi';
import type { PayloadReviewSubmit } from '@contracts/voc';

interface PayloadReviewActionsProps {
  vocId: string;
  onReviewed?: () => void;
}

/**
 * feature-voc.md §9.4.5 — manager/admin Result Review controls.
 * Approve = single click; Reject = inline comment input + submit.
 */
export function PayloadReviewActions({ vocId, onReviewed }: PayloadReviewActionsProps) {
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const reviewMutation = useMutation({
    mutationFn: (payload: PayloadReviewSubmit) => vocApi.submitPayloadReview(vocId, payload),
    onSuccess: () => {
      setRejectMode(false);
      setRejectComment('');
      onReviewed?.();
    },
  });

  if (!rejectMode) {
    return (
      <div data-testid="payload-review-actions" className="ml-auto flex items-center gap-2">
        <button
          type="button"
          data-testid="payload-review-approve"
          disabled={reviewMutation.isPending}
          onClick={() => reviewMutation.mutate({ decision: 'approve' })}
          className="inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
          style={{ background: 'var(--brand)', color: 'var(--text-on-brand)' }}
        >
          승인
        </button>
        <button
          type="button"
          data-testid="payload-review-reject-open"
          disabled={reviewMutation.isPending}
          onClick={() => setRejectMode(true)}
          className="inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
          style={{ border: '1px solid var(--border-standard)', color: 'var(--text-secondary)' }}
        >
          반려
        </button>
      </div>
    );
  }

  return (
    <div data-testid="payload-review-actions" className="ml-auto flex items-center gap-2">
      <input
        type="text"
        data-testid="payload-review-reject-comment"
        value={rejectComment}
        onChange={(e) => setRejectComment(e.target.value)}
        placeholder="반려 사유"
        className="rounded px-2 py-1 text-xs"
        style={{
          border: '1px solid var(--border-standard)',
          background: 'var(--bg-app)',
          color: 'var(--text-primary)',
        }}
      />
      <button
        type="button"
        data-testid="payload-review-reject-submit"
        disabled={reviewMutation.isPending || rejectComment.trim().length === 0}
        onClick={() => reviewMutation.mutate({ decision: 'reject', comment: rejectComment.trim() })}
        className="inline-flex items-center rounded px-2.5 py-1 text-xs font-semibold disabled:opacity-50"
        style={{ background: 'var(--danger)', color: 'var(--text-on-brand)' }}
      >
        반려 제출
      </button>
      <button
        type="button"
        onClick={() => {
          setRejectMode(false);
          setRejectComment('');
        }}
        className="text-xs"
        style={{ color: 'var(--text-secondary)' }}
      >
        취소
      </button>
    </div>
  );
}
