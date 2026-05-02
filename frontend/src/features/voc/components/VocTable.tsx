import { VocListHeader } from '../../../components/voc/VocListHeader';
import { VocRow } from '../../../components/voc/VocRow';
import type { VocListResponse, VocSortColumn, SortDir } from '../../../../../shared/contracts/voc';

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
  return (
    <div
      data-pcomp="voc-table"
      data-testid="voc-table"
      role="grid"
      aria-label="VOC 목록"
      className="voc-table-grid"
    >
      <VocListHeader sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
      {rows.length === 0 ? (
        <div
          className="voc-table-empty"
          style={{
            padding: '48px 0',
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--text-secondary)',
          }}
        >
          데이터가 없습니다
        </div>
      ) : (
        rows.map((row) => (
          <VocRow
            key={row.id}
            row={row}
            assigneeMap={assigneeMap}
            onClick={() => onRowClick(row.id)}
          />
        ))
      )}
    </div>
  );
}

export default VocTable;
