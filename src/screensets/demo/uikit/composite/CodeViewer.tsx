/**
 * CodeViewer - Read-only Monaco editor for code display
 * Presentational component (value only, no state management)
 */

import React, { useCallback, useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type * as monacoEditor from 'monaco-editor';
import type { GitComment } from '../../types/gitTypes';

interface CodeViewerProps {
  value: string;
  language: string;
  comments: GitComment[];
  scrollToLine?: { line: number; tick: number } | null;
  onCommentClick: (commentId: number) => void;
  onLineClick: (line: number) => void;
  onCursorLineChange?: (line: number) => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  value,
  language,
  comments,
  scrollToLine,
  onCommentClick,
  onLineClick,
  onCursorLineChange,
}) => {
  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);

  // Keep refs to latest callbacks & comments so onMouseDown always sees current values
  const commentsRef = useRef(comments);
  commentsRef.current = comments;
  const onCommentClickRef = useRef(onCommentClick);
  onCommentClickRef.current = onCommentClick;
  const onLineClickRef = useRef(onLineClick);
  const onCursorLineChangeRef = useRef(onCursorLineChange);
  onCursorLineChangeRef.current = onCursorLineChange;
  onLineClickRef.current = onLineClick;

  // Scroll to the requested line when scrollToLine changes
  useEffect(() => {
    if (scrollToLine != null && editorRef.current) {
      editorRef.current.revealLineInCenter(scrollToLine.line);
      editorRef.current.setPosition({ lineNumber: scrollToLine.line, column: 1 });
    }
  }, [scrollToLine]);

  // Update decorations when comments change
  const decorationsRef = useRef<monacoEditor.editor.IEditorDecorationsCollection | null>(null);
  const monacoRef = useRef<typeof monacoEditor | null>(null);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const decorations = comments
      .filter((c) => c.status === 'active')
      .map((comment) => ({
        range: new monaco.Range(comment.line, 1, comment.lineEnd, 1),
        options: {
          isWholeLine: true,
          className: 'git-comment-line-highlight',
          glyphMarginClassName: 'git-comment-glyph',
          glyphMarginHoverMessage: { value: `💬 ${comment.body}` },
          overviewRuler: {
            color: 'rgba(59, 130, 246, 0.5)',
            position: monaco.editor.OverviewRulerLane.Right,
          },
        },
      }));
    if (decorationsRef.current) {
      decorationsRef.current.clear();
    }
    decorationsRef.current = editorRef.current.createDecorationsCollection(decorations);
  }, [comments]);

  const handleEditorDidMount: OnMount = useCallback(
    (editor, monaco) => {
      editorRef.current = editor;
      monacoRef.current = monaco as unknown as typeof monacoEditor;
      editor.updateOptions({
        readOnly: true,
        minimap: { enabled: false },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        folding: true,
        glyphMargin: true,
        renderLineHighlight: 'all',
        fontSize: 13,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      });

      // Inject glyph margin styles for comment markers
      const styleId = 'git-comment-glyph-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
          .git-comment-glyph {
            background-color: #3b82f6;
            border-radius: 50%;
            margin-left: 4px;
            width: 10px !important;
            height: 10px !important;
            margin-top: 5px;
          }
          .git-comment-line-highlight {
            background-color: rgba(59, 130, 246, 0.08);
          }
        `;
        document.head.appendChild(style);
      }

      // Initial decorations
      const decorations = commentsRef.current
        .filter((c) => c.status === 'active')
        .map((comment) => ({
          range: new monaco.Range(comment.line, 1, comment.lineEnd, 1),
          options: {
            isWholeLine: true,
            className: 'git-comment-line-highlight',
            glyphMarginClassName: 'git-comment-glyph',
            glyphMarginHoverMessage: { value: `💬 ${comment.body}` },
            overviewRuler: {
              color: 'rgba(59, 130, 246, 0.5)',
              position: monaco.editor.OverviewRulerLane.Right,
            },
          },
        }));
      decorationsRef.current = editor.createDecorationsCollection(decorations);

      // Add "Add Comment" to right-click context menu
      editor.addAction({
        id: 'add-comment',
        label: 'Add Comment',
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: (ed) => {
          const position = ed.getPosition();
          if (position) {
            onLineClickRef.current(position.lineNumber);
          }
        },
      });

      // Track cursor position changes
      editor.onDidChangeCursorPosition((e) => {
        onCursorLineChangeRef.current?.(e.position.lineNumber);
      });

      // Handle glyph margin AND line number clicks
      editor.onMouseDown((e) => {
        const isGlyph = e.target.type === monaco.editor.MouseTargetType.GLYPH_MARGIN;
        const isLineNumber = e.target.type === monaco.editor.MouseTargetType.LINE_NUMBERS;
        if ((isGlyph || isLineNumber) && e.target.position) {
          const line = e.target.position.lineNumber;
          const commentOnLine = commentsRef.current.find(
            (c) => c.line <= line && c.lineEnd >= line
          );
          if (commentOnLine) {
            onCommentClickRef.current(commentOnLine.id);
          } else {
            onLineClickRef.current(line);
          }
        }
      });
    },
    [] // stable — uses refs for mutable state
  );

  const monacoLanguage = mapLanguage(language);

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={monacoLanguage}
        value={value}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          readOnly: true,
          minimap: { enabled: false },
        }}
      />
    </div>
  );
};

CodeViewer.displayName = 'CodeViewer';

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
