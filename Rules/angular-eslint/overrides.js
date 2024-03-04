const offKey = 'off';
module.exports = {
	rules: {
		'space-before-function-paren': [
			'error',
			{
				anonymous: 'always',
				asyncArrow: 'always',
				named: 'never',
			},
		],
		'@typescript-eslint/quotes': offKey, // coverred in airbnb

		'@angular-eslint/component-class-suffix': [
			'error',
			{
				suffixes: [
					'Page',
					'Component',
				],
			},
		],
		'@angular-eslint/component-selector': [
			'error',
			{
				type: 'element',
				// prefix: 'app',
				style: 'kebab-case',
			},
		],
		'@angular-eslint/directive-selector': [
			'error',
			{
				type: 'attribute',
				// prefix: 'app',
				style: 'camelCase',
			},
		],
		'@typescript-eslint/naming-convention': offKey,
		'prefer-arrow/prefer-arrow-functions': offKey,

		'@angular-eslint/no-empty-lifecycle-method': offKey,
		'@angular-eslint/prefer-on-push-component-change-detection': offKey,
		'@angular-eslint/relative-url-prefix': offKey,
	},
};