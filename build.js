const { build } = require('esbuild');

build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  outfile: 'dist/bundle.js',
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  sourcemap: true,
  resolveExtensions: ['.ts', '.js'],
  alias: {
    '@': './src',
  },
  external: ['knex'],
}).catch(() => process.exit(1));
