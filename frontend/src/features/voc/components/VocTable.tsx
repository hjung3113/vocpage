import { VocListHeader } from '../../../components/voc/VocListHeader';
import { VocRow, type VocTypeMapEntry } from '../../../components/voc/VocRow';
import type { VocListResponse, VocSortColumn, SortDir } from '../../../../../shared/contracts/voc';

interface VocTableProps {
  rows: VocListResponse['rows'];
  sortBy: VocSortColumn;
  sortDir: SortDir;
  onSort: (key: VocSortColumn) => void;
  onRowClick: (id: string) => void;
  assigneeMap: Record<string, string>;
  vocTypeMap?: Record<string, VocTypeMapEntry>;
}

export function VocTable({
  rows,
  sortBy,
  sortDir,
  onSort,
  onRowClick,
  assigneeMap,
  vocTypeMap,
}: VocTableProps) {
  return (
    <div data-pcomp="voc-table" data-testid="voc-table" className="voc-table-wrapper">
      <div role="grid" aria-label="VOC 목록" className="voc-table-grid">
        <VocListHeader sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
        {rows.length > 0 &&
          rows.map((row) => (
            <VocRow
              key={row.id}
              row={row}
              assigneeMap={assigneeMap}
              vocTypeMap={vocTypeMap}
              onClick={() => onRowClick(row.id)}
            />
          ))}
      </div>
      {rows.length === 0 && (
        <div className="voc-table-empty" data-testid="voc-table-empty">
          데이터가 없습니다
        </div>
      )}
    </div>
  );
}

export default VocTable;
