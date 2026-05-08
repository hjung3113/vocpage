import { useEffect, useRef } from 'react';
import { ATTACHMENT_MAX_FILES, ATTACHMENT_MAX_SIZE_MB } from '@shared/ui/attachment-zone';
import { toast } from '@shared/ui/toast';

const MAX_BYTES = ATTACHMENT_MAX_SIZE_MB * 1024 * 1024;
const IMAGE_MD_RE = /!\[[^\]]*\]\(([^)]+)\)/g;

// feature-voc.md §8.4 — body→첨부 단방향 sync.
// data:URL 이미지가 markdown 안에 들어오면 file list 에 mirror.
// 5 files / 10MB cap 도달 시 sonner toast 경고.
export function useBodyAttachmentSync(
  body: string,
  files: File[],
  setFiles: (updater: (prev: File[]) => File[]) => void,
) {
  const syncedRef = useRef<Set<string>>(new Set());

  // reset on identity-changing condition handled by parent (resetSyncedUrls)
  useEffect(() => {
    const matches = Array.from(body.matchAll(IMAGE_MD_RE));
    if (matches.length === 0) return;
    const added: File[] = [];
    for (const m of matches) {
      const url = m[1];
      if (!url || syncedRef.current.has(url)) continue;
      syncedRef.current.add(url);
      if (!url.startsWith('data:')) continue;
      const file = dataUrlToFile(url);
      if (file) added.push(file);
    }
    if (added.length === 0) return;
    setFiles((prev) => {
      const remainingSlots = ATTACHMENT_MAX_FILES - prev.length;
      if (remainingSlots <= 0) {
        toast.error(`첨부는 최대 ${ATTACHMENT_MAX_FILES}개까지 가능합니다`);
        return prev;
      }
      const accepted: File[] = [];
      let totalBytes = prev.reduce((acc, f) => acc + f.size, 0);
      for (const f of added) {
        if (accepted.length >= remainingSlots) {
          toast.error(`첨부는 최대 ${ATTACHMENT_MAX_FILES}개까지 가능합니다`);
          break;
        }
        if (totalBytes + f.size > MAX_BYTES) {
          toast.error(`총 첨부 용량은 ${ATTACHMENT_MAX_SIZE_MB}MB 를 초과할 수 없습니다`);
          break;
        }
        accepted.push(f);
        totalBytes += f.size;
      }
      return accepted.length === 0 ? prev : [...prev, ...accepted];
    });
    void files;
  }, [body, files, setFiles]);

  return {
    resetSyncedUrls: () => {
      syncedRef.current = new Set();
    },
  };
}

function dataUrlToFile(dataUrl: string): File | null {
  try {
    const [meta, base64] = dataUrl.split(',');
    if (!meta || !base64) return null;
    const mimeMatch = meta.match(/data:([^;]+);base64/);
    const mime = mimeMatch?.[1] ?? 'image/png';
    const bin = atob(base64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) buf[i] = bin.charCodeAt(i);
    const ext = mime.split('/')[1] ?? 'png';
    return new File([buf], `pasted-${Date.now()}.${ext}`, { type: mime });
  } catch {
    return null;
  }
}
