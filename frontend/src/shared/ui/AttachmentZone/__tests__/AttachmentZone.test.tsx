import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import {
  AttachmentZone,
  ATTACHMENT_MAX_FILES,
  ATTACHMENT_MAX_SIZE_MB,
  ATTACHMENT_ACCEPT,
} from '../AttachmentZone';

function makeFile(name: string, sizeMB: number, type = 'image/png'): File {
  const blob = new Blob([new Uint8Array(sizeMB * 1024 * 1024)], { type });
  return new File([blob], name, { type });
}

function renderZone(overrides: Partial<React.ComponentProps<typeof AttachmentZone>> = {}) {
  const onChange = vi.fn();
  const props: React.ComponentProps<typeof AttachmentZone> = {
    files: [],
    onChange,
    ...overrides,
  };
  return { props, onChange, ...render(<AttachmentZone {...props} />) };
}

describe('AttachmentZone', () => {
  it('exposes prototype-aligned constants', () => {
    expect(ATTACHMENT_MAX_FILES).toBe(5);
    expect(ATTACHMENT_MAX_SIZE_MB).toBe(10);
    expect(ATTACHMENT_ACCEPT).toMatch(/image\/png/);
    expect(ATTACHMENT_ACCEPT).toMatch(/image\/jpeg/);
    expect(ATTACHMENT_ACCEPT).toMatch(/image\/gif/);
    expect(ATTACHMENT_ACCEPT).toMatch(/image\/webp/);
  });

  it('renders count badge "0/5" when no files', () => {
    renderZone();
    expect(screen.getByTestId('attachment-zone-count')).toHaveTextContent('0/5');
  });

  it('renders count badge "2/5" when two files', () => {
    renderZone({ files: [makeFile('a.png', 1), makeFile('b.png', 1)] });
    expect(screen.getByTestId('attachment-zone-count')).toHaveTextContent('2/5');
  });

  it('calls onChange with selected files via input change', async () => {
    const user = userEvent.setup();
    const { onChange } = renderZone();
    const input = screen.getByTestId('attachment-zone-input') as HTMLInputElement;
    await user.upload(input, [makeFile('a.png', 1)]);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0]![0]).toHaveLength(1);
    expect(onChange.mock.calls[0]![0][0].name).toBe('a.png');
  });

  it('rejects file that exceeds max size and surfaces error message', async () => {
    const user = userEvent.setup();
    const { onChange } = renderZone();
    const input = screen.getByTestId('attachment-zone-input') as HTMLInputElement;
    await user.upload(input, [makeFile('big.png', 11)]);
    expect(onChange).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(/10MB/);
  });

  it('rejects unsupported mime type', async () => {
    const { onChange } = renderZone();
    const input = screen.getByTestId('attachment-zone-input') as HTMLInputElement;
    const pdf = makeFile('doc.pdf', 1, 'application/pdf');
    // bypass user-event accept filter — we need the handler to run, not the picker filter
    fireEvent.change(input, { target: { files: [pdf] } });
    expect(onChange).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(/이미지/);
  });

  it('rejects when adding would exceed max file count', async () => {
    const user = userEvent.setup();
    const existing = Array.from({ length: 5 }, (_, i) => makeFile(`f${i}.png`, 1));
    const { onChange } = renderZone({ files: existing });
    const input = screen.getByTestId('attachment-zone-input') as HTMLInputElement;
    await user.upload(input, [makeFile('extra.png', 1)]);
    expect(onChange).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(/5개/);
  });

  it('removes a file when its remove button is clicked', async () => {
    const user = userEvent.setup();
    const f1 = makeFile('a.png', 1);
    const f2 = makeFile('b.png', 1);
    const { onChange } = renderZone({ files: [f1, f2] });
    await user.click(screen.getByRole('button', { name: /a\.png 제거/ }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0]![0] as File[];
    expect(next).toHaveLength(1);
    expect(next[0]!.name).toBe('b.png');
  });

  it('exposes label region with file-input association', () => {
    renderZone();
    expect(screen.getByLabelText(/첨부파일/)).toBeInTheDocument();
  });
});
