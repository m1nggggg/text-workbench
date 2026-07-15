import { useEffect, useRef } from 'react';
import { json } from '@codemirror/lang-json';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Compartment, EditorState, Transaction } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { basicSetup } from 'codemirror';
import { tags } from '@lezer/highlight';
import type { CompareMode } from '../compare/types';

type CodeEditorProps = {
  label: string;
  mode: CompareMode;
  value: string;
  describedBy?: string;
  invalid: boolean;
  onChange: (value: string) => void;
};

const editorTheme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'var(--editor)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': { fontFamily: 'var(--mono)', lineHeight: '1.6' },
  '.cm-content': { padding: '14px 0', caretColor: 'var(--accent)' },
  '.cm-line': { padding: '0 16px' },
  '.cm-gutters': {
    minWidth: '50px',
    borderRight: '1px solid var(--border)',
    backgroundColor: 'var(--gutter)',
    color: 'var(--ghost)',
  },
  '.cm-lineNumbers .cm-gutterElement': { minWidth: '49px', padding: '0 10px 0 4px' },
  '.cm-activeLine, .cm-activeLineGutter': { backgroundColor: 'rgb(255 255 255 / 2.5%)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'rgb(53 181 196 / 26%) !important',
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--accent)' },
  '.cm-panels': { borderColor: 'var(--border)', backgroundColor: 'var(--panel)' },
  '.cm-searchMatch': { border: '1px solid #8c762e', backgroundColor: 'rgb(216 177 69 / 18%)' },
  '.cm-searchMatch.cm-searchMatch-selected': { backgroundColor: 'rgb(216 177 69 / 34%)' },
}, { dark: true });

const highlightStyle = HighlightStyle.define([
  { tag: tags.propertyName, color: '#8cc8d1' },
  { tag: tags.string, color: '#a9c88d' },
  { tag: [tags.number, tags.bool, tags.null], color: '#d8b76f' },
  { tag: tags.invalid, color: 'var(--error)' },
]);

const editorAttributes = (label: string, invalid: boolean, describedBy?: string) => {
  const attributes: Record<string, string> = {
    'aria-label': label,
    'aria-invalid': String(invalid),
    'aria-multiline': 'true',
    autocapitalize: 'off',
    autocomplete: 'off',
    spellcheck: 'false',
  };
  if (describedBy) attributes['aria-describedby'] = describedBy;
  return attributes;
};

const insertTwoSpaces = (editor: EditorView) => {
  editor.dispatch(editor.state.replaceSelection('  '), {
    scrollIntoView: true,
    userEvent: 'input.type',
  });
  return true;
};

const CodeEditor = ({ label, mode, value, describedBy, invalid, onChange }: CodeEditorProps) => {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const initial = useRef({ label, mode, value, describedBy, invalid });
  const language = useRef(new Compartment());
  const attributes = useRef(new Compartment());
  const placeholderText = useRef(new Compartment());

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!host.current) return;
    const config = initial.current;
    const editor = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: config.value,
        extensions: [
          basicSetup,
          EditorState.tabSize.of(2),
          keymap.of([
            { key: 'Tab', run: insertTwoSpaces },
          ]),
          language.current.of(config.mode === 'json' ? json() : []),
          attributes.current.of(EditorView.contentAttributes.of(
            editorAttributes(config.label, config.invalid, config.describedBy),
          )),
          placeholderText.current.of(placeholder(config.mode === 'json' ? 'Paste JSON or drop a file…' : 'Paste text or drop a file…')),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) onChangeRef.current(update.state.doc.toString());
          }),
          editorTheme,
          syntaxHighlighting(highlightStyle),
        ],
      }),
    });
    view.current = editor;
    return () => {
      view.current = null;
      editor.destroy();
    };
  }, []);

  useEffect(() => {
    const editor = view.current;
    if (!editor || editor.state.doc.toString() === value) return;
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: value },
      annotations: Transaction.addToHistory.of(false),
    });
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: language.current.reconfigure(mode === 'json' ? json() : []) });
    view.current?.dispatch({
      effects: placeholderText.current.reconfigure(placeholder(mode === 'json' ? 'Paste JSON or drop a file…' : 'Paste text or drop a file…')),
    });
  }, [mode]);

  useEffect(() => {
    view.current?.dispatch({
      effects: attributes.current.reconfigure(EditorView.contentAttributes.of(
        editorAttributes(label, invalid, describedBy),
      )),
    });
  }, [describedBy, invalid, label]);

  return <div className="code-editor" ref={host} />;
};

export default CodeEditor;
