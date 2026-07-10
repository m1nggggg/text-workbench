import AppHeader from './components/AppHeader';
import CompareEditor from './components/CompareEditor';
import JsonResults from './components/JsonResults';
import TextResults from './components/TextResults';
import WorkspaceToolbar from './components/WorkspaceToolbar';
import { useCompareWorkspace } from './hooks/useCompareWorkspace';
import './styles.css';

const App = () => {
  const workspace = useCompareWorkspace();
  const hasInput = workspace.leftText.length > 0 || workspace.rightText.length > 0;

  return (
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

        <p className="workspace-notice" role="status" aria-live="polite">{workspace.notice}</p>

        {workspace.resultState?.mode === 'json' ? (
          <JsonResults result={workspace.resultState.result} durationMs={workspace.resultState.durationMs} />
        ) : null}
        {workspace.resultState?.mode === 'text' ? (
          <TextResults result={workspace.resultState.result} durationMs={workspace.resultState.durationMs} options={workspace.textOptions} />
        ) : null}
      </main>

      <footer className="app-footer">
        <span>Private by design</span>
        <span>Nothing is uploaded or stored</span>
      </footer>
    </div>
  );
};

export default App;
