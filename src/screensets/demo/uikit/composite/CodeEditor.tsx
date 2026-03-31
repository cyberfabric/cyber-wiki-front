/**
 * CodeEditor - Editable Monaco editor for code editing
 * Presentational component (value/onChange)
 */

import React, { useCallback } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  language,
  onChange,
}) => {
  const handleEditorDidMount: OnMount = useCallback((_editor) => {
    _editor.updateOptions({
      minimap: { enabled: true },
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      folding: true,
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      tabSize: 2,
      formatOnPaste: true,
      formatOnType: true,
      suggestOnTriggerCharacters: true,
      quickSuggestions: true,
      renderWhitespace: 'selection',
    });

    _editor.focus();
  }, []);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (newValue !== undefined) {
        onChange(newValue);
      }
    },
    [onChange]
  );

  const monacoLanguage = mapLanguage(language);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={monacoLanguage}
        value={value}
        onChange={handleChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
      />
    </div>
  );
};

CodeEditor.displayName = 'CodeEditor';

function mapLanguage(language: string): string {
  const languageMap: Record<string, string> = {
    typescript: 'typescript',
    javascript: 'javascript',
    json: 'json',
    markdown: 'markdown',
    html: 'html',
    css: 'css',
    python: 'python',
    rust: 'rust',
    go: 'go',
    yaml: 'yaml',
  };
  return languageMap[language] ?? 'plaintext';
}
