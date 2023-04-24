import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";
import { readFileSync } from 'fs';
const pkg = JSON.parse(readFileSync('./package.json', 'utf8'));
export default [{
  input: "src/index.ts",
  output: {
    file: pkg.browser,
    format: "umd",
    name: "HandwritingBoard",
    sourcemap: true,
    exports: 'named',
  },
  plugins: [
    typescript({
      tsconfig: "tsconfig.json"
    }),
    terser(),
  ],
}, {
  input: "src/index.ts",
  output: [{
    file: pkg.main,
    format: "cjs",
    name: pkg.main,
    sourcemap: true,
    exports: 'named',
  }, {
    file: pkg.module,
    format: "es",
    name: pkg.module,
    sourcemap: true,
    exports: 'named',
  }],
  plugins: [
    typescript({
      tsconfig: "tsconfig.json"
    })
  ],
}];