import { useRef, useEffect } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';

type Format = 'markdown' | 'html';

interface ToastBodyEditorProps {
  value: string;
  onChange: (output: string) => void;
  /** Output format. `markdown` (default — VOC create) or `html` (comments §8.13). */
  format?: Format;
  /** Editor type init. Defaults to match `format`. */
  initialEditType?: 'markdown' | 'wysiwyg';
  /** Editor height (CSS height value). Defaults to '320px'. */
  height?: string;
  /** previewStyle (markdown only). Defaults to 'vertical'. */
  previewStyle?: 'vertical' | 'tab';
}

export default function ToastBodyEditor({
  value,
  onChange,
  format = 'markdown',
  initialEditType,
  height = '320px',
  previewStyle = 'vertical',
}: ToastBodyEditorProps) {
  const ref = useRef<Editor | null>(null);
  const editType = initialEditType ?? (format === 'html' ? 'wysiwyg' : 'markdown');

  useEffect(() => {
    const inst = ref.current?.getInstance();
    if (!inst) return;
    if (format === 'html') {
      if (inst.getHTML() !== value) inst.setHTML(value);
    } else {
      if (inst.getMarkdown() !== value) inst.setMarkdown(value);
    }
  }, [value, format]);

  return (
    <Editor
      ref={ref}
      initialValue={value}
      previewStyle={previewStyle}
      height={height}
      initialEditType={editType}
      onChange={() => {
        const inst = ref.current?.getInstance();
        if (!inst) return;
        const out = format === 'html' ? inst.getHTML() : inst.getMarkdown();
        onChange(out ?? '');
      }}
    />
  );
}
