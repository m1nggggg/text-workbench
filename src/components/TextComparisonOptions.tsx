import type { TextCompareOptions } from '../compare/types';
import { Checkbox } from './ui/checkbox';

type TextComparisonOptionsProps = {
  options: TextCompareOptions;
  onChange: (option: keyof TextCompareOptions, enabled: boolean) => void;
};

const TextComparisonOptions = ({ options, onChange }: TextComparisonOptionsProps) => (
  <fieldset className="comparison-options">
    <legend>Text comparison options</legend>
    <label htmlFor="ignore-whitespace">
      <Checkbox
        id="ignore-whitespace"
        checked={options.ignoreWhitespace}
        onCheckedChange={(checked) => onChange('ignoreWhitespace', checked === true)}
      />
      Ignore whitespace
    </label>
    <label htmlFor="ignore-case">
      <Checkbox
        id="ignore-case"
        checked={options.ignoreCase}
        onCheckedChange={(checked) => onChange('ignoreCase', checked === true)}
      />
      Ignore case
    </label>
  </fieldset>
);

export default TextComparisonOptions;
