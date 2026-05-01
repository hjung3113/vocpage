import { useRef, useEffect } from 'react';
import { Editor } from '@toast-ui/react-editor';
import '@toast-ui/editor/dist/toastui-editor.css';

interface ToastBodyEditorProps {
  value: string;
  onChange: (markdown: string) => void;
}

export default function ToastBodyEditor({ value, onChange }: ToastBodyEditorProps) {
  const ref = useRef<Editor | null>(null);

  // React 18 Strict Mode 이중 mount 방지 가드
  useEffect(() => {
    const inst = ref.current?.getInstance();
    if (!inst) return;
    if (inst.getMarkdown() !== value) inst.setMarkdown(value);
  }, [value]);

  return (
    <Editor
      ref={ref}
      initialValue={value}
      previewStyle="vertical"
      height="320px"
      initialEditType="markdown"
      onChange={() => {
        const md = ref.current?.getInstance().getMarkdown() ?? '';
        onChange(md);
      }}
    />
  );
}
