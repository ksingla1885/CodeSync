'use client';
import React, { useRef, useEffect, useCallback } from 'react';
import { Editor, useMonaco } from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';

const CodeEditor = ({
  code,
  onChange,
  language = 'javascript',
  cursors = {},
  onCursorChange,
  ytext,
  connected,
}) => {
  const monacoRef = useRef(null);
  const editorRef = useRef(null);
  const bindingRef = useRef(null);
  const decorationsRef = useRef([]);
  const monaco = useMonaco();

  // Register custom theme
  useEffect(() => {
    if (!monaco) return;
    monaco.editor.defineTheme('codesync-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '4b5563', fontStyle: 'italic' },
        { token: 'keyword', foreground: '7dd3fc' },
        { token: 'string', foreground: '86efac' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'type', foreground: 'c4b5fd' },
        { token: 'function', foreground: '93c5fd' },
      ],
      colors: {
        'editor.background': '#09090b',
        'editor.foreground': '#e4e4e7',
        'editor.lineHighlightBackground': '#ffffff08',
        'editor.selectionBackground': '#ffffff18',
        'editorLineNumber.foreground': '#3f3f46',
        'editorLineNumber.activeForeground': '#71717a',
        'editorCursor.foreground': '#ffffff',
        'editor.inactiveSelectionBackground': '#ffffff0f',
        'editorIndentGuide.background': '#27272a',
        'editorIndentGuide.activeBackground': '#3f3f46',
        'scrollbarSlider.background': '#ffffff10',
        'scrollbarSlider.hoverBackground': '#ffffff18',
        'scrollbarSlider.activeBackground': '#ffffff25',
      },
    });
    monaco.editor.setTheme('codesync-dark');
  }, [monaco]);

  // Handle binding lifecycle
  useEffect(() => {
    if (editorRef.current && ytext && connected) {
      // Clean up previous binding
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }

      // Create new binding
      const model = editorRef.current.getModel();
      if (model) {
        bindingRef.current = new MonacoBinding(
          ytext,
          model,
          new Set([editorRef.current]),
          null // awareness can be added here for built-in cursors
        );
      }
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [ytext, connected]);

  const handleEditorDidMount = useCallback((editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;
    monacoInstance.editor.setTheme('codesync-dark');
    
    editor.onDidChangeCursorPosition((e) => {
      onCursorChange?.(e.position);
    });
  }, [onCursorChange]);

  // Render remote cursors
  useEffect(() => {
    const editor = editorRef.current;
    const monacoInst = monacoRef.current;
    if (!editor || !monacoInst) return;

    const newDecorations = Object.entries(cursors).map(([id, data]) => ({
      range: new monacoInst.Range(
        data.position.lineNumber,
        data.position.column,
        data.position.lineNumber,
        data.position.column
      ),
      options: {
        className: `remote-cursor-${id}`,
        hoverMessage: { value: `**${data.user?.name || 'User'}**` },
        after: {
          content: ` ${data.user?.name || 'User'} `,
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
    <div className="h-full w-full overflow-hidden" style={{ background: '#09090b' }}>
      <Editor
        height="100%"
        width="100%"
        language={language}
        // If bound, Monaco handles value. If not, use the code prop as fallback.
        value={ytext ? undefined : code}
        onChange={ytext ? undefined : onChange}
        onMount={handleEditorDidMount}
        theme="codesync-dark"
        options={{
          fontSize: 13.5,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fixedOverflowWidgets: true,
          padding: { top: 20, bottom: 20 },
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
          fontLigatures: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          renderLineHighlight: 'line',
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          renderValidationDecorations: 'on',
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            useShadows: false,
            verticalScrollbarSize: 6,
            horizontalScrollbarSize: 6,
          },
        }}
      />
      <style jsx global>{`
        .remote-cursor-label {
          position: absolute;
          top: -16px;
          padding: 1px 4px;
          font-size: 9px;
          font-weight: 700;
          color: white;
          background: #3b82f6;
          border-radius: 2px;
          white-space: nowrap;
          pointer-events: none;
          z-index: 10;
        }
        .remote-cursor {
          width: 2px !important;
          background: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default CodeEditor;
