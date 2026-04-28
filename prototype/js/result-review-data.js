// Stage B-1 P-1.C1 — Result Review mock data
// Extracted from result-review.js to keep that file within the 310-line cap.
// result-review.js consumes this via: const reviewQueue = window.reviewQueue || [];
// NOTE: classic <script> shares global scope, so this file must NOT declare a
// top-level `reviewQueue` symbol — it would collide with result-review.js's
// consumer const. Use an IIFE to scope locally and only export via window.

(function (global) {
  'use strict';
  const data = [
    {
      id: 'VOC-1234',
      title: 'PM 설비 알람 누락 (압연 라인)',
      action: 'submission',
      statusLabel: '처리 중',
      reviewStatusLabel: '검토 대기',
      assignee: '김철수',
      author: '이영희',
      submittedAt: '2026-04-25',
      system: 'MES',
      menuPath: ['설비관리', '알람', '알람 이력'],
      sp: 'sp_alarm_history_summary',
      relatedTables: ['alarm_log', 'equipment', 'pm_schedule'],
      currentPayload: {
        설비: '압연-A',
        증상: '알람 미발생',
        원인: '미상',
        조치: '점검 예정',
      },
      newPayload: {
        설비: '압연-A',
        증상: '알람이 1시간 주기로 누락됨',
        원인: '센서 단선 (DI-12 채널)',
        조치: '센서 교체 및 PM 절차에 점검 항목 추가',
      },
      attachments: [
        { name: '알람누락_스크린샷.png', size: '284 KB' },
        { name: '센서점검_보고서.pdf', size: '1.2 MB' },
      ],
      history: [
        {
          ts: '2026-04-24 09:00',
          actor: '이영희',
          action: '최초 제출',
          finalState: 'approved',
          isCurrent: true,
        },
        {
          ts: '2026-04-23 17:30',
          actor: '시스템',
          action: '페이로드 저장',
          finalState: 'rejected',
          isCurrent: false,
        },
      ],
      payload: {
        설비: '압연-A',
        증상: '알람이 1시간 주기로 누락됨',
        원인: '센서 단선 (DI-12 채널)',
        조치: '센서 교체 및 PM 절차에 점검 항목 추가',
      },
    },
    {
      id: 'VOC-1235',
      title: 'MES 로그인 지연 (30초+)',
      action: 'submission',
      statusLabel: '처리 중',
      reviewStatusLabel: '검토 대기',
      assignee: '박민수',
      author: '최수진',
      submittedAt: '2026-04-26',
      system: 'MES',
      menuPath: ['시스템관리', '사용자', '로그인 이력'],
      sp: 'sp_login_audit',
      relatedTables: ['user_session', 'ldap_pool', 'auth_log'],
      currentPayload: {
        시스템: 'MES',
        증상: '로그인 지연',
        원인: '미확인',
        조치: '모니터링 중',
      },
      newPayload: {
        시스템: 'MES',
        증상: '로그인 시 30초 이상 대기',
        원인: 'LDAP 풀 고갈',
        조치: 'LDAP 커넥션 풀 사이즈 20→60 증설',
      },
      attachments: [{ name: 'ldap_pool_metrics.log', size: '48 KB' }],
      history: [
        {
          ts: '2026-04-25 14:10',
          actor: '최수진',
          action: '재제출',
          finalState: 'approved',
          isCurrent: true,
        },
        {
          ts: '2026-04-25 11:00',
          actor: '박민수',
          action: '반려 후 수정',
          finalState: 'rejected',
          isCurrent: false,
        },
      ],
      payload: {
        시스템: 'MES',
        증상: '로그인 시 30초 이상 대기',
        원인: 'LDAP 풀 고갈',
        조치: 'LDAP 커넥션 풀 사이즈 20→60 증설',
      },
    },
    {
      id: 'VOC-1236',
      title: 'QC 리포트 출력 오류 — 중복 등록',
      action: 'deletion',
      statusLabel: '완료',
      reviewStatusLabel: '삭제 신청',
      assignee: '이지원',
      author: '김미래',
      submittedAt: '2026-04-27',
      system: 'QMS',
      menuPath: ['품질관리', '리포트', '출력 이력'],
      sp: null,
      relatedTables: ['qc_report', 'report_template'],
      currentPayload: {
        사유: 'VOC-0998과 동일 건',
      },
      newPayload: null, // E: deletion has no newPayload
      deletionReason: 'VOC-0998과 동일 건 — 담당자 합의 후 삭제 요청',
      attachments: [],
      history: [
        {
          ts: '2026-04-27 10:00',
          actor: '김미래',
          action: '삭제 신청',
          finalState: 'approved',
          isCurrent: true,
        },
      ],
      payload: {
        사유: 'VOC-0998과 동일 건 — 담당자 합의 후 삭제 요청',
      },
    },
    // VOC-1237: no-diff branch (currentPayload === newPayload)
    {
      id: 'VOC-1237',
      title: '설비 점검 이력 조회 — 변경 없음 제출',
      action: 'submission',
      statusLabel: '처리 중',
      reviewStatusLabel: '검토 대기',
      assignee: '정현우',
      author: '강민지',
      submittedAt: '2026-04-28',
      system: 'MES',
      menuPath: ['설비관리', '점검', '이력 조회'],
      sp: 'sp_inspect_history',
      relatedTables: ['inspect_log', 'equipment'],
      currentPayload: { 설비: '압연-B', 증상: '진동 이상', 조치: '베어링 교체' },
      newPayload: { 설비: '압연-B', 증상: '진동 이상', 조치: '베어링 교체' },
      attachments: [],
      history: [
        {
          ts: '2026-04-28 08:00',
          actor: '강민지',
          action: '재제출',
          finalState: 'approved',
          isCurrent: true,
        },
      ],
      payload: { 설비: '압연-B', 증상: '진동 이상', 조치: '베어링 교체' },
    },
    // VOC-1238: added key branch (newPayload has extra `priority`)
    {
      id: 'VOC-1238',
      title: '생산 계획 우선순위 필드 추가',
      action: 'submission',
      statusLabel: '처리 중',
      reviewStatusLabel: '검토 대기',
      assignee: '한승호',
      author: '오지연',
      submittedAt: '2026-04-28',
      system: 'MES',
      menuPath: ['생산관리', '계획', '일정'],
      sp: 'sp_production_plan',
      relatedTables: ['production_plan', 'work_order'],
      currentPayload: { 라인: '압연-A', 목표수량: '500' },
      newPayload: { 라인: '압연-A', 목표수량: '500', priority: 'High' },
      attachments: [{ name: '우선순위_정책.pdf', size: '320 KB' }],
      history: [
        {
          ts: '2026-04-28 09:30',
          actor: '오지연',
          action: '최초 제출',
          finalState: 'approved',
          isCurrent: true,
        },
      ],
      payload: { 라인: '압연-A', 목표수량: '500', priority: 'High' },
    },
    // VOC-1239: removed key branch (currentPayload has `attachmentNote`, new omits it)
    {
      id: 'VOC-1239',
      title: '품질 검사 첨부 메모 필드 제거',
      action: 'submission',
      statusLabel: '처리 중',
      reviewStatusLabel: '검토 대기',
      assignee: '임도윤',
      author: '박서준',
      submittedAt: '2026-04-28',
      system: 'QMS',
      menuPath: ['품질관리', '검사', '결과 입력'],
      sp: null,
      relatedTables: ['qc_result'],
      currentPayload: { 항목: '치수 검사', 결과: '합격', attachmentNote: '첨부 참조' },
      newPayload: { 항목: '치수 검사', 결과: '합격' },
      attachments: [],
      history: [
        {
          ts: '2026-04-28 10:15',
          actor: '박서준',
          action: '최초 제출',
          finalState: 'approved',
          isCurrent: true,
        },
      ],
      payload: { 항목: '치수 검사', 결과: '합격' },
    },
  ];

  global.reviewQueue = data;
})(window);
