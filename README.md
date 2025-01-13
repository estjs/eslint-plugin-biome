# eslint-plugin-biome
Runs [Biome](https://biomejs.dev/) as an [ESLint](https://eslint.org/) rule and reports differences as individual ESLint issues.
## Installation

```bash
npm install eslint-plugin-biome
``` 

## Usage
 eslint.config.js

```json
 {
  plugins: ['biome'],
  rules: {
    'biome/biome': 'off',
  },
}
```


## config rule
 eslint.config.js
```json
 {
  plugins: ['biome'],
  rules: {
    'biome/biome': ['error', {
      // biome config json options
    }],
  },
}
```
