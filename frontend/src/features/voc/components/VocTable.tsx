import { DataTable } from '../../../components/common/DataTable';
import type { DataTableColumn } from '../../../components/common/DataTable';
import { VocStatusBadge } from '../../../components/voc/VocStatusBadge';
import type { VocListResponse, VocSortColumn, SortDir } from '../../../../../shared/contracts/voc';

type Row = VocListResponse['rows'][number];

const PRIORITY_LABEL: Record<string, string> = {
  urgent: '긴급',
  high: '높음',
  medium: '보통',
  low: '낮음',
};

interface VocTableProps {
  rows: VocListResponse['rows'];
  sortBy: VocSortColumn;
  sortDir: SortDir;
  onSort: (key: VocSortColumn) => void;
  onRowClick: (id: string) => void;
  assigneeMap: Record<string, string>;
}

export function VocTable({
  rows,
  sortBy,
  sortDir,
  onSort,
  onRowClick,
  assigneeMap,
}: VocTableProps) {
  const columns: DataTableColumn<Row>[] = [
    {
      key: 'issue_code',
      header: '이슈 ID',
      sortable: true,
      cellClassName: 'font-mono text-xs',
      render: (row) => row.issue_code,
    },
    {
      key: 'title',
      header: '제목',
      sortable: false,
      render: (row) => row.title,
    },
    {
      key: 'status',
      header: '상태',
      sortable: true,
      render: (row) => <VocStatusBadge status={row.status} />,
    },
    {
      key: 'assignee_id',
      header: '담당자',
      sortable: false,
      render: (row) => (row.assignee_id ? (assigneeMap[row.assignee_id] ?? row.assignee_id) : '—'),
    },
    {
      key: 'priority',
      header: '우선순위',
      sortable: true,
      render: (row) => PRIORITY_LABEL[row.priority] ?? row.priority,
    },
    {
      key: 'created_at',
      header: '등록일',
      sortable: true,
      render: (row) => row.created_at.slice(0, 10),
    },
  ];

  return (
    <div data-testid="voc-table">
      <DataTable<Row>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        sortKey={sortBy}
        sortDir={sortDir}
        onSort={(key) => onSort(key as VocSortColumn)}
        onRowClick={(row) => onRowClick(row.id)}
        emptyState={
          <div className="py-12 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            데이터가 없습니다
          </div>
        }
      />
    </div>
  );
}

export default VocTable;
