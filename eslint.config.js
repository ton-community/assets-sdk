const base = require('@ton/toolchain');
const tsEslint = require('@ton/toolchain').tsEslint;

module.exports = [
    ...base,
    {
        plugins: {
            '@typescript-eslint': tsEslint,
        },
        rules: {
            'no-redeclare': 'off',
            '@typescript-eslint/no-redeclare': ['error'],
        },
    },
];
