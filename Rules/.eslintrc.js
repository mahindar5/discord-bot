const offKey = 'off';
module.exports = {
	env: {
		browser: true,
		es2021: true,
	},
	extends: [
		'eslint:recommended',
		'./eslint-config-airbnb-base/index',
	],
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
	},
	globals: {},
	rules: {
		// 'eslint:recommended',
		'no-unused-vars': offKey,
		'no-undef': offKey,
		'prefer-destructuring': offKey,
	},
};
