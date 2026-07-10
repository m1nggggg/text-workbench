import type { CompareMode } from '../compare/types';

type CompareExample = {
  left: string;
  right: string;
};

const jsonExample: CompareExample = {
  left: JSON.stringify(
    {
      service: 'checkout',
      version: 2,
      flags: { retries: 2, audit: false },
      regions: ['ap-southeast-1', 'eu-west-1'],
    },
    null,
    2,
  ),
  right: JSON.stringify(
    {
      service: 'checkout',
      version: 3,
      flags: { retries: 4, audit: true, tracing: 'sampled' },
      regions: ['ap-southeast-1', 'us-east-1'],
    },
    null,
    2,
  ),
};

const textExample: CompareExample = {
  left: ['Deploy checklist', '', '- Run tests', '- Review logs', '- Release at 14:00'].join('\n'),
  right: ['Deploy checklist', '', '- Run all tests', '- Review metrics', '- Release at 15:30', '- Notify support'].join(
    '\n',
  ),
};

export const compareExamples: Record<CompareMode, CompareExample> = {
  json: jsonExample,
  text: textExample,
};
