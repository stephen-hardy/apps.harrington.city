import fs from 'node:fs/promises'; import pth from 'node:path'; import strip from 'strip-comments';
const root = pth.join(process.argv[1], '../..'), isGit = process.argv[1].startsWith('/github/workspace/'),
	buildMS = Date.now(), htmlCommRx = /<!--(?!-?>)(?:[^<-]|<(?!!--(?!>))|-(?!-!>))*?(?<!<!-)-->/g;
console.log('build.mjs', root);
const excludedFolders = ['node_modules', '.git', '.github', '.vscode', 'api', 'build'],
	excludedExts = [
		// media
			'png', 'webp', 'jpg', 'mp4', 'ico', 'xbs',
		// font
			'ttf', 'woff', 'woff2',
		// text
			'md', 'cjs', 'csv', 'TODO'
	];
async function save(path, oldContent, newContent) {
	const savePath = isGit ? path : pth.join(root, 'build', 'output', pth.relative(root, path));
	isGit || await fs.mkdir(pth.join(savePath, '..'), { recursive: true });
	if (oldContent === newContent) { return; }
	return fs.writeFile(savePath, newContent, 'utf8');
}
async function processFile(path) {
	const ext = path.split('.').at(-1);
	if (path.includes('.min.')) { return; } // console.log('minified file', path); }
	if (path.split('/').at(-1)[0] === '.') { return; } // console.log('hidden file', path); }
	if (excludedExts.includes(ext)) { return; } // console.log('excluded extension', path); }
	console.log('processFile', path.slice(root.length));
	const oldContent = await fs.readFile(path, 'utf8'); let newContent = oldContent;
	if (['mjs', 'js', 'css'].includes(ext)) { newContent = `/* ${buildMS} */\n${strip(newContent, { preserveNewlines: true })}` } // strip-comments doesn't appear to support HTML comments, as it claims
	else if (ext === 'html') { newContent = `<!-- ${buildMS} -->\n${newContent.replace(htmlCommRx, '')}`; }
	await save(path, oldContent, newContent);
}
async function crawlDir(path) {
	console.log('crawlDir', path.slice(root.length) || '/');
	for (const item of await fs.readdir(path)) {
		const itemPath = `${path}/${item}`;
		if ((await fs.stat(itemPath)).isDirectory()) {
			if (excludedFolders.includes(item)) { continue; } // console.log('excluded folder', itemPath); continue; }
			await crawlDir(itemPath);
		}
		else { await processFile(itemPath); }
	}
}
await crawlDir(root);
// await fs.writeFile('buildTest.txt', new Date().toLocaleString() + ' ' + process.argv, 'utf8');