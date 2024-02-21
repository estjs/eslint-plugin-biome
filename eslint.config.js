import { estjs } from '@estjs/eslint-config';

export default estjs( {
  javascript: {
    'unused-imports/no-unused-imports': 'off',
    "unused-imports/no-unused-vars":"off",
    "no-console":'off'
  },
  unicorn:{
    "unicorn/filename-case":"off"
  },
  imports:{
    'import/no-default-export': 'off',
  }
});
