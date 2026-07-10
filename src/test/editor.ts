import { act, screen } from '@testing-library/react';
import { EditorSelection } from '@codemirror/state';
import { EditorView, runScopeHandlers } from '@codemirror/view';

const editorView = (label: RegExp | string) => {
  const element = screen.getByLabelText(label);
  const view = EditorView.findFromDOM(element);
  if (!view) throw new Error(`No CodeMirror view found for ${String(label)}`);
  return { element, view };
};

export const setEditorText = (label: RegExp | string, value: string, anchor = value.length) => {
  const { element, view } = editorView(label);
  act(() => {
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
    view.dispatch({ selection: EditorSelection.cursor(anchor) });
  });
  return element;
};

export const getEditorText = (label: RegExp | string) => editorView(label).view.state.doc.toString();

export const getEditorSelection = (label: RegExp | string) => editorView(label).view.state.selection.main.anchor;

export const runEditorKey = (label: RegExp | string, key: string, modifiers: KeyboardEventInit = {}) => {
  const { view } = editorView(label);
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...modifiers });
  act(() => {
    runScopeHandlers(view, event, 'editor');
  });
};
