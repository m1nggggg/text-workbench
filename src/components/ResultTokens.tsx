import type { TextToken } from '../compare/types';

type ResultTokensProps = {
  tokens: TextToken[];
  isMissing?: boolean;
  isBlank?: boolean;
};

const ResultTokens = ({ tokens, isMissing = false, isBlank = false }: ResultTokensProps) => {
  if (isMissing) return <span className="empty-cell" aria-label="No corresponding line" />;
  if (isBlank) return <span className="blank-line" aria-label="Blank line">↵</span>;

  return (
    <>
      {tokens.map((token, index) => (
        <span key={`${token.text}-${index}`} className={`token token-${token.kind}`}>
          {token.text}
        </span>
      ))}
    </>
  );
};

export default ResultTokens;
