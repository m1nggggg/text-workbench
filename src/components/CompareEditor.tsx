import { useRef, useState } from 'react';
import type { ChangeEvent, DragEvent } from 'react';
import { Braces, Clipboard, Eraser, FileUp } from 'lucide-react';
import type { CompareMode, InputError } from '../compare/types';
import CodeEditor from './CodeEditor';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';

type CompareEditorProps = {
  side: 'left' | 'right';
  title: string;
  mode: CompareMode;
  value: string;
  error?: InputError;
  onChange: (value: string) => void;
  onBeautify: () => void;
  onClear: () => void;
  onNotice: (message: string) => void;
};

const maxFileBytes = 25 * 1024 * 1024;

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const CompareEditor = ({
  side,
  title,
  mode,
  value,
  error,
  onChange,
  onBeautify,
  onClear,
  onNotice,
}: CompareEditorProps) => {
  const fileInput = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const sideLabel = side === 'left' ? 'Original' : 'Modified';
  const phaseLabel = side === 'left' ? 'Before' : 'After';
  const lineCount = value.length === 0 ? 0 : value.split('\n').length;
  const byteCount = new Blob([value]).size;

  const loadFile = async (file: File) => {
    if (file.size > maxFileBytes) {
      onNotice(`${file.name} is larger than the 25 MB safety limit.`);
      return;
    }

    try {
      onChange(await file.text());
      onNotice(`${file.name} loaded into ${title.toLowerCase()}.`);
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : 'The file could not be read.';
      onNotice(`Could not open ${file.name}: ${detail}`);
    }
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void loadFile(file);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];

    if (file) {
      void loadFile(file);
      return;
    }

    const droppedText = event.dataTransfer.getData('text/plain');
    if (droppedText) onChange(droppedText);
  };

  const copyInput = async () => {
    try {
      await navigator.clipboard.writeText(value);
      onNotice(`${title} copied to the clipboard.`);
    } catch (caught) {
      const detail = caught instanceof Error ? caught.message : 'Clipboard permission was denied.';
      onNotice(`Could not copy ${title.toLowerCase()}: ${detail}`);
    }
  };

  return (
    <section
      className={`editor-pane${isDragging ? ' is-dragging' : ''}${error ? ' has-error' : ''}`}
      aria-labelledby={`${side}-editor-title`}
      onDragEnter={(event) => { event.preventDefault(); setIsDragging(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragging(false);
      }}
      onDrop={handleDrop}
    >
      <div className="editor-header">
        <div className="editor-title">
          <span className={`side-marker side-marker-${side}`} aria-hidden="true" />
          <h3 id={`${side}-editor-title`}>{title}</h3>
          <span>{phaseLabel}</span>
        </div>
        <div className="editor-actions">
          <input
            ref={fileInput}
            className="visually-hidden"
            type="file"
            accept=".json,.txt,.log,.md,.csv,application/json,text/plain"
            aria-label={`Choose file for ${title}`}
            onChange={handleFileInput}
          />
          <Tooltip><TooltipTrigger asChild><Button className="icon-button" variant="ghost" size="icon-sm" type="button" aria-label={`Open file for ${title}`} onClick={() => fileInput.current?.click()}>
            <FileUp aria-hidden="true" />
          </Button></TooltipTrigger><TooltipContent>Open file</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button className="icon-button" variant="ghost" size="icon-sm" type="button" aria-label={`Copy ${title} content`} disabled={!value} onClick={() => void copyInput()}>
            <Clipboard aria-hidden="true" />
          </Button></TooltipTrigger><TooltipContent>Copy input</TooltipContent></Tooltip>
          {mode === 'json' ? (
            <Button className="editor-button" variant="outline" size="xs" type="button" aria-label={`Beautify JSON for ${sideLabel}`} disabled={!value} onClick={onBeautify}>
              <Braces data-icon="inline-start" aria-hidden="true" /> Format
            </Button>
          ) : null}
          <Tooltip><TooltipTrigger asChild><Button className="icon-button" variant="ghost" size="icon-sm" type="button" aria-label={`Clear ${sideLabel}`} disabled={!value} onClick={onClear}>
            <Eraser aria-hidden="true" />
          </Button></TooltipTrigger><TooltipContent>Clear input</TooltipContent></Tooltip>
        </div>
      </div>

      <div className="editor-body">
        <CodeEditor
          label={`${sideLabel} input`}
          invalid={Boolean(error)}
          describedBy={error ? `${side}-editor-error` : undefined}
          mode={mode}
          value={value}
          onChange={onChange}
        />
        {isDragging ? <div className="drop-overlay">Drop to replace {title.toLowerCase()}</div> : null}
      </div>

      <div className="editor-status" aria-label={`${title} statistics`}>
        <span>{mode.toUpperCase()}</span>
        <span>{lineCount.toLocaleString()} {lineCount === 1 ? 'line' : 'lines'}</span>
        <span>{formatBytes(byteCount)}</span>
        <span>UTF-8</span>
      </div>
      {error ? <p className="field-error" id={`${side}-editor-error`} role="alert">{error.message}</p> : null}
    </section>
  );
};

export default CompareEditor;
