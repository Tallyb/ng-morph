import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
    sourcemap: true,
    preserveModules: false
  },
  external: [
    '@angular/compiler',
    'ts-morph',
    'node:fs'
  ],
  plugins: [
    nodeResolve(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './dist',
      sourceMap: true,
      include: ['src/**/*'],
      exclude: ['**/*.spec.ts', '**/*.test.ts']
    })
  ]
};