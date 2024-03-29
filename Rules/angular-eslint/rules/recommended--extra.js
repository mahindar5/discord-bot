module.exports = {
	extends: './base',
	rules: {
		'no-restricted-imports': [
			'error',
			{
				paths: [
					{
						name: 'rxjs/Rx',
						message: "Please import directly from 'rxjs' instead",
					},
				],
			},
		],
		'@typescript-eslint/member-ordering': [
			'error',
			{
				default: [
					'static-field',
					'instance-field',
					'static-method',
					'instance-method',
				],
			},
		],
		'no-restricted-syntax': [
			'error',
			{
				selector: 'CallExpression[callee.object.name="console"][callee.property.name=/^(debug|info|time|timeEnd|trace)$/]',
				message: 'Unexpected property on console object was called',
			},
		],
		'@typescript-eslint/no-inferrable-types': [
			'error',
			{ ignoreParameters: true },
		],
		'@typescript-eslint/no-non-null-assertion': 'error',
		'no-fallthrough': 'error',
	},
};