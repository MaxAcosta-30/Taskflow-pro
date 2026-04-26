import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    exclude: ['node_modules', 'tests/e2e/**/*'],
    env: {
      JWT_SECRET: 'test-secret-123',
      JWT_REFRESH_SECRET: 'test-refresh-456',
    },
  },
});
