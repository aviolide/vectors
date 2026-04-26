import CodeMirror from "@uiw/react-codemirror";
import { cpp } from "@codemirror/lang-cpp";
import { oneDark } from "@codemirror/theme-one-dark";
import { useCallback } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  readOnly?: boolean;
};

export function ShaderEditor({ value, onChange, readOnly }: Props) {
  const handle = useCallback((v: string) => onChange(v), [onChange]);
  return (
    <div className="editor-wrap">
      <CodeMirror
        value={value}
        onChange={handle}
        theme={oneDark}
        extensions={[cpp()]}
        height="100%"
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          foldGutter: false,
          indentOnInput: true,
        }}
        readOnly={readOnly}
      />
    </div>
  );
}
