function opts(...pairs: [string, string][]): { id: string; label: string }[] {
  return pairs.map(([id, label]) => ({ id, label }));
}

export const STATUS_OPTIONS = opts(
  ['접수', '접수'],
  ['검토중', '검토중'],
  ['처리중', '처리중'],
  ['완료', '완료'],
  ['드랍', '드랍'],
);
export const PRIORITY_OPTIONS = opts(
  ['urgent', '긴급'],
  ['high', '높음'],
  ['medium', '보통'],
  ['low', '낮음'],
);
export const REVIEW_STATUS_OPTIONS = opts(
  ['unverified', '미검토'],
  ['approved', '승인'],
  ['rejected', '거부'],
  ['pending_deletion', '삭제 대기'],
);
export const RESOLUTION_QUALITY_OPTIONS = opts(['근본해결', '근본해결'], ['임시조치', '임시조치']);
export const DROP_REASON_OPTIONS = opts(
  ['중복', '중복'],
  ['정책거부', '정책거부'],
  ['재현불가', '재현불가'],
  ['범위외', '범위외'],
  ['기타', '기타'],
);
