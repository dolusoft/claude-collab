import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'mcp-main': 'src/mcp-main.ts',
    'hub-main': 'src/hub-main.ts',
    cli: 'src/cli.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node20',
  splitting: false,
  treeshake: true,
  minify: false,
});
