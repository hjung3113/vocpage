import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DataTable } from '../DataTable';

interface Row {
  id: string;
  name: string;
  age: number;
}

const columns = [
  { key: 'name', header: '이름', sortable: true },
  { key: 'age', header: '나이', sortable: true },
];

const rows: Row[] = [
  { id: '1', name: '홍길동', age: 30 },
  { id: '2', name: '김철수', age: 25 },
];

describe('DataTable', () => {
  it('renders columnheaders matching columns length', () => {
    render(<DataTable<Row> columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(screen.getAllByRole('columnheader')).toHaveLength(columns.length);
  });

  it('calls onSort when sortable header clicked', async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    render(<DataTable<Row> columns={columns} rows={rows} rowKey={(r) => r.id} onSort={onSort} />);
    await user.click(screen.getByRole('columnheader', { name: /이름/ }));
    expect(onSort).toHaveBeenCalledWith('name');
  });

  it('sets aria-sort on active sortKey', () => {
    render(
      <DataTable<Row>
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        sortKey="name"
        sortDir="asc"
      />,
    );
    expect(screen.getByRole('columnheader', { name: /이름/ })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
  });

  it('renders rows.length + 1 (header) row count', () => {
    render(<DataTable<Row> columns={columns} rows={rows} rowKey={(r) => r.id} />);
    expect(screen.getAllByRole('row')).toHaveLength(rows.length + 1);
  });

  it('calls onRowClick when row clicked', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(
      <DataTable<Row> columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={onRowClick} />,
    );
    await user.click(screen.getByText('홍길동'));
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it('renders emptyState when rows is empty', () => {
    render(
      <DataTable<Row>
        columns={columns}
        rows={[]}
        rowKey={(r) => r.id}
        emptyState={<div>데이터 없음</div>}
      />,
    );
    expect(screen.getByText('데이터 없음')).toBeInTheDocument();
  });
});
