import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { setEditorText } from './test/editor';

describe('App compare results', () => {
  it('blocks JSON compare and shows the invalid side error', async () => {
    const user = userEvent.setup();
    render(<App />);

    setEditorText(/original input/i, '{"ok":true}');
    setEditorText(/modified input/i, '{bad');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    expect(screen.getByText(/^Modified JSON is invalid:/)).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: /compare results/i })).not.toBeInTheDocument();
  });

  it('shows JSON path summary and highlighted values after compare', async () => {
    const user = userEvent.setup();
    render(<App />);

    setEditorText(/original input/i, '{"user":{"name":"Ada"}}');
    setEditorText(/modified input/i, '{"user":{"name":"Grace"}}');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    const results = screen.getByRole('region', { name: /compare results/i });

    expect(results).toBeInTheDocument();
    expect(within(results).getByText('user.name')).toBeInTheDocument();
    expect(within(results).getByText('Changed: 1')).toBeInTheDocument();
    expect(within(results).getByRole('cell', { name: '"Ada"' })).toBeInTheDocument();
    expect(within(results).getByRole('cell', { name: '"Grace"' })).toBeInTheDocument();
    expect(results.querySelector('.results-header')?.querySelectorAll('button')).toHaveLength(0);
  });

  it('uses one aligned scroll viewport for both formatted JSON sources', async () => {
    const user = userEvent.setup();
    render(<App />);
    setEditorText(/original input/i, '{"a":1,"nested":{"value":"left"}}');
    setEditorText(/modified input/i, '{"a":2,"nested":{"value":"right"}}');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));
    const linkedSource = screen.getByRole('table', { name: /linked formatted json sources/i });
    expect(within(linkedSource).getByRole('columnheader', { name: /original/i })).toBeInTheDocument();
    expect(within(linkedSource).getByRole('columnheader', { name: /modified/i })).toBeInTheDocument();
    expect(within(linkedSource).getAllByRole('row').length).toBeGreaterThan(1);
    expect(screen.getByText('Scroll linked')).toBeInTheDocument();
  });

  it('highlights the full removed JSON object subtree in source context', async () => {
    const user = userEvent.setup();
    render(<App />);
    setEditorText(/original input/i, '{"friends":[{"id":0,"name":"Kelly Deleon"}]}');
    setEditorText(/modified input/i, '{"friends":[]}');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    const linkedSource = screen.getByRole('table', { name: /linked formatted json sources/i });
    expect(within(linkedSource).getByRole('cell', { name: /^"friends": \[$/ })).toHaveClass('json-line-changed');
    expect(within(linkedSource).getByRole('cell', { name: /^"friends": \[\]$/ })).toHaveClass('json-line-changed');
    expect(within(linkedSource).getByRole('cell', { name: /"id": 0/ })).toHaveClass('json-line-removed');
    expect(within(linkedSource).getByRole('cell', { name: /"name": "Kelly Deleon"/ })).toHaveClass('json-line-removed');
  });

  it('shows a confident identical state for equivalent JSON', async () => {
    const user = userEvent.setup();
    render(<App />);

    setEditorText(/original input/i, '{"a":1,"b":2}');
    setEditorText(/modified input/i, '{"b":2,"a":1}');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    expect(screen.getByRole('heading', { name: /inputs are identical/i })).toBeInTheDocument();
    expect(screen.getByText(/object key order are ignored/i)).toBeInTheDocument();
  });

  it('pages large JSON result sets instead of rendering every row', async () => {
    const user = userEvent.setup();
    render(<App />);
    const left = Object.fromEntries(Array.from({ length: 250 }, (_, index) => [`k${String(index).padStart(3, '0')}`, index]));
    const right = Object.fromEntries(Array.from({ length: 250 }, (_, index) => [`k${String(index).padStart(3, '0')}`, index + 1]));
    setEditorText(/original input/i, JSON.stringify(left));
    setEditorText(/modified input/i, JSON.stringify(right));
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    const table = screen.getByRole('table', { name: /json path differences/i });
    expect(within(table).getAllByRole('row')).toHaveLength(201);
    expect(screen.getByText(/1–200 of 250/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next result page/i }));
    expect(within(table).getByText('k200')).toBeInTheDocument();
  });

  it('keeps very large formatted JSON source lazy and table values bounded', async () => {
    const user = userEvent.setup();
    render(<App />);
    const left = JSON.stringify({ payload: 'a'.repeat(160_000) });
    const right = JSON.stringify({ payload: 'b'.repeat(160_000) });
    setEditorText(/original input/i, left);
    setEditorText(/modified input/i, right);
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    const summary = screen.getByText(/formatted source context · large input/i);
    expect(summary.parentElement).not.toHaveAttribute('open');
    expect(screen.getAllByText(/160,002 chars/)).toHaveLength(2);
    expect(screen.queryByLabelText(/original formatted json/i)).not.toBeInTheDocument();

    await user.click(summary);
    const original = await screen.findByLabelText('Original source');
    const modified = screen.getByLabelText('Modified source');
    Object.assign(original, { scrollTop: 90, scrollLeft: 32 });
    fireEvent.scroll(original);
    expect(modified.scrollTop).toBe(90);
    expect(modified.scrollLeft).toBe(32);
  });

});
