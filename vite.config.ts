import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [{
            name: 'editor',
            test: /node_modules[\\/](?:@codemirror|codemirror|@lezer|style-mod|crelt|w3c-keyname)[\\/]/,
          }],
        },
      },
    },
  },
  test: {
    css: true,
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
