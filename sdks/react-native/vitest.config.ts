import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'react-native': fileURLToPath(new URL('./test/react-native-mock.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'happy-dom',
  },
});
