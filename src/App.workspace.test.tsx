import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { getEditorSelection, getEditorText, runEditorKey, setEditorText } from './test/editor';

describe('App input workspace', () => {
  it('renders JSON mode with two beautify buttons', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /text json compare/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /json/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getAllByRole('button', { name: /beautify json/i })).toHaveLength(2);
  });

  it('hides beautify buttons in text mode', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: /text/i }));

    expect(screen.queryByRole('button', { name: /beautify json/i })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /ignore whitespace/i })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /ignore case/i })).not.toBeChecked();
  });

  it('supports arrow-key navigation between mode tabs', async () => {
    const user = userEvent.setup();
    render(<App />);

    screen.getByRole('tab', { name: /json/i }).focus();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: /text/i })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /text/i })).toHaveFocus();
  });

  it('loads a useful example into both editors', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /example/i }));

    expect(getEditorText(/original input/i)).toContain('checkout');
    expect(getEditorText(/modified input/i)).toContain('checkout');
  });

  it('moves focus to new comparison results', async () => {
    const user = userEvent.setup();
    render(<App />);
    setEditorText(/original input/i, '{"enabled":false}');
    setEditorText(/modified input/i, '{"enabled":true}');

    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    await waitFor(() => expect(screen.getByRole('region', { name: /comparison results/i })).toHaveFocus());
  });

  it('inserts two spaces when Tab is pressed inside an editor', () => {
    render(<App />);
    setEditorText(/original input/i, 'ab', 1);
    expect(getEditorSelection(/original input/i)).toBe(1);
    runEditorKey(/original input/i, 'Tab');

    expect(getEditorText(/original input/i)).toBe('a  b');
  });

  it('opens editor-local search with the standard shortcut', () => {
    render(<App />);
    setEditorText(/original input/i, 'find this value');

    runEditorKey(/original input/i, 'f', { ctrlKey: true });

    expect(screen.getByRole('textbox', { name: /^find$/i })).toBeInTheDocument();
  });

  it('swaps both inputs without losing their content', async () => {
    const user = userEvent.setup();
    render(<App />);

    setEditorText(/original input/i, 'first');
    setEditorText(/modified input/i, 'second');
    await user.click(screen.getByRole('button', { name: /swap inputs/i }));

    expect(getEditorText(/original input/i)).toBe('second');
    expect(getEditorText(/modified input/i)).toBe('first');
  });

  it('beautifies one JSON pane independently', async () => {
    const user = userEvent.setup();
    render(<App />);

    setEditorText(/original input/i, '{"name":"Ada"}');
    setEditorText(/modified input/i, '{"name":"Grace"}');
    await user.click(screen.getByRole('button', { name: /beautify json for original/i }));

    expect(getEditorText(/original input/i)).toBe('{\n  "name": "Ada"\n}');
    expect(getEditorText(/modified input/i)).toBe('{"name":"Grace"}');
  });

  it('shows an inline error for invalid JSON beautify without changing input', async () => {
    const user = userEvent.setup();
    render(<App />);

    setEditorText(/original input/i, '{bad');
    await user.click(screen.getByRole('button', { name: /beautify json for original/i }));

    expect(getEditorText(/original input/i)).toBe('{bad');
    expect(screen.getByRole('alert')).toHaveTextContent(/^Original JSON is invalid:/);
  });

  it('clears only the selected pane', async () => {
    const user = userEvent.setup();
    render(<App />);

    setEditorText(/original input/i, 'left value');
    setEditorText(/modified input/i, 'right value');
    await user.click(screen.getByRole('button', { name: /clear original/i }));

    expect(getEditorText(/original input/i)).toBe('');
    expect(getEditorText(/modified input/i)).toBe('right value');
  });
});
