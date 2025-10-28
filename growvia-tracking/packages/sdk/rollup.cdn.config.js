import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

export default {
  input: 'src/growvia-sdk.ts',
  output: [
    // UMD build (unminified)
    {
      file: 'dist/growvia.js',
      format: 'umd',
      name: 'Growvia',
      sourcemap: true,
    },
    // UMD build (minified)
    {
      file: 'dist/growvia.min.js',
      format: 'umd',
      name: 'Growvia',
      sourcemap: true,
      plugins: [terser()],
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
    }),
  ],
};
