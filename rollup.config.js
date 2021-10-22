import builtins from 'builtin-modules';
import typescript from '@rollup/plugin-typescript';
import glslify from 'rollup-plugin-glslify';
// import resolve from 'rollup-plugin-node-resolve';
// import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'reaction-diffusion-canvas.ts',
  output: {
    file: 'out/reaction-diffusion-canvas.js',
    // dir: 'out',
    format: 'cjs',
    sourcemap: true,
    // homemade iife wrapper for the output bundle
    banner: '(function() {\n',
    footer: '\n})()',
  },
  external: [...builtins, 'electron'],
  plugins: [
    typescript({ module: 'es2015', outDir: 'out' }),
    glslify(),
    // resolve({
    //   mainFields: ['module', 'main', 'browser'],
    //   extensions: ['.ts', '.tsx', '.js'],
    //   preferBuiltins: true,
    // }),
    // commonjs(),
  ],
};
