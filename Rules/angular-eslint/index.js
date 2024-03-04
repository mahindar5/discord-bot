module.exports = {
	extends: [
		'./rules/all.js',
		'./rules/base.js',
		'./rules/ng-cli-compat--formatting-add-on.js',
		'./rules/ng-cli-compat.js',
		'./rules/recommended--extra.js',
		'./rules/recommended.js',
	].map(require.resolve),
};
