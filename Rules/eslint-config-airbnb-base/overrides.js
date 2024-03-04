const offKey = 'off';
const errorKey = 'error';
module.exports = {
	rules: {
		/// ///////////////////////////
		/// 1.best-practices.js
		/// ///////////////////////////
		'class-methods-use-this': offKey,
		curly: ['error'],
		eqeqeq: offKey, // Check
		'max-classes-per-file': offKey,
		'no-alert': offKey,
		'no-empty-function': ['error', {
			allow: [
				'constructors',
			],
		}],
		// 'no-eval': offKey,
		'no-param-reassign': offKey,
		'no-return-assign': 'off',
		'prefer-promise-reject-errors': 'error',
		radix: 'off',
		'require-await': 'error',

		/// ///////////////////////////
		// error.js
		/// ///////////////////////////
		'no-await-in-loop': offKey,
		'no-console': offKey, // 'warn',

		/// ///////////////////////////
		// es6.js
		/// ///////////////////////////
		'arrow-parens': ['error', 'as-needed'],
		'no-useless-constructor': offKey,
		'prefer-const': ['error', {
			destructuring: 'all', // Edited
			ignoreReadBeforeAssign: true,
		}],
		'sort-imports': [errorKey, {
			ignoreCase: false,
			ignoreDeclarationSort: false,
			ignoreMemberSort: false,
			memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
		}],

		/// ///////////////////////////
		// style.js
		/// ///////////////////////////
		'brace-style': ['error', '1tbs'],
		camelcase: offKey,
		'eol-last': offKey,
		'id-match': errorKey, // ['error', '^[a-z]+([A-Z][a-z]+)*$'], // Check
		'implicit-arrow-linebreak': offKey, // Check
		indent: ['error', 'tab'],
		'linebreak-style': offKey,
		'lines-between-class-members': ['error', 'always', { exceptAfterSingleLine: true }],
		'max-len': offKey,
		'no-bitwise': offKey,
		'no-plusplus': offKey,
		'no-restricted-syntax': offKey, // Check
		'no-tabs': offKey,
		'no-underscore-dangle': errorKey,
		'object-curly-newline': ['error', {
			ObjectExpression: { minProperties: 5, multiline: true, consistent: true },
			ObjectPattern: { minProperties: 4, multiline: true, consistent: true },
			ImportDeclaration: 'never', // { minProperties: 4, multiline: true, consistent: true }, // comeback
			ExportDeclaration: { minProperties: 4, multiline: true, consistent: true },
		}],
		'one-var': offKey, // Check
		'operator-assignment': offKey,

		/// ///////////////////////////
		// variables.js
		/// ///////////////////////////
		'no-restricted-globals': offKey,
	},
};