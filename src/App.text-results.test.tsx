import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { getEditorText, setEditorText } from './test/editor';

describe('App text compare results', () => {
  it('shows text line and inline token differences after compare', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('tab', { name: /text/i }));
    setEditorText(/left input/i, 'status: pending');
    setEditorText(/right input/i, 'status: approved');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    const results = screen.getByRole('region', { name: /compare results/i });

    expect(within(results).getByText('Changed: 1')).toBeInTheDocument();
    expect(within(results).getByText('pending')).toHaveClass('token-removed');
    expect(within(results).getByText('approved')).toHaveClass('token-added');
    expect(getComputedStyle(results.querySelector('.text-result-row') as Element).minHeight).toBe('27px');
  });

  it('applies text options, preserves inputs, and clears stale results', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /text/i }));
    setEditorText(/left input/i, '  Release\tREADY  ');
    setEditorText(/right input/i, 'release ready');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));
    expect(screen.getByText('Changed: 1')).toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: /ignore whitespace/i }));
    await user.click(screen.getByRole('checkbox', { name: /ignore case/i }));
    expect(screen.queryByRole('region', { name: /compare results/i })).not.toBeInTheDocument();
    expect(getEditorText(/left input/i)).toBe('  Release\tREADY  ');

    await user.click(screen.getByRole('button', { name: /^compare$/i }));
    expect(screen.getByRole('heading', { name: /inputs are identical/i })).toBeInTheDocument();
    expect(screen.getByText(/ignored: whitespace and case/i)).toBeInTheDocument();
  });

  it('compares with the primary keyboard shortcut', () => {
    render(<App />);

    setEditorText(/left input/i, '{"ok":true}');
    setEditorText(/right input/i, '{"ok":false}');
    fireEvent.keyDown(screen.getByLabelText(/left input/i), { key: 'Enter', ctrlKey: true });

    expect(screen.getByRole('region', { name: /compare results/i })).toBeInTheDocument();
  });

  it('clears stale results as soon as an input changes', async () => {
    const user = userEvent.setup();
    render(<App />);

    setEditorText(/left input/i, '{"ok":true}');
    setEditorText(/right input/i, '{"ok":false}');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));
    expect(screen.getByRole('region', { name: /compare results/i })).toBeInTheDocument();

    setEditorText(/right input/i, `${getEditorText(/right input/i)} `);

    expect(screen.queryByRole('region', { name: /compare results/i })).not.toBeInTheDocument();
  });

  it('collapses long unchanged text runs around changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /text/i }));
    const leftLines = Array.from({ length: 120 }, (_, index) => `line ${index + 1}`);
    const rightLines = [...leftLines];
    rightLines[60] = 'line sixty-one changed';
    setEditorText(/left input/i, leftLines.join('\n'));
    setEditorText(/right input/i, rightLines.join('\n'));

    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    expect(screen.getAllByRole('button', { name: /show \d+ unchanged lines/i }).length).toBeGreaterThan(0);
    expect(screen.getByText((_, element) => Boolean(
      element?.classList.contains('token-added') && element.textContent?.includes('sixty-one'),
    ))).toBeInTheDocument();
  });
});
