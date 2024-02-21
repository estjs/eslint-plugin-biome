

import { ESLint, RuleTester } from 'eslint';

import eslintPluginBiome from '../dist/index.mjs';


const rule = eslintPluginBiome.rules.biome

const valids = [
  'const a = { foo:"bar", bar:2 }',
]

// Check snapshot for fixed code
const invalids =   [
  'const foo = (x, y) => \nx + y',
  'const foo = (x, y) => {\n return x + y; \n}',
]

const ruleTester = new RuleTester()

ruleTester.run("biome", rule , {
  valid: valids,
  invalid: invalids.map(i => ({
    code: i[0],
    output: i[1],
    errors: [{ messageId: 'biome error' }],
  })),
})
