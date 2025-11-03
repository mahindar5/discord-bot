const offKey = 'off';
module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: [
		'eslint:recommended',
		'./Rules/eslint-config-airbnb-base/index',
		'./Rules/eslint-config-airbnb-base/overrides',
	],
	plugins: [
		'@typescript-eslint',
	],
	parser: '@typescript-eslint/parser',

	parserOptions: {
		project: [
			'./tsconfig.json', // Error while loading rule '@typescript-eslint/dot-notation': You have used a rule which requires parserServices to be generated. You must therefore provide a value for the "parserOptions.project" property for @typescript-eslint/parser.
		],
		tsconfigRootDir: __dirname, // Parsing error: Cannot read file 'e:\vso\myrepo\tsconfig.json'.eslint
		createDefaultProgram: true,
		// sourceType: 'module',
		// ecmaVersion: 2020,
	},
	ignorePatterns: ['src/lib'],
	rules: {
		// 'eslint:recommended',
		'no-unused-vars': offKey,
		'no-undef': offKey,
		'prefer-destructuring': offKey,
		'sort-imports': offKey,
		// Off
		// '@typescript-eslint/explicit-member-accessibility': ['error'],
		// 'jsdoc/check-alignment': 'error',
		// '@typescript-eslint/member-delimiter-style': [
		// 	'error',
		// 	{
		// 		multiline: {
		// 			delimiter: 'semi',
		// 			requireLast: true,
		// 		},
		// 		singleline: {
		// 			delimiter: 'semi',
		// 			requireLast: false,
		// 		},
		// 	},
		// ],
	},
};
