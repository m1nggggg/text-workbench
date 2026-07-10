import type { TextCompareOptions } from '../compare/types';

type TextComparisonOptionsProps = {
  options: TextCompareOptions;
  onChange: (option: keyof TextCompareOptions, enabled: boolean) => void;
};

const TextComparisonOptions = ({ options, onChange }: TextComparisonOptionsProps) => (
  <fieldset className="comparison-options">
    <legend>Text comparison options</legend>
    <label>
      <input
        type="checkbox"
        checked={options.ignoreWhitespace}
        onChange={(event) => onChange('ignoreWhitespace', event.target.checked)}
      />
      <span aria-hidden="true" />
      Ignore whitespace
    </label>
    <label>
      <input
        type="checkbox"
        checked={options.ignoreCase}
        onChange={(event) => onChange('ignoreCase', event.target.checked)}
      />
      <span aria-hidden="true" />
      Ignore case
    </label>
  </fieldset>
);

export default TextComparisonOptions;
