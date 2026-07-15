import { useEffect, useRef } from 'react';
import { CheckCircle2, CircleAlert, Info, LoaderCircle } from 'lucide-react';
import AppHeader from './components/AppHeader';
import CompareEditor from './components/CompareEditor';
import JsonResults from './components/JsonResults';
import TextResults from './components/TextResults';
import WorkspaceToolbar from './components/WorkspaceToolbar';
import { TooltipProvider } from './components/ui/tooltip';
import { useCompareWorkspace } from './hooks/useCompareWorkspace';
import './styles.css';

const App = () => {
  const workspace = useCompareWorkspace();
  const resultsRegion = useRef<HTMLDivElement>(null);
  const hasInput = workspace.leftText.length > 0 || workspace.rightText.length > 0;
  const hasErrors = Boolean(workspace.errors.left || workspace.errors.right);
  const noticeTone = workspace.isComparing ? 'loading' : hasErrors ? 'error' : workspace.resultState ? 'success' : 'neutral';
  const NoticeIcon = noticeTone === 'loading' ? LoaderCircle : noticeTone === 'error' ? CircleAlert : noticeTone === 'success' ? CheckCircle2 : Info;

  useEffect(() => {
    if (!workspace.resultState || !resultsRegion.current) return;

    const region = resultsRegion.current;
    const frame = window.requestAnimationFrame(() => {
      region.focus({ preventScroll: true });
      region.scrollIntoView?.({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [workspace.resultState]);

  return (
    <TooltipProvider delayDuration={350}>
      <div className="app-frame">
        <AppHeader
          mode={workspace.mode}
          onModeChange={workspace.handleModeChange}
          onCompare={workspace.handleCompare}
          isComparing={workspace.isComparing}
        />

        <main className="app-shell">
          <WorkspaceToolbar
            canClear={hasInput}
            canSwap={hasInput}
            mode={workspace.mode}
            textOptions={workspace.textOptions}
            onTextOptionChange={workspace.changeTextOption}
            onLoadExample={workspace.loadExample}
            onSwap={workspace.swapInputs}
            onClear={workspace.clearAll}
          />

          <section className="workspace" id="compare-workspace" role="tabpanel" aria-label="Compare inputs" aria-labelledby={`${workspace.mode}-mode-tab`}>
            <CompareEditor
              side="left"
              title="Original"
              mode={workspace.mode}
              value={workspace.leftText}
              error={workspace.errors.left}
              onChange={(value) => workspace.changeInput('left', value)}
              onBeautify={() => workspace.handleBeautify('left')}
              onClear={() => workspace.clearInput('left')}
              onNotice={workspace.setNotice}
            />
            <CompareEditor
              side="right"
              title="Modified"
              mode={workspace.mode}
              value={workspace.rightText}
              error={workspace.errors.right}
              onChange={(value) => workspace.changeInput('right', value)}
              onBeautify={() => workspace.handleBeautify('right')}
              onClear={() => workspace.clearInput('right')}
              onNotice={workspace.setNotice}
            />
          </section>

          <div className="workspace-notice" data-tone={noticeTone} role="status" aria-live="polite">
            <NoticeIcon className={noticeTone === 'loading' ? 'is-spinning' : undefined} aria-hidden="true" />
            <span>{workspace.notice}</span>
          </div>

          <div
            className="results-region"
            ref={resultsRegion}
            role={workspace.resultState ? 'region' : undefined}
            aria-label={workspace.resultState ? 'Comparison results' : undefined}
            tabIndex={-1}
          >
            {workspace.resultState?.mode === 'json' ? (
              <JsonResults result={workspace.resultState.result} durationMs={workspace.resultState.durationMs} />
            ) : null}
            {workspace.resultState?.mode === 'text' ? (
              <TextResults result={workspace.resultState.result} durationMs={workspace.resultState.durationMs} options={workspace.textOptions} />
            ) : null}
          </div>
        </main>

        <footer className="app-footer">
          <span>Private by design</span>
          <span>Nothing is uploaded or stored</span>
        </footer>
      </div>
    </TooltipProvider>
  );
};

export default App;
