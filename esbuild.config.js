import esbuild from 'esbuild';

// Simple esbuild configuration
const config = {
	entryPoints: ['src/index.ts'],
	bundle: true,
	platform: 'node',
	outdir: 'build',
	external: ['discord.js', '@mahindar5/common-lib', 'dotenv']
};

// Get command from arguments
const command = process.argv[2];

if (command === 'watch') {
	// Development mode with watching
	const ctx = await esbuild.context(config);
	await ctx.watch();
	console.log('👀 Watching...');
} else if (command === 'deploy') {
	// Build deploy commands
	try {
		await esbuild.build({
			...config,
			entryPoints: ['src/deploy-commands.ts']
		});
		console.log('✅ Deploy commands built');
	} catch {
		process.exit(1);
	}
} else {
	// Regular build
	try {
		await esbuild.build(config);
		console.log('✅ Build complete');
	} catch {
		process.exit(1);
	}
}
