/* eslint-disable no-console */
import fs from 'node:fs/promises'; import pth from 'node:path'; import process from 'node:process';
import strip from 'strip-comments';
const root = pth.join(process.argv[1], '../..'), isCF = process.argv[1].startsWith('/opt/buildhome/'),
	buildMS = Date.now(), htmlCommRx = /<!--(?!-|>)(?:[^<-]|<(?!!--(?!>))|-(?!-!>))*?(?<!<!-)-->/g,
	excludedFolders = ['node_modules', '.git', '.github', '.vscode', 'functions', 'build'],
	excludedExts = [
		// media
			'png', 'webp', 'jpg', 'mp4', 'ico', 'xbs',
		// font
			'ttf', 'woff', 'woff2', 'otf',
		// text
			'md', 'cjs', 'csv', 'TODO'
	],
	deleteFolder = [
		(_folderName, path) => path === '/build'
	],
	deleteFile = [
		fileName => fileName[0] === '.',
		fileName => fileName === 'package.json',
		fileName => fileName === 'package-lock.json',
		fileName => fileName === 'todo',
		fileName => fileName.endsWith('.md')
	];
console.log('build.mjs', root, 'isCF=' + isCF, process.argv);
const buildOutput = {
	time: buildMS, timePST: new Date(buildMS).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }),
	version: process.version,
	files: []
};
async function save(path, newContent, oldContent) {
	const savePath = isCF ? path : pth.join(root, 'build', 'output', pth.relative(root, path));
	isCF || await fs.mkdir(pth.join(savePath, '..'), { recursive: true });
	return oldContent === newContent || fs.writeFile(savePath, newContent, 'utf8');
}
async function processFile(path) {
	const ext = path.split('.').at(-1);
	buildOutput.files.push(path.slice(root.length));
	if (path.includes('.min.')) { return; } // console.log('minified file', path); }
	if (excludedExts.includes(ext)) { return; } // console.log('excluded extension', path); }
	console.log('processFile', path.slice(root.length));
	const oldContent = await fs.readFile(path, 'utf8'); let newContent = oldContent;
	if (['mjs', 'js', 'css'].includes(ext)) { newContent = `/* ${buildMS} */\n${strip(newContent, { preserveNewlines: true })}` } // strip-comments doesn't appear to support HTML comments, as it claims
	else if (ext === 'html') { newContent = `<!-- ${buildMS} -->\n${newContent.replace(htmlCommRx, '')}`; }
	await save(path, newContent, oldContent);
}
async function crawlDir(path) {
	console.log('crawlDir', path.slice(root.length) || '/'); const ls = { files: [], folders: [] };
	for (const item of await fs.readdir(path)) {
		const itemPath = `${path}/${item}`, rootPath = itemPath.slice(root.length);
		if ((await fs.stat(itemPath)).isDirectory()) {
			if (isCF && deleteFolder.some(fn => fn(item, rootPath))) {
				await fs.rm(itemPath, { recursive: true, force: true });
				console.log('deleted folder: ' + rootPath);
				continue;
			}
			if (excludedFolders.includes(item)) { continue; } // console.log('excluded folder', itemPath); continue; }
			await crawlDir(itemPath);
			ls.folders.push({ name: item, path: rootPath });
		}
		else if (isCF && deleteFile.some(fn => fn(item, rootPath))) {
			await fs.rm(itemPath);
			console.log('deleted file: ' + rootPath);
		}
		else { await processFile(itemPath); ls.files.push({ name: item, path: rootPath }); }
	}
	await save(pth.join(path, 'ls.json'), JSON.stringify(ls, null, '\t'));
}
await crawlDir(root);
await save('buildOutput.json', JSON.stringify(buildOutput, null, '\t'));