import axe from 'axe-core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { setEditorText } from './test/editor';

const accessibilityViolations = async () => {
  const result = await axe.run(document.body, {
    rules: {
      // jsdom has no layout engine, so contrast is verified during visual QA rather than here.
      'color-contrast': { enabled: false },
    },
  });
  return result.violations.map(({ id, help, nodes }) => ({ id, help, nodes: nodes.map((node) => node.target) }));
};

describe('App accessibility structure', () => {
  it('has no detectable accessibility violations in the input workspace', async () => {
    render(<App />);

    expect(await accessibilityViolations()).toEqual([]);
  });

  it('has no detectable accessibility violations in JSON results', async () => {
    const user = userEvent.setup();
    render(<App />);
    setEditorText(/left input/i, '{"enabled":false}');
    setEditorText(/right input/i, '{"enabled":true}');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    expect(await accessibilityViolations()).toEqual([]);
  });

  it('has no detectable accessibility violations in text results', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('tab', { name: /text/i }));
    setEditorText(/left input/i, 'status: pending');
    setEditorText(/right input/i, 'status: approved');
    await user.click(screen.getByRole('button', { name: /^compare$/i }));

    expect(await accessibilityViolations()).toEqual([]);
  });
});
