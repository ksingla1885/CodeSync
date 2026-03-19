'use client';
import React, { useRef, useEffect, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';

const CodeEditor = ({
  code,
  onChange,
  language = 'javascript',
  cursors = {},
  onCursorChange,
}) => {
  const monacoRef = useRef(null);
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Emit cursor position on every move
    editor.onDidChangeCursorPosition((e) => {
      onCursorChange?.(e.position);
    });
  }, [onCursorChange]);

  // Render remote cursors whenever they change
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const newDecorations = Object.entries(cursors).map(([, data]) => ({
      range: new monaco.Range(
        data.position.lineNumber,
        data.position.column,
        data.position.lineNumber,
        data.position.column
      ),
      options: {
        className: 'remote-cursor',
        hoverMessage: { value: `**${data.user.name}**` },
        after: {
          content: ` ${data.user.name} `,
          inlineClassName: 'remote-cursor-label',
        },
      },
    }));

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [cursors]);

  return (
    <div className="h-full w-full bg-[#0d0d0d] overflow-hidden">
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={code}
        onChange={onChange}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          fixedOverflowWidgets: true,
          padding: { top: 16 },
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontLigatures: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          lineNumbers: 'on',
          renderLineHighlight: 'all',
          wordWrap: 'on',
          automaticLayout: true,
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            useShadows: false,
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
        }}
      />
    </div>
  );
};

export default CodeEditor;
