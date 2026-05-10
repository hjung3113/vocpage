/**
 * MSW handlers for /api/dashboard/* Phase C endpoints.
 * Deterministic seed data — zod-validated against locked contracts.
 */
import { http, HttpResponse } from 'msw';
import {
  DistributionResponse,
  PriorityStatusMatrixResponse,
  HeatmapResponse,
  WeeklyTrendResponse,
  ProcessingSpeedResponse,
  AssigneeStatsResponse,
  AgingVocsResponse,
} from '@contracts/dashboard';

// ── 1. Distribution ──────────────────────────────────────────────────────────
const DEMO_DISTRIBUTION = DistributionResponse.parse({
  type: 'status',
  dim: 'all',
  total: 42,
  items: [
    { label: '접수', key: '접수', count: 12, percentage: 28.6 },
    { label: '검토중', key: '검토중', count: 9, percentage: 21.4 },
    { label: '처리중', key: '처리중', count: 11, percentage: 26.2 },
    { label: '완료', key: '완료', count: 7, percentage: 16.7 },
    { label: '드랍', key: '드랍', count: 3, percentage: 7.1 },
  ],
});

// ── 2. Priority-Status Matrix ─────────────────────────────────────────────────
const DEMO_MATRIX = PriorityStatusMatrixResponse.parse({
  columns: ['접수', '검토중', '처리중', '완료', '드랍'],
  max_value: 8,
  rows: [
    { priority: 'urgent', cells: { 접수: 2, 검토중: 3, 처리중: 1, 완료: 0, 드랍: 0 }, row_total: 6 },
    { priority: 'high',   cells: { 접수: 4, 검토중: 2, 처리중: 8, 완료: 3, 드랍: 1 }, row_total: 18 },
    { priority: 'medium', cells: { 접수: 5, 검토중: 2, 처리중: 3, 완료: 2, 드랍: 1 }, row_total: 13 },
    { priority: 'low',    cells: { 접수: 1, 검토중: 2, 처리중: 1, 완료: 2, 드랍: 1 }, row_total: 7 },
  ],
});

// ── 3. Heatmap ────────────────────────────────────────────────────────────────
const DEMO_HEATMAP = HeatmapResponse.parse({
  headers: ['접수', '검토중', '처리중', '완료', '드랍'],
  totalRow: [22, 9, 13, 7, 5, 56],
  max_value: 14,
  rows: [
    { id: '11111111-0000-4000-8000-000000000001', name: '결제 시스템', level: 'system', values: [8, 4, 7, 3, 2], total: 24 },
    { id: '11111111-0000-4000-8000-000000000002', name: '회원 시스템', level: 'system', values: [9, 3, 4, 2, 2], total: 20 },
    { id: '11111111-0000-4000-8000-000000000003', name: '상품 시스템', level: 'system', values: [5, 2, 2, 2, 1], total: 12 },
  ],
});

// ── 4. Weekly Trend ───────────────────────────────────────────────────────────
const W_LABELS = ['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'];
const W_STARTS = [
  '2026-02-23','2026-03-02','2026-03-09','2026-03-16',
  '2026-03-23','2026-03-30','2026-04-06','2026-04-13',
  '2026-04-20','2026-04-27','2026-05-04','2026-05-11',
];
const DEMO_TREND = WeeklyTrendResponse.parse({
  weeks: W_LABELS,
  weekStarts: W_STARTS,
  series: {
    new:              [12, 9, 15, 11, 8, 13, 10, 14, 7, 11, 9, 13],
    enteredInProgress:[7,  5,  9,  8,  6,  7,  8,  9,  5,  8,  7,  9],
    done:             [5,  8,  7, 10,  6,  9,  7,  8,  6,  9,  8, 10],
  },
});

// ── 5. Processing Speed ───────────────────────────────────────────────────────
const DEMO_SPEED = ProcessingSpeedResponse.parse({
  dim: 'all',
  rows: [
    { id: null,                                      name: '전체',      avg_days: 4.2, sla_rate: 82.1, completed_count: 28, slaEligibleCount: 22, missingDueDateCount: 6 },
    { id: '11111111-0000-4000-8000-000000000001', name: '결제 시스템', avg_days: 3.5, sla_rate: 91.0, completed_count: 11, slaEligibleCount: 10, missingDueDateCount: 1 },
    { id: '11111111-0000-4000-8000-000000000002', name: '회원 시스템', avg_days: 5.1, sla_rate: 66.7, completed_count: 9,  slaEligibleCount: 6,  missingDueDateCount: 3 },
    { id: '11111111-0000-4000-8000-000000000003', name: '상품 시스템', avg_days: 4.8, sla_rate: null, completed_count: 8,  slaEligibleCount: 0,  missingDueDateCount: 8 },
  ],
});

// ── 6. Assignee Stats ─────────────────────────────────────────────────────────
const DEMO_ASSIGNEE = AssigneeStatsResponse.parse({
  headers: ['접수', '검토중', '처리중', '완료', '드랍'],
  max_value: 9,
  rows: [
    { id: 'aaaaaaaa-0000-4000-8000-000000000001', name: '김철수', is_unassigned: false, values: [3, 2, 4, 1, 0], total: 10 },
    { id: 'aaaaaaaa-0000-4000-8000-000000000002', name: '이영희', is_unassigned: false, values: [5, 3, 9, 2, 1], total: 20 },
    { id: 'aaaaaaaa-0000-4000-8000-000000000003', name: '박민준', is_unassigned: false, values: [2, 1, 3, 3, 1], total: 10 },
    { id: null, name: '미배정', is_unassigned: true, values: [2, 3, 1, 1, 1], total: 8 },
  ],
});

// ── 7. Aging VOCs ─────────────────────────────────────────────────────────────
const DEMO_AGING = AgingVocsResponse.parse({
  dim: 'all',
  items: [
    { voc_id: 'bbbbbbbb-0000-4000-8000-000000000001', issue_code: 'VOC-0421', title: '결제 오류 반복 발생', priority: 'urgent', elapsed_days: 42, system_name: '결제 시스템', menu_name: null },
    { voc_id: 'bbbbbbbb-0000-4000-8000-000000000002', issue_code: 'VOC-0398', title: '로그인 세션 만료 이슈', priority: 'high',   elapsed_days: 35, system_name: '회원 시스템', menu_name: null },
    { voc_id: 'bbbbbbbb-0000-4000-8000-000000000003', issue_code: 'VOC-0412', title: '상품 목록 로딩 지연', priority: 'medium', elapsed_days: 28, system_name: '상품 시스템', menu_name: null },
    { voc_id: 'bbbbbbbb-0000-4000-8000-000000000004', issue_code: 'VOC-0435', title: '환불 처리 미완료', priority: 'high',   elapsed_days: 18, system_name: '결제 시스템', menu_name: null },
    { voc_id: 'bbbbbbbb-0000-4000-8000-000000000005', issue_code: 'VOC-0441', title: '회원가입 이메일 미발송', priority: 'medium', elapsed_days: 9, system_name: '회원 시스템', menu_name: null },
  ],
});

// ─────────────────────────────────────────────────────────────────────────────

export const dashboardPhaseCHandlers = [
  http.get('/api/dashboard/distribution', () => HttpResponse.json(DEMO_DISTRIBUTION)),
  http.get('/api/dashboard/priority-status-matrix', () => HttpResponse.json(DEMO_MATRIX)),
  http.get('/api/dashboard/heatmap', () => HttpResponse.json(DEMO_HEATMAP)),
  http.get('/api/dashboard/weekly-trend', () => HttpResponse.json(DEMO_TREND)),
  http.get('/api/dashboard/processing-speed', () => HttpResponse.json(DEMO_SPEED)),
  http.get('/api/dashboard/assignee-stats', () => HttpResponse.json(DEMO_ASSIGNEE)),
  http.get('/api/dashboard/aging-vocs', () => HttpResponse.json(DEMO_AGING)),
];
