import '@testing-library/jest-dom/vitest';

const emptyClientRects = () => Object.assign([], {
  item: () => null,
});

Range.prototype.getClientRects = emptyClientRects;
Range.prototype.getBoundingClientRect = () => new DOMRect(0, 0, 0, 0);
