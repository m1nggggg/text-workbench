import { render, screen } from '@testing-library/react';
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

    expect(getEditorText(/left input/i)).toContain('checkout');
    expect(getEditorText(/right input/i)).toContain('checkout');
  });

  it('inserts two spaces when Tab is pressed inside an editor', () => {
    render(<App />);
    setEditorText(/left input/i, 'ab', 1);
    expect(getEditorSelection(/left input/i)).toBe(1);
    runEditorKey(/left input/i, 'Tab');

    expect(getEditorText(/left input/i)).toBe('a  b');
  });

  it('opens editor-local search with the standard shortcut', () => {
    render(<App />);
    setEditorText(/left input/i, 'find this value');

    runEditorKey(/left input/i, 'f', { ctrlKey: true });

    expect(screen.getByRole('textbox', { name: /^find$/i })).toBeInTheDocument();
  });

  it('swaps both inputs without losing their content', async () => {
    const user = userEvent.setup();
    render(<App />);

    setEditorText(/left input/i, 'first');
    setEditorText(/right input/i, 'second');
    await user.click(screen.getByRole('button', { name: /swap inputs/i }));

    expect(getEditorText(/left input/i)).toBe('second');
    expect(getEditorText(/right input/i)).toBe('first');
  });

  it('beautifies one JSON pane independently', async () => {
    const user = userEvent.setup();
    render(<App />);

    setEditorText(/left input/i, '{"name":"Ada"}');
    setEditorText(/right input/i, '{"name":"Grace"}');
    await user.click(screen.getByRole('button', { name: /beautify json for left/i }));

    expect(getEditorText(/left input/i)).toBe('{\n  "name": "Ada"\n}');
    expect(getEditorText(/right input/i)).toBe('{"name":"Grace"}');
  });

  it('shows an inline error for invalid JSON beautify without changing input', async () => {
    const user = userEvent.setup();
    render(<App />);

    setEditorText(/left input/i, '{bad');
    await user.click(screen.getByRole('button', { name: /beautify json for left/i }));

    expect(getEditorText(/left input/i)).toBe('{bad');
    expect(screen.getByRole('alert')).toHaveTextContent(/^Left JSON is invalid:/);
  });

  it('clears only the selected pane', async () => {
    const user = userEvent.setup();
    render(<App />);

    setEditorText(/left input/i, 'left value');
    setEditorText(/right input/i, 'right value');
    await user.click(screen.getByRole('button', { name: /clear left/i }));

    expect(getEditorText(/left input/i)).toBe('');
    expect(getEditorText(/right input/i)).toBe('right value');
  });
});
