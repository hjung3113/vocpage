import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { VocCreateModal } from '../VocCreateModal';
import type { VocTypeListItem } from '../../../../../../shared/contracts/master/io';

const vocTypes: VocTypeListItem[] = [
  {
    id: '44444444-4444-4444-4444-444444444444',
    name: '오류',
    slug: 'error',
    color: null,
    sort_order: 1,
    is_archived: false,
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    name: '개선',
    slug: 'enhance',
    color: null,
    sort_order: 2,
    is_archived: false,
  },
];

const systems = [{ id: '66666666-6666-6666-6666-666666666666', label: 'WMS' }];
const menus = [{ id: '77777777-7777-7777-7777-777777777777', label: '입고 관리' }];

function renderModal(overrides: Partial<React.ComponentProps<typeof VocCreateModal>> = {}) {
  const props: React.ComponentProps<typeof VocCreateModal> = {
    open: true,
    onOpenChange: vi.fn(),
    vocTypes,
    systems,
    menus,
    onSubmit: vi.fn().mockResolvedValue(undefined),
    submitting: false,
    ...overrides,
  };
  return { props, ...render(<VocCreateModal {...props} />) };
}

describe('VocCreateModal', () => {
  it('renders dialog with title "새 VOC 등록" when open', () => {
    renderModal();
    expect(screen.getByRole('dialog', { name: /새 VOC 등록/ })).toBeInTheDocument();
  });

  it('shows title required error and does not call onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderModal({ onSubmit });
    await user.click(screen.getByRole('button', { name: /등록/, hidden: false }));
    expect(await screen.findByText(/제목.*필수/)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('reflects voc_type select change in form state', async () => {
    const user = userEvent.setup();
    renderModal();
    const select = screen.getByLabelText(/유형/) as HTMLSelectElement;
    await user.selectOptions(select, '55555555-5555-5555-5555-555555555555');
    expect(select.value).toBe('55555555-5555-5555-5555-555555555555');
  });

  it('mounts lazy Toast UI editor (mocked) via testid', async () => {
    renderModal();
    expect(await screen.findByTestId('voc-body-editor')).toBeInTheDocument();
  });

  it('calls onSubmit once with VocCreate-shaped payload and empty files when valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderModal({ onSubmit });
    await user.type(screen.getByLabelText(/제목/), '버그 발견');
    await user.click(screen.getByRole('button', { name: /등록/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const [payload, files] = onSubmit.mock.calls[0]!;
    expect(payload).toMatchObject({
      title: '버그 발견',
      voc_type_id: vocTypes[0]!.id,
      system_id: systems[0]!.id,
      menu_id: menus[0]!.id,
    });
    expect(files).toEqual([]);
  });

  it('renders AttachmentZone slot inside the dialog', () => {
    renderModal();
    expect(screen.getByTestId('attachment-zone-count')).toBeInTheDocument();
  });

  it('forwards selected files to onSubmit as second arg', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderModal({ onSubmit });
    const blob = new Blob([new Uint8Array(1024)], { type: 'image/png' });
    const file = new File([blob], 'shot.png', { type: 'image/png' });
    await user.type(screen.getByLabelText(/제목/), '버그 발견');
    await user.upload(screen.getByTestId('attachment-zone-input') as HTMLInputElement, [file]);
    await user.click(screen.getByRole('button', { name: /등록/ }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const files = onSubmit.mock.calls[0]![1] as File[];
    expect(files).toHaveLength(1);
    expect(files[0]!.name).toBe('shot.png');
  });
});
